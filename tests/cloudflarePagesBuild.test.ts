import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

import { afterEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  pagesRoutesConfig,
  preparePagesDeploy,
  supportEntries,
} = require('../scripts/prepare-pages-deploy.js') as {
  pagesRoutesConfig: {
    version: number
    include: string[]
    exclude: string[]
  }
  preparePagesDeploy: (options?: {
    openNextDir?: string
    assetsDir?: string
    pagesDir?: string
    supportEntries?: string[]
    logger?: { log: (message: string) => void }
  }) => string
  supportEntries: string[]
}

const tempDirs: string[] = []

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }
})

function createTempDir(prefix: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

describe('Cloudflare Pages build contract', () => {
  it('packages an OpenNext bundle into a Pages advanced-mode output directory', () => {
    const rootDir = createTempDir('pages-bundle-')
    const openNextDir = path.join(rootDir, '.open-next')
    const pagesDir = path.join(rootDir, '.pages-deploy')
    const assetsDir = path.join(openNextDir, 'assets')

    fs.mkdirSync(path.join(assetsDir, '_next', 'static'), { recursive: true })
    fs.mkdirSync(path.join(openNextDir, 'server-functions', 'default'), { recursive: true })
    fs.mkdirSync(path.join(openNextDir, 'middleware'), { recursive: true })

    fs.writeFileSync(path.join(assetsDir, 'manifest.json'), '{}')
    fs.writeFileSync(path.join(assetsDir, '_next', 'static', 'app.js'), 'console.log("ok")')
    fs.writeFileSync(path.join(openNextDir, 'worker.js'), 'export default {}')
    fs.writeFileSync(path.join(openNextDir, 'server-functions', 'default', 'handler.mjs'), 'export const handler = () => null')
    fs.writeFileSync(path.join(openNextDir, 'middleware', 'handler.mjs'), 'export const handler = () => null')

    const outputDir = preparePagesDeploy({
      openNextDir,
      pagesDir,
      logger: { log: () => undefined },
    })

    expect(outputDir).toBe(pagesDir)
    expect(fs.existsSync(path.join(pagesDir, '_worker.js'))).toBe(true)
    expect(fs.existsSync(path.join(pagesDir, '_routes.json'))).toBe(true)
    expect(fs.existsSync(path.join(pagesDir, 'manifest.json'))).toBe(true)
    expect(fs.existsSync(path.join(pagesDir, '_next', 'static', 'app.js'))).toBe(true)
    expect(fs.existsSync(path.join(pagesDir, 'server-functions', 'default', 'handler.mjs'))).toBe(true)
    expect(fs.existsSync(path.join(pagesDir, 'middleware', 'handler.mjs'))).toBe(true)

    const routesConfig = JSON.parse(fs.readFileSync(path.join(pagesDir, '_routes.json'), 'utf8'))
    expect(routesConfig).toEqual(pagesRoutesConfig)
  })

  it('fails when the OpenNext worker artifact is missing', () => {
    const rootDir = createTempDir('pages-missing-worker-')
    const openNextDir = path.join(rootDir, '.open-next')
    const assetsDir = path.join(openNextDir, 'assets')

    fs.mkdirSync(assetsDir, { recursive: true })
    fs.writeFileSync(path.join(assetsDir, 'manifest.json'), '{}')

    expect(() => preparePagesDeploy({
      openNextDir,
      pagesDir: path.join(rootDir, '.pages-deploy'),
      logger: { log: () => undefined },
    })).toThrow(/worker\.js/)
  })

  it('keeps Pages and worker Cloudflare configs aligned with the required build flow', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'))
    const pagesConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'wrangler.jsonc'), 'utf8'))
    const workerConfig = fs.readFileSync(path.resolve(__dirname, '..', 'wrangler.worker.toml'), 'utf8')

    expect(packageJson.scripts['build:pages']).toBe('npm run build:cf && node scripts/prepare-pages-deploy.js')
    expect(packageJson.scripts['preview:pages']).toBe('npm run build:pages && npx wrangler pages dev .pages-deploy')
    expect(packageJson.scripts['deploy:cf']).toBe('npm run deploy:pages')
    expect(packageJson.scripts['deploy:pages']).toContain('wrangler pages deploy .pages-deploy --project-name evorupa')
    expect(packageJson.scripts['deploy:worker']).toContain('opennextjs-cloudflare deploy --config wrangler.worker.toml')

    expect(pagesConfig.pages_build_output_dir).toBe('.pages-deploy')
    expect(pagesConfig.compatibility_flags).toContain('nodejs_compat')
    expect(pagesConfig.services).toEqual([
      {
        binding: 'WORKER_SELF_REFERENCE',
        service: 'evorupa',
      },
    ])

    expect(workerConfig).toContain('main = ".open-next/worker.js"')
    expect(workerConfig).toContain('binding = "ASSETS"')
    expect(workerConfig).toContain('compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]')
    expect(supportEntries).toContain('server-functions')
    expect(pagesRoutesConfig.exclude).toContain('/_next/static/*')
  })
})
