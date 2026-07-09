const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const fallbackDistrictsPath = path.join(repoRoot, 'data', 'serbia-districts.json')
const defaultOutputPath = path.join(repoRoot, 'data', 'serbia-settlements-full.json')

const DISTRICT_CODE_MAP = {
  'RS.SE.0': 'Grad Beograd',
  'RS.SE.8': 'Mačvanski upravni okrug',
  'RS.SE.9': 'Kolubarski upravni okrug',
  'RS.SE.10': 'Podunavski upravni okrug',
  'RS.SE.11': 'Braničevski upravni okrug',
  'RS.SE.12': 'Šumadijski upravni okrug',
  'RS.SE.13': 'Pomoravski upravni okrug',
  'RS.SE.14': 'Borski upravni okrug',
  'RS.SE.15': 'Zaječarski upravni okrug',
  'RS.SE.16': 'Zlatiborski upravni okrug',
  'RS.SE.17': 'Moravički upravni okrug',
  'RS.SE.18': 'Raški upravni okrug',
  'RS.SE.19': 'Rasinski upravni okrug',
  'RS.SE.20': 'Nišavski upravni okrug',
  'RS.SE.21': 'Toplički upravni okrug',
  'RS.SE.22': 'Pirotski upravni okrug',
  'RS.SE.23': 'Jablanički upravni okrug',
  'RS.SE.24': 'Pčinjski upravni okrug',
  'RS.VO.1': 'Severnobački upravni okrug',
  'RS.VO.2': 'Srednjobanatski upravni okrug',
  'RS.VO.3': 'Severnobanatski upravni okrug',
  'RS.VO.4': 'Južnobanatski upravni okrug',
  'RS.VO.5': 'Zapadnobački upravni okrug',
  'RS.VO.6': 'Južnobački upravni okrug',
  'RS.VO.7': 'Sremski upravni okrug',
}

const DISTRICT_NAME_ALIASES = {
  severnobacki: 'Severnobački upravni okrug',
  zapadnobacki: 'Zapadnobački upravni okrug',
  severnobanatski: 'Severnobanatski upravni okrug',
  pcinjski: 'Pčinjski upravni okrug',
  borski: 'Borski upravni okrug',
  zajecarski: 'Zaječarski upravni okrug',
  pirotski: 'Pirotski upravni okrug',
  jablanicki: 'Jablanički upravni okrug',
  raski: 'Raški upravni okrug',
  pomoravski: 'Pomoravski upravni okrug',
  toplicki: 'Toplički upravni okrug',
  zlatiborski: 'Zlatiborski upravni okrug',
  sremski: 'Sremski upravni okrug',
  macvanski: 'Mačvanski upravni okrug',
  juznobacki: 'Južnobački upravni okrug',
  srednjebanatski: 'Srednjobanatski upravni okrug',
  juznobanatski: 'Južnobanatski upravni okrug',
  branicevski: 'Braničevski upravni okrug',
  gradbeograd: 'Grad Beograd',
  podunavski: 'Podunavski upravni okrug',
  nisavski: 'Nišavski upravni okrug',
  sumadijski: 'Šumadijski upravni okrug',
  moravicki: 'Moravički upravni okrug',
  kolubarski: 'Kolubarski upravni okrug',
}

function parseArgs(argv) {
  const args = {
    geonames: '',
    admin2: '',
    districts: fallbackDistrictsPath,
    output: defaultOutputPath,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--geonames') {
      args.geonames = argv[index + 1] || ''
      index += 1
      continue
    }

    if (token === '--districts') {
      args.districts = argv[index + 1] || fallbackDistrictsPath
      index += 1
      continue
    }

    if (token === '--admin2') {
      args.admin2 = argv[index + 1] || ''
      index += 1
      continue
    }

    if (token === '--output') {
      args.output = argv[index + 1] || defaultOutputPath
      index += 1
    }
  }

  if (!args.geonames) {
    throw new Error('Provide --geonames path/to/RS.txt')
  }

  return args
}

