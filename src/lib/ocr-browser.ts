/**
 * Shared browser OCR helpers (Tesseract.js) for desktop uploads and iOS capture lab.
 * Keeps enhancement and line-healing consistent across flows.
 */

const PARAGRAPH_TOKEN = '__GW_PARA__'

export type OcrEnhanceOptions = {
  enableEnhance: boolean
  grayscale: boolean
  contrast: number
  sharpen: boolean
}

export const DEFAULT_BROWSER_OCR = {
  lang: 'eng',
  maxWidth: 1600,
  ocrPsm: 6,
  enableEnhance: true,
  grayscale: true,
  contrast: 20,
  sharpen: false,
} as const

export type BrowserOcrOptions = Partial<{
  lang: string
  maxWidth: number
  ocrPsm: number
}> &
  Partial<OcrEnhanceOptions>

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, value))
}

export async function loadImageToCanvas(file: File, maxWidth: number) {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    const objectUrl = URL.createObjectURL(file)
    try {
      bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          createImageBitmap(img).then(resolve).catch(reject)
        }
        img.onerror = () =>
          reject(new Error(`Failed to load image: ${file.name}. Try converting HEIC to PNG/JPEG.`))
        img.src = objectUrl
      })
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  const scale = Math.min(1, maxWidth / bitmap.width)
  const width = Math.max(1, Math.floor(bitmap.width * scale))
  const height = Math.max(1, Math.floor(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    bitmap.close?.()
    throw new Error('Canvas not available for image processing.')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()
  return { canvas, ctx, width, height }
}

export function applyEnhancements(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: OcrEnhanceOptions
) {
  const { enableEnhance, grayscale, contrast, sharpen } = options
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const boundedContrast = Math.min(100, Math.max(-100, contrast))
  const factor = (259 * (boundedContrast + 255)) / (255 * (259 - boundedContrast))

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]!
    let g = data[i + 1]!
    let b = data[i + 2]!

    if (grayscale) {
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
      r = luma
      g = luma
      b = luma
    }

    if (enableEnhance) {
      r = factor * (r - 128) + 128
      g = factor * (g - 128) + 128
      b = factor * (b - 128) + 128
    }

    data[i] = clampChannel(r)
    data[i + 1] = clampChannel(g)
    data[i + 2] = clampChannel(b)
  }

  ctx.putImageData(imageData, 0, 0)

  if (sharpen) {
    const sharpData = ctx.getImageData(0, 0, width, height)
    const d = sharpData.data
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]
    const side = 3
    const half = Math.floor(side / 2)
    const orig = new Uint8ClampedArray(d)

    for (let y = half; y < height - half; y += 1) {
      for (let x = half; x < width - half; x += 1) {
        for (let c = 0; c < 3; c += 1) {
          let sum = 0
          for (let ky = -half; ky <= half; ky += 1) {
            for (let kx = -half; kx <= half; kx += 1) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c
              const kIdx = (ky + half) * side + (kx + half)
              sum += orig[idx]! * kernel[kIdx]!
            }
          }
          d[(y * width + x) * 4 + c] = clampChannel(sum)
        }
      }
    }
    ctx.putImageData(sharpData, 0, 0)
  }
}

/** Join hyphenated line breaks and collapse soft wraps into paragraphs. */
export function healOcrText(rawText: string) {
  if (!rawText) return ''
  let cleaned = rawText.replace(/-\n(\w)/g, '$1')
  cleaned = cleaned.replace(/\n\s*\n+/g, PARAGRAPH_TOKEN)
  cleaned = cleaned.replace(/\n+/g, ' ')
  cleaned = cleaned.replace(new RegExp(PARAGRAPH_TOKEN, 'g'), '\n\n')
  return cleaned.trim()
}

export async function recognizeImageFile(
  file: File,
  options: BrowserOcrOptions = {}
): Promise<{ text: string; confidence: number | null }> {
  const lang = options.lang ?? DEFAULT_BROWSER_OCR.lang
  const maxWidth = options.maxWidth ?? DEFAULT_BROWSER_OCR.maxWidth
  const ocrPsm = options.ocrPsm ?? DEFAULT_BROWSER_OCR.ocrPsm
  const enhance: OcrEnhanceOptions = {
    enableEnhance: options.enableEnhance ?? DEFAULT_BROWSER_OCR.enableEnhance,
    grayscale: options.grayscale ?? DEFAULT_BROWSER_OCR.grayscale,
    contrast: options.contrast ?? DEFAULT_BROWSER_OCR.contrast,
    sharpen: options.sharpen ?? DEFAULT_BROWSER_OCR.sharpen,
  }

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(lang)
  try {
    if (ocrPsm >= 0 && ocrPsm <= 13) {
      // Tesseract worker typings expect PSM enum; numeric mode is valid at runtime.
      await worker.setParameters({
        tessedit_pageseg_mode: ocrPsm,
      } as unknown as Parameters<typeof worker.setParameters>[0])
    }
    const loaded = await loadImageToCanvas(file, maxWidth)
    applyEnhancements(loaded.ctx, loaded.width, loaded.height, enhance)
    const { data } = await worker.recognize(loaded.canvas)
    const text = healOcrText((data.text ?? '').trim())
    const confidence = typeof data.confidence === 'number' ? data.confidence : null
    return { text, confidence }
  } finally {
    await worker.terminate().catch(() => {})
  }
}
