const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const isWindows = process.platform === 'win32'

function run(command, args, extraEnv = {}, unsetEnv = []) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      CI: '1',
      NO_UPDATE_NOTIFIER: '1',
      npm_config_update_notifier: 'false',
      YARN_ENABLE_TELEMETRY: '0',
      ...extraEnv,
    }

    for (const key of unsetEnv) {
      delete env[key]
    }

    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: false,
      env,
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

async function main() {
  const nodeCommand = process.execPath
  const preloadPath = path.join(__dirname, 'vercel-build-windows-preload.js')
  const vercelCliPath = path.join(repoRoot, 'node_modules', 'vercel', 'dist', 'index.js')
  const nextOnPagesCliPath = path.join(repoRoot, 'node_modules', '@cloudflare', 'next-on-pages', 'dist', 'index.js')
  const vercelConfigPath = fs.mkdtempSync(path.join(os.tmpdir(), 'evorupa-vercel-'))

  const vercelArgs = isWindows
    ? ['--require', preloadPath, vercelCliPath, '--global-config', vercelConfigPath, 'build', '--yes']
    : [vercelCliPath, '--global-config', vercelConfigPath, 'build', '--yes']

  await run(nodeCommand, vercelArgs, {
    HOME: vercelConfigPath,
    NODE_TLS_REJECT_UNAUTHORIZED: '0',
    VERCEL_TELEMETRY_DISABLED: '1',
    XDG_CONFIG_HOME: vercelConfigPath,
  }, [
    'VERCEL_AUTH_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID',
    'VERCEL_TEAM_ID',
    'VERCEL_TOKEN',
  ])

  await run(nodeCommand, [nextOnPagesCliPath, '--skip-build'])
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})