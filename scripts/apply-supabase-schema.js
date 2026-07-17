const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const repoRoot = path.resolve(__dirname, '..')
const envFile = path.join(repoRoot, '.env.local')
const schemaFile = path.join(__dirname, 'bootstrap-supabase.sql')

function getDirectDatabaseHost() {
  const projectUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_SOURCE_URL ||
    process.env.SUPABASE_TARGET_URL

  if (!projectUrl) {
    return null
  }

  try {
    const hostname = new URL(projectUrl).hostname
    const hostParts = hostname.split('.')

    if (hostParts.length >= 3 && hostParts.slice(1).join('.') === 'supabase.co') {
      return `db.${hostParts[0]}.supabase.co`
    }
  } catch {
    return null
  }

  return null
}

if (fs.existsSync(envFile)) {
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

let databaseUrl =
  process.env.SUPABASE_SESSION_DATABASE_URL ||
  process.env.SUPABASE_DB_CONNECTION ||
  process.env.SUPABASE_DATABASE_URL

if (!databaseUrl && process.env.SUPABASE_DB_PASSWORD) {
  const escapedPassword = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)
  const directHost = getDirectDatabaseHost()

  if (directHost) {
    databaseUrl = `postgresql://postgres:${escapedPassword}@${directHost}:5432/postgres`
  }
}

if (!databaseUrl) {
  throw new Error(
    'Set SUPABASE_SESSION_DATABASE_URL, SUPABASE_DB_CONNECTION, SUPABASE_DATABASE_URL, or SUPABASE_DB_PASSWORD before applying the Supabase schema.',
  )
}

if (!fs.existsSync(schemaFile)) {
  throw new Error(`Schema file not found: ${schemaFile}`)
}

const sql = fs.readFileSync(schemaFile, 'utf8')

async function main() {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

  await client.connect()

  try {
    await client.query(sql)
    console.log('Supabase schema applied successfully.')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  if (typeof error.message === 'string' && error.message.includes('ENOTFOUND db.')) {
    console.error(
      'The configured direct Supabase database host is IPv6-only from this environment. Set SUPABASE_SESSION_DATABASE_URL to the Session Pooler connection string from the Supabase dashboard and rerun the schema apply.',
    )
    process.exit(1)
  }

  console.error(error.message)
  process.exit(1)
})