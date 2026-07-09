const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const defaultInputPath = path.join(repoRoot, 'data', 'serbia-settlements-full.json')
const defaultOutputPath = path.join(repoRoot, 'scripts', 'seed-serbia-settlements-full.sql')
const INSERT_COLUMNS = ['name', 'municipality', 'district', 'region', 'place_type', 'latitude', 'longitude']
const BATCH_SIZE = 500

function parseArgs(argv) {
  const args = {
    input: defaultInputPath,
    output: defaultOutputPath,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--input') {
      args.input = argv[index + 1] || defaultInputPath
      index += 1
      continue
    }

    if (token === '--output') {
      args.output = argv[index + 1] || defaultOutputPath
      index += 1
    }
  }

  return args
}

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''")
}

function toSqlValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'NULL'
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL'
  }

  return `'${escapeSqlString(value)}'`
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const inputPath = path.resolve(repoRoot, args.input)
  const outputPath = path.resolve(repoRoot, args.output)

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`)
  }

  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  const settlements = Array.isArray(rawData) ? rawData : rawData.settlements

  if (!Array.isArray(settlements) || settlements.length === 0) {
    throw new Error('Expected a non-empty settlements array.')
  }

  const statements = []

  statements.push('-- Generated from data/serbia-settlements-full.json')
  statements.push('-- Safe to run in Supabase SQL Editor')
  statements.push('')

  for (let batchStartIndex = 0; batchStartIndex < settlements.length; batchStartIndex += BATCH_SIZE) {
    const batch = settlements.slice(batchStartIndex, batchStartIndex + BATCH_SIZE)
    const values = batch.map((settlement) => {
      const row = [
        settlement.name,
        settlement.municipality,
        settlement.district || null,
        settlement.region || 'Srbija',
        settlement.place_type || settlement.placeType,
        Number(settlement.latitude),
        Number(settlement.longitude),
      ]

      return `  (${row.map(toSqlValue).join(', ')})`
    })

    statements.push(`INSERT INTO public.settlements (${INSERT_COLUMNS.join(', ')})`)
    statements.push('VALUES')
    statements.push(values.join(',\n'))
    statements.push('ON CONFLICT (name, municipality, district)')
    statements.push('DO UPDATE SET')
    statements.push('  region = EXCLUDED.region,')
    statements.push('  place_type = EXCLUDED.place_type,')
    statements.push('  latitude = EXCLUDED.latitude,')
    statements.push('  longitude = EXCLUDED.longitude,')
    statements.push('  updated_at = NOW();')
    statements.push('')
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${statements.join('\n')}\n`)

  console.log(`Exported ${settlements.length} settlements to ${path.relative(repoRoot, outputPath)}.`)
}

main()