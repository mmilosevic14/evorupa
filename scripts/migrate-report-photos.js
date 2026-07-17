const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const repoRoot = path.resolve(__dirname, '..')
const envFile = path.join(repoRoot, '.env.local')
const DEFAULT_EXPORT_PATH = path.join(repoRoot, 'tmp', 'supabase-public-export.json')
const DEFAULT_BUCKET = 'report-photos'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0'

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
  const options = {
    exportPath: DEFAULT_EXPORT_PATH,
    bucket: DEFAULT_BUCKET,
    dryRun: false,
    skipReportUpdate: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--export' && argv[index + 1]) {
      options.exportPath = path.resolve(repoRoot, argv[index + 1])
      index += 1
      continue
    }

    if (arg === '--bucket' && argv[index + 1]) {
      options.bucket = argv[index + 1]
      index += 1
      continue
    }

    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg === '--skip-report-update') {
      options.skipReportUpdate = true
    }
  }

  return options
}

function getTargetConfig() {
  const url = process.env.SUPABASE_TARGET_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_TARGET_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Set SUPABASE_TARGET_URL and SUPABASE_TARGET_KEY, or provide NEXT_PUBLIC_SUPABASE_URL with SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY.')
  }

  return { url, key }
}

function ensureExportPayload(exportPath) {
  if (!fs.existsSync(exportPath)) {
    throw new Error(`Export file not found: ${exportPath}`)
  }

  const payload = JSON.parse(fs.readFileSync(exportPath, 'utf8'))

  if (!payload || !payload.tables || !Array.isArray(payload.tables.reports)) {
    throw new Error('Invalid export payload. Expected tmp/supabase-public-export.json with tables.reports.')
  }

  return payload
}

function extractStorageObjectName(photoUrl, bucketName) {
  if (!photoUrl || typeof photoUrl !== 'string') {
    return null
  }

  try {
    const parsedUrl = new URL(photoUrl)
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
    const bucketIndex = pathParts.findIndex((part) => part === bucketName)

    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return null
    }

    return decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/'))
  } catch {
    return null
  }
}

function normalizeObjectName(objectName, bucketName) {
  if (!objectName || typeof objectName !== 'string') {
    return null
  }

  const prefix = `${bucketName}/`

  if (objectName.startsWith(prefix)) {
    return objectName.slice(prefix.length)
  }

  return objectName
}

function getReportObjectName(report, bucketName) {
  if (report.photo_path && typeof report.photo_path === 'string') {
    return normalizeObjectName(report.photo_path, bucketName)
  }

  return normalizeObjectName(extractStorageObjectName(report.photo_url, bucketName), bucketName)
}

function getSourceDownloadUrl(report, sourceUrl, bucketName, objectName) {
  if (report.photo_url) {
    return report.photo_url
  }

  const encodedPath = objectName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${sourceUrl}/storage/v1/object/public/${bucketName}/${encodedPath}`
}

function buildJobs(reports, sourceUrl, bucketName) {
  return reports
    .map((report) => {
      const objectName = getReportObjectName(report, bucketName)

      if (!objectName) {
        return null
      }

      return {
        reportId: report.id,
        objectName,
        sourceDownloadUrl: getSourceDownloadUrl(report, sourceUrl, bucketName, objectName),
      }
    })
    .filter(Boolean)
}

async function downloadObject(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${url}`)
  }

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || 'application/octet-stream',
  }
}

async function uploadObject(targetClient, bucketName, objectName, bytes, contentType) {
  const { error } = await targetClient.storage.from(bucketName).upload(objectName, bytes, {
    upsert: true,
    contentType,
    cacheControl: '3600',
  })

  if (error) {
    throw error
  }

  return targetClient.storage.from(bucketName).getPublicUrl(objectName).data.publicUrl
}

async function updateReportPhoto(targetConfig, reportId, objectName, publicUrl) {
  const reportUrl = new URL('/rest/v1/reports', targetConfig.url)
  reportUrl.searchParams.set('id', `eq.${reportId}`)

  const response = await fetch(reportUrl, {
    method: 'PATCH',
    headers: {
      apikey: targetConfig.key,
      Authorization: `Bearer ${targetConfig.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      photo_url: publicUrl,
      photo_path: objectName,
      photo_object_id: null,
    }),
  })

  if (!response.ok) {
    throw new Error(`Report update failed (${response.status}) for report ${reportId}: ${await response.text()}`)
  }
}

async function main() {
  loadEnv()

  const options = parseArgs(process.argv.slice(2))
  const payload = ensureExportPayload(options.exportPath)

  const reports = payload.tables.reports || []
  const jobs = buildJobs(reports, payload.sourceUrl, options.bucket)

  if (jobs.length === 0) {
    console.log('No report photo jobs found in export payload.')
    return
  }

  console.log(`Found ${jobs.length} report photos to migrate from ${payload.sourceUrl}.`)

  if (options.dryRun) {
    for (const [index, job] of jobs.entries()) {
      console.log(`[dry-run] ${index + 1}/${jobs.length} ${job.objectName}`)
    }

    console.log('Dry run complete.')
    return
  }

  const targetConfig = getTargetConfig()
  const targetClient = createClient(targetConfig.url, targetConfig.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  for (const [index, job] of jobs.entries()) {
    const { bytes, contentType } = await downloadObject(job.sourceDownloadUrl)
    const publicUrl = await uploadObject(targetClient, options.bucket, job.objectName, bytes, contentType)

    if (!options.skipReportUpdate) {
      await updateReportPhoto(targetConfig, job.reportId, job.objectName, publicUrl)
    }

    console.log(`Migrated ${index + 1}/${jobs.length}: ${job.objectName}`)
  }

  console.log('Report photo migration complete.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})