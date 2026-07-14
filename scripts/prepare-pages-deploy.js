const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const defaultOpenNextDir = path.join(repoRoot, '.open-next')
const defaultPagesDir = path.join(repoRoot, '.pages-deploy')

const supportEntries = [
  '.build',
  'cloudflare',
  'cloudflare-templates',
  'middleware',
  'server-functions',
  'cache',
  'dynamodb-provider',
]

const pagesRoutesConfig = {
  version: 1,
  include: ['/*'],
  exclude: [
    '/_next/static/*',
    '/apple-touch-icon.png',
    '/favicon.ico',
    '/favicon-32x32.png',
    '/icon-*.png',
    '/logo.png',
    '/manifest.json',
    '/maskable-*.png',
    '/og-image.png',
    '/screenshots/*',
    '/sw.js',
    '/workbox-*',
    '/default-report-photo.jpg',
  ],
}

function ensureExists(fsApi, targetPath) {
  if (!fsApi.existsSync(targetPath)) {
    throw new Error(`Missing required build artifact: ${targetPath}`)
  }
}

function copyDirectoryContents(fsApi, sourceDir, targetDir) {
  for (const entry of fsApi.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      fsApi.cpSync(sourcePath, targetPath, { recursive: true })
      continue
    }

    fsApi.copyFileSync(sourcePath, targetPath)
  }
}

function preparePagesDeploy(options = {}) {
  const fsApi = options.fsApi ?? fs
  const openNextDir = options.openNextDir ?? defaultOpenNextDir
  const assetsDir = options.assetsDir ?? path.join(openNextDir, 'assets')
  const pagesDir = options.pagesDir ?? defaultPagesDir
  const logger = options.logger ?? console
  const entriesToCopy = options.supportEntries ?? supportEntries

  ensureExists(fsApi, openNextDir)
  ensureExists(fsApi, assetsDir)
  ensureExists(fsApi, path.join(openNextDir, 'worker.js'))

  fsApi.rmSync(pagesDir, { recursive: true, force: true })
  fsApi.mkdirSync(pagesDir, { recursive: true })

  copyDirectoryContents(fsApi, assetsDir, pagesDir)

  for (const entry of entriesToCopy) {
    const sourcePath = path.join(openNextDir, entry)

    if (!fsApi.existsSync(sourcePath)) {
      continue
    }

    fsApi.cpSync(sourcePath, path.join(pagesDir, entry), { recursive: true })
  }

  fsApi.copyFileSync(path.join(openNextDir, 'worker.js'), path.join(pagesDir, '_worker.js'))
  fsApi.writeFileSync(path.join(pagesDir, '_routes.json'), `${JSON.stringify(pagesRoutesConfig, null, 2)}\n`)

  logger.log(`Prepared Pages advanced-mode bundle in ${pagesDir}`)

  return pagesDir
}

function main() {
  preparePagesDeploy()
}

if (require.main === module) {
  main()
}

module.exports = {
  copyDirectoryContents,
  ensureExists,
  pagesRoutesConfig,
  preparePagesDeploy,
  supportEntries,
}
