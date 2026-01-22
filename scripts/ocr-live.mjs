import { execFile } from 'node:child_process'
import { appendFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { PNG } from 'pngjs'
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

function getLuma(data, idx) {
  const r = data[idx]
  const g = data[idx + 1]
  const b = data[idx + 2]
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function computeMotionScore(prevPng, nextPng, sampleStep) {
  if (!prevPng || !nextPng) return 1
  if (prevPng.width !== nextPng.width || prevPng.height !== nextPng.height) return 1

  let totalDiff = 0
  let samples = 0
  const { width, height } = nextPng

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (y * width + x) * 4
      const lumaA = getLuma(prevPng.data, idx)
      const lumaB = getLuma(nextPng.data, idx)
      totalDiff += Math.abs(lumaA - lumaB)
      samples += 1
    }
  }

  return samples === 0 ? 0 : totalDiff / samples
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function levenshtein(a, b) {
  const rows = a.length + 1
  const cols = b.length + 1
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0))

  for (let i = 0; i < rows; i += 1) dp[i][0] = i
  for (let j = 0; j < cols; j += 1) dp[0][j] = j

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }

  return dp[rows - 1][cols - 1]
}

function similarityRatio(a, b) {
  const tokensA = tokenize(a)
  const tokensB = tokenize(b)
  const maxLen = Math.max(tokensA.length, tokensB.length)
  if (maxLen === 0) return 0
  const distance = levenshtein(tokensA, tokensB)
  return 1 - distance / maxLen
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const intervalMs = Number(args.interval ?? 750)
  const durationMs = Number(args.duration ?? 0)
  const language = args.language ?? 'eng'
  const motionThreshold = Number(args.delta ?? 0.012)
  const sampleStep = Number(args.sample ?? 12)
  const minChars = Number(args['min-chars'] ?? 20)
  const dedupeThreshold = Number(args.dedupe ?? 0.88)
  const dedupeWindow = Number(args.window ?? 5)
  const outputPath = args.output ? path.resolve(process.cwd(), args.output) : null

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    console.error('Interval must be a positive number of milliseconds.')
    process.exit(1)
  }

  if (!Number.isFinite(motionThreshold) || motionThreshold < 0) {
    console.error('Delta must be a non-negative number.')
    process.exit(1)
  }

  if (!Number.isFinite(sampleStep) || sampleStep <= 0) {
    console.error('Sample step must be a positive number.')
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
  let lastFramePng = null
  const recentTexts = []

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

    let png
    try {
      png = PNG.sync.read(buffer)
    } catch (error) {
      console.error('Failed to decode PNG frame.')
      console.error(error.message)
      await sleep(intervalMs)
      continue
    }

    const motionScore = computeMotionScore(lastFramePng, png, sampleStep)
    lastFramePng = png

    if (motionScore < motionThreshold) {
      console.log(`[${new Date().toISOString()}] No scroll detected (${motionScore.toFixed(4)}).`)
      await sleep(intervalMs)
      continue
    }

    const { data } = await worker.recognize(buffer)
    const text = (data.text ?? '').trim()
    const timestamp = new Date().toISOString()
    frameCount += 1

    console.log(`[${timestamp}] Frame ${frameCount}`)
    if (!text || text.length < minChars) {
      console.log('[no text detected]')
      console.log('---')
      await sleep(intervalMs)
      continue
    }

    const isDuplicate = recentTexts.some((recent) => similarityRatio(recent, text) >= dedupeThreshold)
    if (isDuplicate) {
      console.log(`[duplicate suppressed] motion=${motionScore.toFixed(4)}`)
      console.log('---')
      await sleep(intervalMs)
      continue
    }

    console.log(text)
    console.log('---')

    if (outputPath) {
      await appendFile(
        outputPath,
        `# ${timestamp} frame ${frameCount} motion=${motionScore.toFixed(4)}\n${text}\n\n`,
        'utf8'
      )
    }

    recentTexts.unshift(text)
    if (recentTexts.length > dedupeWindow) {
      recentTexts.pop()
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