function toDistrictKey(rawName) {
  return String(rawName || '')
    .trim()
    .replace(/Å¡/g, 'š')
    .replace(/Å¾/g, 'ž')
    .replace(/Å /g, 'Š')
    .replace(/Ä/g, 'č')
    .replace(/Ä/g, 'ć')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase()
}

function normalizeDistrictName(rawName) {
  const normalized = String(rawName || '').trim()

  if (DISTRICT_CODE_MAP[normalized]) {
    return DISTRICT_CODE_MAP[normalized]
  }

  return DISTRICT_NAME_ALIASES[toDistrictKey(rawName)] || normalized
}

function toMultiPolygonCoordinates(feature) {
  return feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates
}

function pointIsInsideRing(latitude, longitude, ring) {
  let isInside = false

  for (let currentIndex = 0, previousIndex = ring.length - 1; currentIndex < ring.length; previousIndex = currentIndex++) {
    const [currentLongitude, currentLatitude] = ring[currentIndex]
    const [previousLongitude, previousLatitude] = ring[previousIndex]

    const intersects =
      currentLatitude > latitude !== previousLatitude > latitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
          currentLongitude

    if (intersects) {
      isInside = !isInside
    }
  }

  return isInside
}

function pointIsInsidePolygon(latitude, longitude, polygon) {
  if (!polygon.length || !pointIsInsideRing(latitude, longitude, polygon[0])) {
    return false
  }

  for (let holeIndex = 1; holeIndex < polygon.length; holeIndex += 1) {
    if (pointIsInsideRing(latitude, longitude, polygon[holeIndex])) {
      return false
    }
  }

  return true
}

function loadDistrictBoundaries(filePath) {
  const geoJson = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  return geoJson.features.map((feature) => ({
    district: normalizeDistrictName(feature.properties.name),
    polygons: toMultiPolygonCoordinates(feature),
  }))
}

function findDistrictByPoint(latitude, longitude, boundaries) {
  for (const feature of boundaries) {
    const isMatch = feature.polygons.some((polygon) => pointIsInsidePolygon(latitude, longitude, polygon))

    if (isMatch) {
      return feature.district
    }
  }

  return ''
}

function normalizeMunicipalityName(name) {
  return String(name || '')
    .trim()
    .replace(/^Opština\s+/i, '')
    .replace(/^Opstina\s+/i, '')
    .replace(/^Grad\s+/i, '')
    .replace(/^City Municipality of\s+/i, '')
}

function toMunicipalityKey(admin1Code, admin2Code, admin3Code) {
  return [admin1Code, admin2Code, admin3Code].map((part) => String(part || '').trim()).join('|')
}

function toDistrictCode(admin1Code, admin2Code) {
  const normalizedAdmin1 = String(admin1Code || '').trim()
  const normalizedAdmin2 = String(admin2Code || '').trim()

  if (!normalizedAdmin1 || !normalizedAdmin2) {
    return ''
  }

  return `RS.${normalizedAdmin1}.${normalizedAdmin2}`
}

function shouldIncludePlace(featureCode) {
  if (!featureCode.startsWith('PPL')) {
    return false
  }

  return featureCode !== 'PPLQ' && featureCode !== 'PPLW'
}

function toPlaceType(featureCode, population) {
  if (featureCode === 'PPLC' || featureCode === 'PPLA' || featureCode === 'PPLA2') {
    return 'city'
  }

  if (featureCode === 'PPLA3' || featureCode === 'PPLA4') {
    return 'town'
  }

  if (population >= 15000) {
    return 'town'
  }

  if (population >= 1000) {
    return 'village'
  }

  return 'hamlet'
}

function toFeaturePriority(featureCode) {
  switch (featureCode) {
    case 'PPLC':
      return 6
    case 'PPLA':
      return 5
    case 'PPLA2':
      return 4
    case 'PPLA3':
      return 3
    case 'PPLA4':
      return 2
    default:
      return 1
  }
}

function buildMunicipalityMap(lines) {
  const municipalities = new Map()

  for (const line of lines) {
    const parts = line.split('\t')
    const featureCode = parts[7]

    if (featureCode !== 'ADM3') {
      continue
    }

    const key = toMunicipalityKey(parts[10], parts[11], parts[12])
    const municipality = normalizeMunicipalityName(parts[1] || parts[2])

    if (key && municipality) {
      municipalities.set(key, municipality)
    }
  }

  return municipalities
}

