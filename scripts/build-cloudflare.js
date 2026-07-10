const { spawn } = require('child_process')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const isWindows = process.platform === 'win32'

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: false,
      env: {
        ...process.env,
        CI: '1',
        NO_UPDATE_NOTIFIER: '1',
        npm_config_update_notifier: 'false',
        YARN_ENABLE_TELEMETRY: '0',
        ...extraEnv,
      },
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

  const vercelArgs = isWindows
    ? ['--require', preloadPath, vercelCliPath, 'build']
    : [vercelCliPath, 'build']

  await run(nodeCommand, vercelArgs, {
    NODE_TLS_REJECT_UNAUTHORIZED: '0',
  })

  await run(nodeCommand, [nextOnPagesCliPath, '--skip-build'])
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})