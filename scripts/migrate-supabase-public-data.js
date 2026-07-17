const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const envFile = path.join(repoRoot, '.env.local')
const DEFAULT_OUTPUT_PATH = path.join(repoRoot, 'tmp', 'supabase-public-export.json')
const PAGE_SIZE = 1000
const EXPORT_TABLES = [
  {
    name: 'report_categories',
    select: 'code,label_sr,description,sort_order',
    orderBy: 'sort_order.asc,code.asc',
    upsertColumn: 'code',
  },
  {
    name: 'report_statuses',
    select: 'code,label_sr,description,sort_order',
    orderBy: 'sort_order.asc,code.asc',
    upsertColumn: 'code',
  },
  {
    name: 'settlements',
    select: 'id,name,municipality,district,region,place_type,latitude,longitude,created_at,updated_at',
    orderBy: 'name.asc,id.asc',
    upsertColumn: 'id',
  },
  {
    name: 'users',
    select: 'id,email,full_name,avatar_url,role,is_public,is_admin,created_at,updated_at,picker_allowed',
    orderBy: 'created_at.asc,id.asc',
    upsertColumn: 'id',
  },
  {
    name: 'reports',
    select: 'id,user_id,title,description,category,latitude,longitude,photo_url,photo_path,photo_object_id,status,priority,tags,upvotes,views,created_at,updated_at,resolved_at',
    orderBy: 'created_at.asc,id.asc',
    upsertColumn: 'id',
  },
]

function loadEnv() {
  if (!fs.existsSync(envFile)) {
    return
  }

  const envLines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/)

  for (const rawLine of envLines) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const name = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[name]) {
      process.env[name] = value
    }
  }
}

function parseArgs(argv) {
  const [command, outputArg] = argv

  if (!command || !['export', 'import'].includes(command)) {
    throw new Error('Usage: node scripts/migrate-supabase-public-data.js <export|import> [path-to-json]')
  }

  return {
    command,
    outputPath: path.resolve(repoRoot, outputArg || DEFAULT_OUTPUT_PATH),
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function getSourceConfig() {
  const url = process.env.SUPABASE_SOURCE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SOURCE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Set SUPABASE_SOURCE_URL and SUPABASE_SOURCE_KEY, or provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.')
  }

  return { url, key }
}

function getTargetConfig() {
  const url = process.env.SUPABASE_TARGET_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_TARGET_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Set SUPABASE_TARGET_URL and SUPABASE_TARGET_KEY, or provide SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY in the environment.')
  }

  return { url, key }
}

function buildHeaders(key, extraHeaders = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extraHeaders,
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}: ${text}`)
  }

  return {
    data,
    headers: response.headers,
  }
}

async function fetchTableRows(sourceConfig, table) {
  const rows = []

  for (let start = 0; ; start += PAGE_SIZE) {
    const end = start + PAGE_SIZE - 1
    const tableUrl = new URL(`/rest/v1/${table.name}`, sourceConfig.url)
    tableUrl.searchParams.set('select', table.select)
    tableUrl.searchParams.set('order', table.orderBy)

    const { data } = await fetchJson(tableUrl, {
      headers: buildHeaders(sourceConfig.key, {
        Range: `${start}-${end}`,
        Prefer: 'count=exact',
      }),
    })

    if (!Array.isArray(data) || data.length === 0) {
      break
    }

    rows.push(...data)

    if (data.length < PAGE_SIZE) {
      break
    }
  }

  return rows
}

function normalizeRows(tableName, rows) {
  if (tableName !== 'users') {
    return rows
  }

  return rows.map((row) => ({
    ...row,
    picker_allowed: Boolean(row.picker_allowed),
    is_admin: Boolean(row.is_admin),
    is_public: Boolean(row.is_public),
  }))
}

async function exportData(outputPath) {
  const sourceConfig = getSourceConfig()
  const exportedAt = new Date().toISOString()
  const payload = {
    exportedAt,
    sourceUrl: sourceConfig.url,
    tables: {},
  }

  for (const table of EXPORT_TABLES) {
    const rows = await fetchTableRows(sourceConfig, table)
    payload.tables[table.name] = normalizeRows(table.name, rows)
    console.log(`Exported ${rows.length} rows from ${table.name}.`)
  }

  ensureDir(outputPath)
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2))
  console.log(`Saved export to ${outputPath}.`)
}

async function upsertTableRows(targetConfig, table, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`Skipping ${table.name}; no rows to import.`)
    return
  }

  for (let start = 0; start < rows.length; start += PAGE_SIZE) {
    const batch = rows.slice(start, start + PAGE_SIZE)
    const tableUrl = new URL(`/rest/v1/${table.name}`, targetConfig.url)
    tableUrl.searchParams.set('on_conflict', table.upsertColumn)

    await fetchJson(tableUrl, {
      method: 'POST',
      headers: buildHeaders(targetConfig.key, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(batch),
    })

    console.log(`Imported ${Math.min(start + PAGE_SIZE, rows.length)}/${rows.length} rows into ${table.name}.`)
  }
}

async function importData(inputPath) {
  const targetConfig = getTargetConfig()

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Export file not found: ${inputPath}`)
  }

  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'))

  if (!payload || typeof payload !== 'object' || !payload.tables) {
    throw new Error('Invalid export payload; expected a top-level { tables: { ... } } object.')
  }

  for (const table of EXPORT_TABLES) {
    const rows = normalizeRows(table.name, payload.tables[table.name] || [])
    await upsertTableRows(targetConfig, table, rows)
  }

  console.log(`Imported data from ${inputPath}.`)
}

async function main() {
  loadEnv()

  const { command, outputPath } = parseArgs(process.argv.slice(2))

  if (command === 'export') {
    await exportData(outputPath)
    return
  }

  await importData(outputPath)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})