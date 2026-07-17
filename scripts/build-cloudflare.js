const { spawn } = require('child_process')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      NO_UPDATE_NOTIFIER: '1',
      npm_config_update_notifier: 'false',
      YARN_ENABLE_TELEMETRY: '0',
      ...extraEnv,
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
  const openNextCliPath = path.join(repoRoot, 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'index.js')

  await run(nodeCommand, [openNextCliPath, 'build'])
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
