const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const repoRoot = path.resolve(__dirname, '..')
const envFile = path.join(repoRoot, '.env.local')
const sqlFile = path.join(__dirname, 'seed-serbia-settlements.sql')

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
  throw new Error('Set SUPABASE_SESSION_DATABASE_URL, SUPABASE_DB_CONNECTION, or SUPABASE_DATABASE_URL before seeding settlements.')
}

const sql = fs.readFileSync(sqlFile, 'utf8')

async function main() {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

  await client.connect()

  try {
    await client.query(sql)
    console.log('Serbian settlements seeded successfully.')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})