import { execFile } from 'node:child_process'
import { appendFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { createWorker } from 'tesseract.js'

const execFileAsync = promisify(execFile)

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    args[key] = argv[i + 1]
    i += 1
  }
  return args
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function captureFrame() {
  const { stdout } = await execFileAsync('adb', ['exec-out', 'screencap', '-p'], {
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024
  })
  return stdout
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const intervalMs = Number(args.interval ?? 750)
  const durationMs = Number(args.duration ?? 0)
  const language = args.language ?? 'eng'
  const outputPath = args.output ? path.resolve(process.cwd(), args.output) : null

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    console.error('Interval must be a positive number of milliseconds.')
    process.exit(1)
  }

  if (outputPath) {
    await writeFile(outputPath, '', 'utf8')
  }

  const worker = await createWorker()
  await worker.loadLanguage(language)
  await worker.initialize(language)

  const startedAt = Date.now()
  let frameCount = 0
  let stopped = false

  const stop = async () => {
    if (stopped) return
    stopped = true
    await worker.terminate()
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  while (!stopped) {
    if (durationMs > 0 && Date.now() - startedAt > durationMs) {
      break
    }

    let buffer
    try {
      buffer = await captureFrame()
    } catch (error) {
      console.error('Failed to capture frame via adb. Is a device connected?')
      console.error(error.message)
      break
    }

    const { data } = await worker.recognize(buffer)
    const text = (data.text ?? '').trim()
    const timestamp = new Date().toISOString()
    frameCount += 1

    console.log(`[${timestamp}] Frame ${frameCount}`)
    console.log(text || '[no text detected]')
    console.log('---')

    if (outputPath) {
      await appendFile(
        outputPath,
        `# ${timestamp} frame ${frameCount}\n${text}\n\n`,
        'utf8'
      )
    }

    await sleep(intervalMs)
  }

  await stop()
  console.log('Live OCR session ended.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
