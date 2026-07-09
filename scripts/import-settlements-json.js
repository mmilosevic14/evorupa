const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const repoRoot = path.resolve(__dirname, '..')
const envFile = path.join(repoRoot, '.env.local')

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

const databaseUrl =
  process.env.SUPABASE_SESSION_DATABASE_URL ||
  process.env.SUPABASE_DB_CONNECTION ||
  process.env.SUPABASE_DATABASE_URL

if (!databaseUrl) {
  throw new Error('Set SUPABASE_SESSION_DATABASE_URL, SUPABASE_DB_CONNECTION, or SUPABASE_DATABASE_URL before importing settlements.')
}

const inputPath = process.argv[2]

if (!inputPath) {
  throw new Error('Provide a path to a JSON file with settlements. Example: node scripts/import-settlements-json.js data/serbia-settlements-full.json')
}

const absoluteInputPath = path.resolve(repoRoot, inputPath)

if (!fs.existsSync(absoluteInputPath)) {
  throw new Error(`File not found: ${absoluteInputPath}`)
}

const rawData = JSON.parse(fs.readFileSync(absoluteInputPath, 'utf8'))
const settlements = Array.isArray(rawData) ? rawData : rawData.settlements

if (!Array.isArray(settlements) || settlements.length === 0) {
  throw new Error('JSON file must contain a non-empty array or a { settlements: [] } object.')
}

function normalizeSettlement(settlement) {
  return {
    name: String(settlement.name || '').trim(),
    municipality: String(settlement.municipality || '').trim(),
    district: String(settlement.district || '').trim(),
    region: String(settlement.region || 'Srbija').trim() || 'Srbija',
    place_type: String(settlement.place_type || settlement.placeType || '').trim(),
    latitude: Number(settlement.latitude),
    longitude: Number(settlement.longitude),
  }
}

const normalizedSettlements = settlements.map(normalizeSettlement)
const INSERT_COLUMNS = ['name', 'municipality', 'district', 'region', 'place_type', 'latitude', 'longitude']
const INSERT_BATCH_SIZE = 250
const MAX_BATCH_RETRIES = 3

for (const settlement of normalizedSettlements) {
  if (!settlement.name || !settlement.municipality || !settlement.place_type) {
    throw new Error(`Invalid settlement entry: ${JSON.stringify(settlement)}`)
  }

  if (!Number.isFinite(settlement.latitude) || !Number.isFinite(settlement.longitude)) {
    throw new Error(`Invalid coordinates for settlement: ${JSON.stringify(settlement)}`)
  }
}

function buildBatchQuery(batch) {
  const values = []
  const placeholders = batch.map((settlement, settlementIndex) => {
    const rowOffset = settlementIndex * INSERT_COLUMNS.length

    values.push(
      settlement.name,
      settlement.municipality,
      settlement.district || null,
      settlement.region,
      settlement.place_type,
      settlement.latitude,
      settlement.longitude,
    )

    return `(${INSERT_COLUMNS.map((_, columnIndex) => `$${rowOffset + columnIndex + 1}`).join(', ')})`
  })

  return {
    text: `
      INSERT INTO public.settlements (${INSERT_COLUMNS.join(', ')})
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (name, municipality, district)
      DO UPDATE SET
        region = EXCLUDED.region,
        place_type = EXCLUDED.place_type,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = NOW()
    `,
    values,
  }
}

async function runBatch(batch, batchNumber, batchCount) {
  const query = buildBatchQuery(batch)

  for (let attempt = 1; attempt <= MAX_BATCH_RETRIES; attempt += 1) {
    const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

    try {
      await client.connect()
      await client.query(query.text, query.values)
      await client.end()
      console.log(`Imported batch ${batchNumber}/${batchCount} (${batch.length} settlements).`)
      return
    } catch (error) {
      await client.end().catch(() => undefined)

      if (attempt === MAX_BATCH_RETRIES) {
        throw error
      }

      console.warn(`Retrying batch ${batchNumber}/${batchCount} after error: ${error.message}`)
    }
  }
}

async function main() {
  const batchCount = Math.ceil(normalizedSettlements.length / INSERT_BATCH_SIZE)

  for (let batchStartIndex = 0; batchStartIndex < normalizedSettlements.length; batchStartIndex += INSERT_BATCH_SIZE) {
    const batch = normalizedSettlements.slice(batchStartIndex, batchStartIndex + INSERT_BATCH_SIZE)
    const batchNumber = Math.floor(batchStartIndex / INSERT_BATCH_SIZE) + 1

    await runBatch(batch, batchNumber, batchCount)
  }

  console.log(`Imported ${normalizedSettlements.length} settlements from ${inputPath}.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})