import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'os'
import process from 'node:process'

const execFileAsync = promisify(execFile)
const platform = os.platform()

/**
 * Unified capture system - detects platform and launches appropriate capture method
 */
async function detectPlatform() {
  console.log('🔍 Detecting platform and available capture methods...\n')

  const capabilities = {
    platform,
    desktop: false,
    android: false,
    ios: false,
    methods: []
  }

  // Check desktop capture
  if (platform === 'win32' || platform === 'darwin' || platform === 'linux') {
    capabilities.desktop = true
    capabilities.methods.push('desktop')
    console.log(`✅ Desktop capture available (${platform})`)
  }

  // Check Android ADB
  try {
    await execFileAsync('adb', ['version'])
    const { stdout } = await execFileAsync('adb', ['devices'])
    const devices = stdout.split('\n').filter(line => line.trim() && !line.includes('List'))
    if (devices.length > 0) {
      capabilities.android = true
      capabilities.methods.push('android')
      console.log(`✅ Android device detected (${devices.length} device(s))`)
    } else {
      console.log('⚠️  ADB available but no devices connected')
    }
  } catch (error) {
    console.log('ℹ️  Android ADB not available')
  }

  // iOS - manual upload only (no automatic detection)
  capabilities.methods.push('ios-upload')
  console.log('ℹ️  iOS: Manual screenshot upload available')

  return capabilities
}

async function launchCapture(method, args = []) {
  const scriptMap = {
    desktop: 'scripts/ocr-desktop.mjs',
    android: 'scripts/ocr-live.mjs',
    'ios-upload': null // Handled via web UI
  }

  const script = scriptMap[method]
  if (!script) {
    console.log(`ℹ️  ${method} requires manual setup via web UI`)
    return
  }

  console.log(`\n🚀 Launching ${method} capture...\n`)

  const { spawn } = await import('node:child_process')
  const proc = spawn('node', [script, ...args], {
    stdio: 'inherit',
    shell: true
  })

  proc.on('error', (error) => {
    console.error(`❌ Failed to start ${method} capture:`, error.message)
  })

  return proc
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      args[key] = true
    } else {
      args[key] = value
      i += 1
    }
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const method = args.method || 'auto'
  const watch = args.watch === true

  console.log('👻 GhostWriter Unified Capture System\n')
  console.log('=' .repeat(50))

  const capabilities = await detectPlatform()

  console.log('\n' + '='.repeat(50))
  console.log('\n📋 Available capture methods:')
  capabilities.methods.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m}`)
  })

  if (method === 'auto') {
    // Auto-select best available method
    let selectedMethod = null

    if (capabilities.desktop) {
      selectedMethod = 'desktop'
      console.log(`\n🎯 Auto-selected: Desktop capture (${platform})`)
    } else if (capabilities.android) {
      selectedMethod = 'android'
      console.log(`\n🎯 Auto-selected: Android capture`)
    } else {
      console.log('\n⚠️  No automatic capture methods available')
      console.log('💡 Use --method to specify: desktop, android, or ios-upload')
      console.log('💡 Or use the web UI for iOS screenshot upload')
      process.exit(0)
    }

    const captureArgs = watch ? ['--watch'] : []
    if (args.interval) captureArgs.push('--interval', args.interval)
    if (args.duration) captureArgs.push('--duration', args.duration)
    if (args.output) captureArgs.push('--output', args.output)

    await launchCapture(selectedMethod, captureArgs)
  } else {
    if (!capabilities.methods.includes(method)) {
      console.error(`\n❌ Method "${method}" not available`)
      console.log(`Available methods: ${capabilities.methods.join(', ')}`)
      process.exit(1)
    }

    const captureArgs = watch ? ['--watch'] : []
    if (args.interval) captureArgs.push('--interval', args.interval)
    if (args.duration) captureArgs.push('--duration', args.duration)
    if (args.output) captureArgs.push('--output', args.output)

    await launchCapture(method, captureArgs)
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
