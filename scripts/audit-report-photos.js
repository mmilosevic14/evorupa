const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
const { createClient: createSupabaseClient } = require('@supabase/supabase-js')

const DEFAULT_BUCKET = 'report-photos'
const repoRoot = path.resolve(__dirname, '..')
const envFile = path.join(repoRoot, '.env.local')

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

function loadLocalEnv() {
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

function getDatabaseUrl() {
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
      'Set SUPABASE_SESSION_DATABASE_URL, SUPABASE_DB_CONNECTION, SUPABASE_DATABASE_URL, or SUPABASE_DB_PASSWORD before auditing report photos.',
    )
  }

  return databaseUrl
}

function extractStorageObjectName(photoUrl, bucketName = DEFAULT_BUCKET) {
  if (!photoUrl || typeof photoUrl !== 'string') {
    return null
  }

  let parsedUrl

  try {
    parsedUrl = new URL(photoUrl)
  } catch {
    return null
  }

  const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
  const bucketIndex = pathParts.findIndex((part) => part === bucketName)

  if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
    return null
  }

  return decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/'))
}

function getReferencedObjectName(report, bucketName = DEFAULT_BUCKET) {
  if (report.photo_path && typeof report.photo_path === 'string') {
    return report.photo_path
  }

  return extractStorageObjectName(report.photo_url, bucketName)
}

function buildPhotoAudit({ reports, objects, bucketName = DEFAULT_BUCKET }) {
  const referencedObjectNames = new Set()
  const missingObjects = []
  const malformedReports = []
  const objectNameToReports = new Map()

  for (const report of reports) {
    if (!report.photo_url && !report.photo_path) {
      continue
    }

    const objectName = getReferencedObjectName(report, bucketName)

    if (!objectName) {
      malformedReports.push({
        reportId: report.id,
        photoUrl: report.photo_url,
        photoPath: report.photo_path ?? null,
      })
      continue
    }

    referencedObjectNames.add(objectName)

    const linkedReports = objectNameToReports.get(objectName) ?? []
    linkedReports.push({
      reportId: report.id,
      photoUrl: report.photo_url,
      photoPath: report.photo_path ?? null,
    })
    objectNameToReports.set(objectName, linkedReports)
  }

  const objectNames = new Set(objects.map((object) => object.name))

  for (const objectName of referencedObjectNames) {
    if (!objectNames.has(objectName)) {
      missingObjects.push({
        objectName,
        reports: objectNameToReports.get(objectName) ?? [],
      })
    }
  }

  const orphanedObjects = objects
    .filter((object) => !referencedObjectNames.has(object.name))
    .map((object) => ({
      id: object.id,
      name: object.name,
      owner: object.owner ?? object.owner_id ?? null,
      created_at: object.created_at,
      updated_at: object.updated_at,
      last_accessed_at: object.last_accessed_at,
    }))

  return {
    bucketName,
    reportCount: reports.length,
    objectCount: objects.length,
    referencedObjectCount: referencedObjectNames.size,
    malformedReports,
    missingObjects,
    orphanedObjects,
  }
}

function parseArgs(argv) {
  return {
    deleteOrphans: argv.includes('--delete-orphans'),
    json: argv.includes('--json'),
    bucketName: DEFAULT_BUCKET,
  }
}

async function fetchAuditData(client, bucketName) {
  const { rows: reports } = await client.query(
    `
      select id, photo_url
           , photo_path
      from public.reports
      where (photo_url is not null and btrim(photo_url) <> '')
         or (photo_path is not null and btrim(photo_path) <> '')
    `,
  )

  const { rows: objects } = await client.query(
    `
      select id, name, owner, owner_id, created_at, updated_at, last_accessed_at
      from storage.objects
      where bucket_id = $1
      order by name asc
    `,
    [bucketName],
  )

  return { reports, objects }
}

async function deleteOrphanedObjects(orphanedObjects, bucketName) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      'Deleting orphaned objects requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.',
    )
  }

  const supabase = createSupabaseClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const objectNames = orphanedObjects.map((object) => object.name)
  const deleted = []

  for (let index = 0; index < objectNames.length; index += 100) {
    const batch = objectNames.slice(index, index + 100)
    const { data, error } = await supabase.storage.from(bucketName).remove(batch)

    if (error) {
      throw error
    }

    deleted.push(...(data ?? []))
  }

  return deleted
}

function printHumanSummary(audit) {
  console.log(`Bucket: ${audit.bucketName}`)
  console.log(`Reports with photo URLs: ${audit.reportCount}`)
  console.log(`Storage objects in bucket: ${audit.objectCount}`)
  console.log(`Referenced object names: ${audit.referencedObjectCount}`)
  console.log(`Malformed report photo URLs: ${audit.malformedReports.length}`)
  console.log(`Missing storage objects: ${audit.missingObjects.length}`)
  console.log(`Orphaned storage objects: ${audit.orphanedObjects.length}`)

  if (audit.missingObjects.length > 0) {
    console.log('\nMissing objects:')
    for (const missingObject of audit.missingObjects.slice(0, 20)) {
      console.log(`- ${missingObject.objectName}`)
      for (const report of missingObject.reports) {
        console.log(`  report ${report.reportId}`)
      }
    }
  }

  if (audit.orphanedObjects.length > 0) {
    console.log('\nOrphaned objects:')
    for (const orphanedObject of audit.orphanedObjects.slice(0, 20)) {
      console.log(`- ${orphanedObject.name}`)
    }
  }
}

async function main() {
  loadLocalEnv()

  const { deleteOrphans, json, bucketName } = parseArgs(process.argv.slice(2))
  const databaseUrl = getDatabaseUrl()
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

  await client.connect()

  try {
    const data = await fetchAuditData(client, bucketName)
    const audit = buildPhotoAudit({ ...data, bucketName })

    if (deleteOrphans && audit.orphanedObjects.length > 0) {
      const deletedObjects = await deleteOrphanedObjects(audit.orphanedObjects, bucketName)
      audit.deletedObjects = deletedObjects.map((entry) => entry.name ?? entry)
    }

    if (json) {
      console.log(JSON.stringify(audit, null, 2))
      return
    }

    printHumanSummary(audit)

    if (deleteOrphans) {
      console.log(`\nDeleted orphaned objects: ${(audit.deletedObjects ?? []).length}`)
    } else {
      console.log('\nDry run only. Re-run with --delete-orphans to remove orphaned objects.')
    }
  } finally {
    await client.end()
  }
}

if (require.main === module) {
  main().catch((error) => {
    if (typeof error.message === 'string' && error.message.includes('ENOTFOUND db.')) {
      console.error(
        'The configured direct Supabase database host is IPv6-only from this environment. Set SUPABASE_SESSION_DATABASE_URL to the Session Pooler connection string from the Supabase dashboard and rerun the photo audit.',
      )
      process.exit(1)
    }

    console.error(error.message)
    process.exit(1)
  })
}

module.exports = {
  DEFAULT_BUCKET,
  buildPhotoAudit,
  extractStorageObjectName,
  getReferencedObjectName,
  parseArgs,
}