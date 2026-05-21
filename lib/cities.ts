export type City = {
  name: string
  country: string
  region: string
}

const CITY_CATALOG: City[] = [
  { name: 'Belgrade', country: 'Serbia', region: 'Belgrade' },
  { name: 'Novi Sad', country: 'Serbia', region: 'Vojvodina' },
  { name: 'Subotica', country: 'Serbia', region: 'Vojvodina' },
  { name: 'Zrenjanin', country: 'Serbia', region: 'Vojvodina' },
  { name: 'Pančevo', country: 'Serbia', region: 'Vojvodina' },
  { name: 'Sombor', country: 'Serbia', region: 'Vojvodina' },
  { name: 'Sremska Mitrovica', country: 'Serbia', region: 'Vojvodina' },
  { name: 'Kragujevac', country: 'Serbia', region: 'Šumadija and Western Serbia' },
  { name: 'Čačak', country: 'Serbia', region: 'Šumadija and Western Serbia' },
  { name: 'Kraljevo', country: 'Serbia', region: 'Šumadija and Western Serbia' },
  { name: 'Užice', country: 'Serbia', region: 'Šumadija and Western Serbia' },
  { name: 'Šabac', country: 'Serbia', region: 'Šumadija and Western Serbia' },
  { name: 'Valjevo', country: 'Serbia', region: 'Šumadija and Western Serbia' },
  { name: 'Novi Pazar', country: 'Serbia', region: 'Šumadija and Western Serbia' },
  { name: 'Niš', country: 'Serbia', region: 'Southern and Eastern Serbia' },
  { name: 'Leskovac', country: 'Serbia', region: 'Southern and Eastern Serbia' },
  { name: 'Vranje', country: 'Serbia', region: 'Southern and Eastern Serbia' },
  { name: 'Pirot', country: 'Serbia', region: 'Southern and Eastern Serbia' },
  { name: 'Zaječar', country: 'Serbia', region: 'Southern and Eastern Serbia' },
  { name: 'Kruševac', country: 'Serbia', region: 'Southern and Eastern Serbia' },
  { name: 'Bor', country: 'Serbia', region: 'Southern and Eastern Serbia' },
].sort((left, right) => left.name.localeCompare(right.name))

/** Converts location labels like "Šumadija and Western Serbia" to "sumadija-and-western-serbia". */
const normalizeLocation = (value: string) =>
  value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const matchesLocation = (value: string, filter?: string) =>
  !filter || normalizeLocation(value) === normalizeLocation(filter)

export const findCities = ({
  country,
  region,
}: {
  country?: string
  region?: string
}) =>
  CITY_CATALOG.filter(
    (city) =>
      matchesLocation(city.country, country) &&
      matchesLocation(city.region, region),
  )