function buildAdmin2DistrictMap(lines) {
  const districts = new Map()

  for (const line of lines) {
    const parts = line.split('\t')
    const code = String(parts[0] || '').trim()

    if (!code.startsWith('RS.')) {
      continue
    }

    const districtName = normalizeDistrictName(DISTRICT_CODE_MAP[code] || parts[1] || parts[2] || code)

    if (districtName) {
      districts.set(code, districtName)
    }
  }

  return districts
}

function buildSettlements(lines, municipalityMap, districtBoundaries, admin2DistrictMap) {
  const settlements = new Map()

  for (const line of lines) {
    const parts = line.split('\t')
    const featureClass = parts[6]
    const featureCode = parts[7]

    if (featureClass !== 'P' || !shouldIncludePlace(featureCode)) {
      continue
    }

    const name = String(parts[1] || '').trim()
    const latitude = Number(parts[4])
    const longitude = Number(parts[5])

    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue
    }

    const municipalityKey = toMunicipalityKey(parts[10], parts[11], parts[12])
    const municipality = municipalityMap.get(municipalityKey) || name
    const districtCode = toDistrictCode(parts[10], parts[11])
    const district =
      findDistrictByPoint(latitude, longitude, districtBoundaries) ||
      admin2DistrictMap.get(districtCode) ||
      ''
    const population = Number(parts[14] || 0)
    const settlement = {
      name,
      municipality,
      district,
      region: 'Srbija',
      place_type: toPlaceType(featureCode, population),
      latitude,
      longitude,
    }

    const key = `${settlement.name.toLowerCase()}|${settlement.municipality.toLowerCase()}|${settlement.district.toLowerCase()}`
    const candidateScore = population * 10 + toFeaturePriority(featureCode)
    const existing = settlements.get(key)

    if (!existing || existing.score < candidateScore) {
      settlements.set(key, {
        score: candidateScore,
        value: settlement,
      })
    }
  }

  return Array.from(settlements.values())
    .map((entry) => entry.value)
    .sort((left, right) => {
      const districtCompare = left.district.localeCompare(right.district, 'sr')

      if (districtCompare !== 0) {
        return districtCompare
      }

      const municipalityCompare = left.municipality.localeCompare(right.municipality, 'sr')

      if (municipalityCompare !== 0) {
        return municipalityCompare
      }

      return left.name.localeCompare(right.name, 'sr')
    })
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const geonamesPath = path.resolve(repoRoot, args.geonames)
  const admin2Path = args.admin2 ? path.resolve(repoRoot, args.admin2) : ''
  const districtsPath = path.resolve(repoRoot, args.districts)
  const outputPath = path.resolve(repoRoot, args.output)

  if (!fs.existsSync(geonamesPath)) {
    throw new Error(`GeoNames file not found: ${geonamesPath}`)
  }

  if (!fs.existsSync(districtsPath)) {
    throw new Error(`Districts GeoJSON file not found: ${districtsPath}`)
  }

  if (admin2Path && !fs.existsSync(admin2Path)) {
    throw new Error(`Admin2 file not found: ${admin2Path}`)
  }

  const rawLines = fs.readFileSync(geonamesPath, 'utf8').split(/\r?\n/).filter(Boolean)
  const admin2Lines = admin2Path ? fs.readFileSync(admin2Path, 'utf8').split(/\r?\n/).filter(Boolean) : []
  const municipalityMap = buildMunicipalityMap(rawLines)
  const admin2DistrictMap = buildAdmin2DistrictMap(admin2Lines)
  const districtBoundaries = loadDistrictBoundaries(districtsPath)
  const settlements = buildSettlements(rawLines, municipalityMap, districtBoundaries, admin2DistrictMap)

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify({ settlements }, null, 2)}\n`)

  console.log(`Built ${settlements.length} Serbian settlements in ${path.relative(repoRoot, outputPath)}.`)
}

main()