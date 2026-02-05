import { execFile } from 'node:child_process'
import { appendFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { PNG } from 'pngjs'
import WebSocket from 'ws'
import { createWorker } from 'tesseract.js'

const execFileAsync = promisify(execFile)

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

async function captureFrame() {
  const { stdout } = await execFileAsync('adb', ['exec-out', 'screencap', '-p'], {
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024
  })
  return stdout
}

function parseRegion(regionArg, width, height) {
  if (!regionArg) return null
  const parts = regionArg.split(',').map(value => Number(value.trim()))
  if (parts.length !== 4 || parts.some(value => Number.isNaN(value))) {
    throw new Error('Region must be formatted as x,y,width,height')
  }

  const [xRaw, yRaw, wRaw, hRaw] = parts
  const x = clamp(Math.floor(xRaw), 0, width - 1)
  const y = clamp(Math.floor(yRaw), 0, height - 1)
  const w = clamp(Math.floor(wRaw), 1, width - x)
  const h = clamp(Math.floor(hRaw), 1, height - y)

  return { x, y, width: w, height: h }
}

function cropPng(png, region) {
  if (!region) return png
  const cropped = new PNG({ width: region.width, height: region.height })

  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const srcIdx = ((region.y + y) * png.width + (region.x + x)) * 4
      const dstIdx = (y * region.width + x) * 4
      cropped.data[dstIdx] = png.data[srcIdx]
      cropped.data[dstIdx + 1] = png.data[srcIdx + 1]
      cropped.data[dstIdx + 2] = png.data[srcIdx + 2]
      cropped.data[dstIdx + 3] = png.data[srcIdx + 3]
    }
  }

  return cropped
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
  const wsUrl = args.ws ? String(args.ws) : null
  const wsToken = args.token ? String(args.token) : null
  const deviceId = args.device ? String(args.device) : 'ghostwriter-device'
  const sourceApp = args.source ? String(args.source) : 'unknown'
  const jsonLogs = Boolean(args.json)
  const queueLimit = Number(args.queue ?? 50)
  const regionArg = args.region ? String(args.region) : null
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
  const sendQueue = []
  let ws = null
  let wsReady = false
  let reconnectDelay = 1000
  let processedFrames = 0
  let skippedNoMotion = 0
  let skippedNoText = 0
  let skippedDuplicate = 0
  let emittedCount = 0

  const stop = async () => {
    if (stopped) return
    stopped = true
    if (ws) {
      ws.close()
    }
    await worker.terminate()
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  const logEvent = (payload) => {
    if (jsonLogs) {
      console.log(JSON.stringify(payload))
    } else {
      console.log(payload.message)
    }
  }

  const connectWebSocket = () => {
    if (!wsUrl || stopped) return
    ws = new WebSocket(wsUrl, {
      headers: wsToken ? { Authorization: `Bearer ${wsToken}` } : undefined
    })

    ws.on('open', () => {
      wsReady = true
      reconnectDelay = 1000
      logEvent({ type: 'ws', level: 'info', message: 'WebSocket connected.' })
      while (sendQueue.length > 0 && wsReady) {
        const payload = sendQueue.shift()
        ws.send(payload)
      }
    })

    ws.on('close', () => {
      wsReady = false
      if (!stopped) {
        logEvent({ type: 'ws', level: 'warn', message: 'WebSocket disconnected.' })
        setTimeout(connectWebSocket, reconnectDelay)
        reconnectDelay = Math.min(reconnectDelay * 2, 30000)
      }
    })

    ws.on('error', (error) => {
      wsReady = false
      logEvent({ type: 'ws', level: 'error', message: `WebSocket error: ${error.message}` })
    })
  }

  if (wsUrl) {
    connectWebSocket()
  }

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

    const region = parseRegion(regionArg, png.width, png.height)
    const croppedForMotion = cropPng(png, region)
    const motionScore = computeMotionScore(lastFramePng, croppedForMotion, sampleStep)
    lastFramePng = croppedForMotion

    if (motionScore < motionThreshold) {
      skippedNoMotion += 1
      logEvent({
        type: 'frame',
        level: 'info',
        message: `[${new Date().toISOString()}] No scroll detected (${motionScore.toFixed(4)}).`,
        motionScore
      })
      await sleep(intervalMs)
      continue
    }

    const croppedForOcr = cropPng(png, region)
    const ocrBuffer = PNG.sync.write(croppedForOcr)
    const { data } = await worker.recognize(ocrBuffer)
    const text = (data.text ?? '').trim()
    const timestamp = new Date().toISOString()
    frameCount += 1
    processedFrames += 1

    if (!text || text.length < minChars) {
      skippedNoText += 1
      logEvent({
        type: 'frame',
        level: 'info',
        message: `[${timestamp}] Frame ${frameCount} no text detected`,
        motionScore
      })
      await sleep(intervalMs)
      continue
    }

    const isDuplicate = dedupeWindow > 0
      ? recentTexts.some((recent) => similarityRatio(recent, text) >= dedupeThreshold)
      : false
    if (isDuplicate) {
      skippedDuplicate += 1
      logEvent({
        type: 'frame',
        level: 'info',
        message: `[${timestamp}] duplicate suppressed`,
        motionScore
      })
      await sleep(intervalMs)
      continue
    }

    emittedCount += 1
    logEvent({
      type: 'ocr',
      level: 'info',
      message: `[${timestamp}] Frame ${frameCount}`,
      text,
      motionScore
    })

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

    if (wsUrl) {
      const payload = JSON.stringify({
        type: 'portal_text',
        timestamp,
        frame: frameCount,
        motionScore,
        text,
        deviceId,
        sourceApp,
        language
      })

      if (wsReady) {
        ws.send(payload)
      } else {
        sendQueue.push(payload)
        if (sendQueue.length > queueLimit) {
          sendQueue.shift()
        }
      }
    }

    await sleep(intervalMs)
  }

  await stop()
  logEvent({
    type: 'summary',
    level: 'info',
    message: 'Live OCR session ended.',
    processedFrames,
    emittedCount,
    skippedNoMotion,
    skippedNoText,
    skippedDuplicate
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
