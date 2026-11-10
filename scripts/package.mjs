import { spawnSync } from 'node:child_process'

const commands = process.env.PYTHON ? [process.env.PYTHON] : ['python3', 'python', 'py']
for (const command of commands) {
  const result = spawnSync(command, ['scripts/package_theme.py'], { stdio: 'inherit' })
  if (result.error?.code === 'ENOENT') continue
  if (result.error) throw result.error
  process.exit(result.status ?? 1)
}
throw new Error('Python 3 is required. Install it or set PYTHON to its executable path.')
