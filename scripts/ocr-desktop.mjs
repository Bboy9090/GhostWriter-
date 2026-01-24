import { execFile } from 'node:child_process'
import { appendFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { PNG } from 'pngjs'
import screenshot from 'screenshot-desktop'
import { createWorker } from 'tesseract.js'
import os from 'os'

const execFileAsync = promisify(execFile)
const platform = os.platform()

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

/**
 * Capture screen frame - cross-platform
 */
async function captureFrame() {
  try {
    // Use screenshot-desktop for cross-platform support
    const img = await screenshot({ format: 'png' })
    return Buffer.from(img)
  } catch (error) {
    // Fallback to platform-specific methods
    if (platform === 'win32') {
      // Windows: Use PowerShell or native screenshot
      try {
        const { stdout } = await execFileAsync('powershell', [
          '-Command',
          'Add-Type -AssemblyName System.Windows.Forms,System.Drawing; $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height); $graphics = [System.Drawing.Graphics]::FromImage($bmp); $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size); $ms = New-Object System.IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); [Convert]::ToBase64String($ms.ToArray())'
        ])
        return Buffer.from(stdout.trim(), 'base64')
      } catch (psError) {
        throw new Error(`Windows capture failed: ${psError.message}`)
      }
    } else if (platform === 'darwin') {
      // macOS: Use screencapture command
      const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`)
      try {
        await execFileAsync('screencapture', ['-x', '-t', 'png', tempFile])
        const fs = await import('node:fs/promises')
        const buffer = await fs.readFile(tempFile)
        await fs.unlink(tempFile)
        return buffer
      } catch (scError) {
        throw new Error(`macOS capture failed: ${scError.message}`)
      }
    } else if (platform === 'linux') {
      // Linux: Use import (ImageMagick) or gnome-screenshot
      try {
        const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`)
        await execFileAsync('import', ['-window', 'root', tempFile])
        const fs = await import('node:fs/promises')
        const buffer = await fs.readFile(tempFile)
        await fs.unlink(tempFile)
        return buffer
      } catch (importError) {
        // Try gnome-screenshot
        try {
          const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`)
          await execFileAsync('gnome-screenshot', ['-f', tempFile])
          const fs = await import('node:fs/promises')
          const buffer = await fs.readFile(tempFile)
          await fs.unlink(tempFile)
          return buffer
        } catch (gnomeError) {
          throw new Error(`Linux capture failed. Install ImageMagick or gnome-screenshot: ${gnomeError.message}`)
        }
      }
    } else {
      throw new Error(`Unsupported platform: ${platform}`)
    }
  }
}

function parseRegion(regionArg, width, height) {
  if (!regionArg) return null
  const parts = regionArg.split(',').map(value => Number(value.trim()))
  if (parts.length !== 4 || parts.some(value => Number.isNaN(value))) {
    throw new Error('Region must be formatted as x,y,width,height')
  }
  const [x, y, w, h] = parts
  return {
    x: clamp(x, 0, width),
    y: clamp(y, 0, height),
    width: clamp(w, 1, width - x),
    height: clamp(h, 1, height - y)
  }
}

function cropPng(png, region) {
  if (!region) return png
  const { x, y, width, height } = region
  const cropped = new PNG({ width, height })
  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      const srcIdx = ((y + py) * png.width + (x + px)) * 4
      const dstIdx = (py * width + px) * 4
      cropped.data[dstIdx] = png.data[srcIdx]
      cropped.data[dstIdx + 1] = png.data[srcIdx + 1]
      cropped.data[dstIdx + 2] = png.data[srcIdx + 2]
      cropped.data[dstIdx + 3] = png.data[srcIdx + 3]
    }
  }
  return cropped
}

function computeMotionScore(prev, curr, sampleStep = 12) {
  if (!prev || !curr) return 1.0
  let diff = 0
  let total = 0
  for (let y = 0; y < curr.height; y += sampleStep) {
    for (let x = 0; x < curr.width; x += sampleStep) {
      const idx = (y * curr.width + x) * 4
      const rDiff = Math.abs(curr.data[idx] - prev.data[idx])
      const gDiff = Math.abs(curr.data[idx + 1] - prev.data[idx + 1])
      const bDiff = Math.abs(curr.data[idx + 2] - prev.data[idx + 2])
      diff += (rDiff + gDiff + bDiff) / 3
      total += 1
    }
  }
  return total > 0 ? diff / total / 255 : 0
}

function similarityRatio(a, b) {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  if (longer.length === 0) return 1.0
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1, str2) {
  const matrix = []
  for (let i = 0; i <= str2.length; i += 1) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j += 1) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i += 1) {
    for (let j = 1; j <= str1.length; j += 1) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const intervalMs = Number(args.interval) || 1000
  const durationMs = Number(args.duration) || 0
  const motionThreshold = Number(args.delta) || 0.012
  const sampleStep = Number(args.sample) || 12
  const dedupeThreshold = Number(args.dedupe) || 0.88
  const dedupeWindow = Number(args.window) || 5
  const minChars = Number(args['min-chars']) || 20
  const regionArg = args.region
  const outputPath = args.output
  const jsonOutput = args.json === true
  const watchMode = args.watch === true

  console.log(`🖥️  GhostWriter Desktop Capture - ${platform}`)
  console.log(`📊 Interval: ${intervalMs}ms, Motion threshold: ${motionThreshold}`)
  if (durationMs > 0) {
    console.log(`⏱️  Duration: ${durationMs}ms`)
  }
  if (watchMode) {
    console.log(`👀 Watch mode: Continuous capture`)
  }

  const worker = await createWorker('eng')
  let lastFramePng = null
  let frameCount = 0
  let processedFrames = 0
  let skippedNoMotion = 0
  let skippedNoText = 0
  let skippedDuplicate = 0
  const recentTexts = []
  let stopped = false
  const startedAt = Date.now()

  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping capture...')
    stopped = true
  })

  const logEvent = (event) => {
    if (jsonOutput) {
      console.log(JSON.stringify(event))
    } else {
      console.log(event.message || JSON.stringify(event))
    }
    if (outputPath) {
      appendFile(outputPath, `${JSON.stringify(event)}\n`, 'utf8').catch(() => {})
    }
  }

  if (outputPath) {
    await writeFile(outputPath, '', 'utf8')
    logEvent({ type: 'start', platform, timestamp: new Date().toISOString() })
  }

  while (!stopped) {
    if (durationMs > 0 && Date.now() - startedAt > durationMs) {
      break
    }

    let buffer
    try {
      buffer = await captureFrame()
    } catch (error) {
      console.error(`❌ Failed to capture screen: ${error.message}`)
      if (!watchMode) break
      await sleep(intervalMs)
      continue
    }

    let png
    try {
      png = PNG.sync.read(buffer)
    } catch (error) {
      console.error('❌ Failed to decode PNG frame.')
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
        message: `[${new Date().toISOString()}] No motion detected (${motionScore.toFixed(4)}).`,
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
        message: `[${timestamp}] Frame ${frameCount} duplicate suppressed`,
        motionScore
      })
      await sleep(intervalMs)
      continue
    }

    if (recentTexts.length >= dedupeWindow) {
      recentTexts.shift()
    }
    recentTexts.push(text)

    logEvent({
      type: 'text',
      level: 'success',
      message: `[${timestamp}] Frame ${frameCount} extracted ${text.length} chars`,
      text,
      motionScore,
      frameCount
    })

    await sleep(intervalMs)
  }

  await worker.terminate()

  const summary = {
    type: 'summary',
    platform,
    frames: frameCount,
    processed: processedFrames,
    skippedNoMotion,
    skippedNoText,
    skippedDuplicate,
    duration: Date.now() - startedAt
  }

  logEvent(summary)
  console.log('\n✅ Capture complete!')
  console.log(`📊 Processed: ${processedFrames}, Skipped (motion): ${skippedNoMotion}, Skipped (text): ${skippedNoText}, Duplicates: ${skippedDuplicate}`)
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
