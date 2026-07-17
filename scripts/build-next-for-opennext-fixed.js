const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { getNamedRouteRegex } = require('next/dist/shared/lib/router/utils/route-regex')

const repoRoot = path.resolve(__dirname, '..')
const nextDir = path.join(repoRoot, '.next')
const routesManifestPath = path.join(nextDir, 'routes-manifest.json')
const appPathsManifestPath = path.join(nextDir, 'server', 'app-paths-manifest.json')
const pagesManifestPath = path.join(nextDir, 'server', 'pages-manifest.json')
const standaloneNextDir = path.join(nextDir, 'standalone', '.next')
const standaloneRoutesManifestPath = path.join(standaloneNextDir, 'routes-manifest.json')
const standalonePagesManifestPath = path.join(standaloneNextDir, 'server', 'pages-manifest.json')

function readJson(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function isDynamicRoute(route) {
  return route.includes('[')
}

function createStaticRoute(route) {
  const regex = route === '/' ? '^/(?:/)?$' : `^${route}(?:/)?$`

  return {
    page: route,
    regex,
    routeKeys: {},
    namedRegex: regex,
  }
}

function createDynamicRoute(route) {
  const { namedRegex, routeKeys } = getNamedRouteRegex(route, {
    prefixRouteKeys: false,
    includePrefix: true,
  })

  return {
    page: route,
    regex: namedRegex,
    namedRegex,
    routeKeys,
  }
}

function normalizeAppPath(appPath) {
  let normalizedPath = appPath.replace(/\\/g, '/')

  normalizedPath = normalizedPath.replace(/\/page$/, '')
  normalizedPath = normalizedPath.replace(/\/route$/, '')
  normalizedPath = normalizedPath.replace(/\/default$/, '')
  normalizedPath = normalizedPath.replace(/\/\([^/]+\)/g, '')
  normalizedPath = normalizedPath.replace(/\/@[^/]+/g, '')

  return normalizedPath === '' ? '/' : normalizedPath
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function runNextBuild() {
  const nextCliPath = path.join(repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next')
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npx'
  const args = process.platform === 'win32'
    ? ['/c', 'npx', '-y', 'node@22', nextCliPath, 'build']
    : ['-y', 'node@22', nextCliPath, 'build']
  const buildEnv = {
    ...process.env,
    NEXT_PRIVATE_STANDALONE: 'true',
    NEXT_PRIVATE_OUTPUT_TRACE_ROOT: repoRoot,
  }
  const maxAttempts = process.platform === 'win32' ? 3 : 1

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      execFileSync(command, args, {
        cwd: repoRoot,
        stdio: 'inherit',
        env: buildEnv,
      })
      return
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts

      if (isLastAttempt || process.platform !== 'win32') {
        throw error
      }

      console.warn(`Retrying standalone Next build after transient Windows build failure (${attempt}/${maxAttempts})`)
    }
  }
}

function ensureRoutesManifest() {
  const appPathsManifest = readJson(appPathsManifestPath, {})
  const appRoutes = [...new Set(Object.keys(appPathsManifest).map(normalizeAppPath))].sort((left, right) => left.localeCompare(right))
  const staticRoutes = appRoutes.filter((route) => !isDynamicRoute(route)).map(createStaticRoute)
  const dynamicRoutes = appRoutes.filter(isDynamicRoute).map(createDynamicRoute)

  const routesManifest = {
    version: 3,
    pages404: true,
    basePath: '',
    redirects: [],
    rewrites: {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    },
    headers: [],
    staticRoutes,
    dynamicRoutes,
    dataRoutes: [],
    rsc: {
      header: 'RSC',
      didPostponeHeader: 'x-nextjs-postponed',
      contentTypeHeader: 'text/x-component',
      varyHeader: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch',
      prefetchHeader: 'Next-Router-Prefetch',
      suffix: '.rsc',
      prefetchSuffix: '.prefetch.rsc',
      prefetchSegmentHeader: 'Next-Router-Segment-Prefetch',
      prefetchSegmentDirSuffix: '.segments',
      prefetchSegmentSuffix: '.segment.rsc',
    },
    rewriteHeaders: {
      pathHeader: 'x-nextjs-rewritten-path',
      queryHeader: 'x-nextjs-rewritten-query',
    },
  }

  writeJson(routesManifestPath, routesManifest)
  writeJson(standaloneRoutesManifestPath, routesManifest)
}

function ensurePagesManifest() {
  const pagesManifest = {}

  writeJson(pagesManifestPath, pagesManifest)
  writeJson(standalonePagesManifestPath, pagesManifest)
}

function main() {
  runNextBuild()

  ensureRoutesManifest()
  ensurePagesManifest()
}

main()
