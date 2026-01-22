import { useCallback, useMemo, useRef, useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'
import {
  Copy,
  DeviceMobile,
  DownloadSimple,
  Trash,
  UploadSimple,
  Warning
} from '@phosphor-icons/react'
import { toast } from 'sonner'

type CaptureResult = {
  id: string
  name: string
  text: string
  confidence: number | null
  keptParagraphs: number
  droppedParagraphs: number
  capturedAt?: string
}

type InputMode = 'images' | 'video'
type SortMode = 'auto' | 'timestamp' | 'filename'

const DEDUPE_WINDOW = 8
const MOTION_SCALE = 8
const PARAGRAPH_TOKEN = '__GW_PARA__'

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function jaccardSimilarity(a: string, b: string) {
  const tokensA = new Set(tokenize(a))
  const tokensB = new Set(tokenize(b))
  if (tokensA.size === 0 || tokensB.size === 0) return 0

  let intersection = 0
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1
  }

  const union = tokensA.size + tokensB.size - intersection
  return union === 0 ? 0 : intersection / union
}

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function healText(rawText: string) {
  if (!rawText) return ''
  let cleaned = rawText.replace(/-\n(\w)/g, '$1')
  cleaned = cleaned.replace(/\n\s*\n+/g, PARAGRAPH_TOKEN)
  cleaned = cleaned.replace(/\n+/g, ' ')
  cleaned = cleaned.replace(new RegExp(PARAGRAPH_TOKEN, 'g'), '\n\n')
  return cleaned.trim()
}

function sortImageEntries(
  entries: Array<{ file: File; timestamp: number | null }>,
  mode: SortMode
) {
  const sorted = [...entries]
  return sorted.sort((a, b) => {
    if (mode === 'filename') {
      return a.file.name.localeCompare(b.file.name)
    }

    const timeA = a.timestamp ?? a.file.lastModified
    const timeB = b.timestamp ?? b.file.lastModified
    if (timeA !== timeB) {
      return timeA - timeB
    }
    return a.file.name.localeCompare(b.file.name)
  })
}

function formatTimestamp(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 10)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis}`
}

function getLuma(data: Uint8ClampedArray, idx: number) {
  const r = data[idx]
  const g = data[idx + 1]
  const b = data[idx + 2]
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function computeMotionScore(prev: ImageData | null, next: ImageData, sampleStep: number) {
  if (!prev) return 1
  if (prev.width !== next.width || prev.height !== next.height) return 1
  const step = Math.max(1, Math.floor(sampleStep))
  let totalDiff = 0
  let samples = 0
  const width = next.width
  const height = next.height

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4
      const lumaA = getLuma(prev.data, idx)
      const lumaB = getLuma(next.data, idx)
      totalDiff += Math.abs(lumaA - lumaB)
      samples += 1
    }
  }

  return samples === 0 ? 0 : totalDiff / samples
}

export function IOSCapture() {
  const [inputMode, setInputMode] = useState<InputMode>('images')
  const [sortMode, setSortMode] = useState<SortMode>('auto')
  const [files, setFiles] = useState<File[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [imageMeta, setImageMeta] = useState<Array<{ file: File; timestamp: number | null }>>([])
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaMissingCount, setMetaMissingCount] = useState(0)
  const [results, setResults] = useState<CaptureResult[]>([])
  const [consolidated, setConsolidated] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [dedupeEnabled, setDedupeEnabled] = useState(true)
  const [minChars, setMinChars] = useState(40)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.85)
  const [language, setLanguage] = useState('eng')
  const [frameIntervalMs, setFrameIntervalMs] = useState(900)
  const [maxFrames, setMaxFrames] = useState(140)
  const [deltaThreshold, setDeltaThreshold] = useState(0.012)
  const [sampleStep, setSampleStep] = useState(4)
  const [maxWidth, setMaxWidth] = useState(1280)
  const [sessionName, setSessionName] = useState('')
  const [includeHeader, setIncludeHeader] = useState(true)
  const [lineHealEnabled, setLineHealEnabled] = useState(true)
  const [dedupeWindow, setDedupeWindow] = useState(DEDUPE_WINDOW)
  const [sourceApp, setSourceApp] = useState('ChatGPT')
  const [autoSortEnabled, setAutoSortEnabled] = useState(true)
  const [summary, setSummary] = useState({
    processed: 0,
    emitted: 0,
    skippedMotion: 0,
    skippedText: 0,
    skippedDuplicate: 0
  })
  const abortRef = useRef(false)

  const canRun = !isProcessing && (
    (inputMode === 'images' && files.length > 0) ||
    (inputMode === 'video' && Boolean(videoFile))
  )

  const sortedFiles = useMemo(() => {
    const meta = imageMeta.length ? imageMeta : files.map((file) => ({ file, timestamp: null }))
    return sortImageEntries(meta, sortMode)
  }, [files, imageMeta, sortMode])

  const resetState = () => {
    setResults([])
    setConsolidated('')
    setProgress(0)
    setCurrentFile(null)
    setSummary({
      processed: 0,
      emitted: 0,
      skippedMotion: 0,
      skippedText: 0,
      skippedDuplicate: 0
    })
  }

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode)
    setFiles([])
    setVideoFile(null)
    setImageMeta([])
    setMetaMissingCount(0)
    resetState()
  }

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList) return
    const nextFiles = Array.from(fileList)
    setFiles(nextFiles)
    setVideoFile(null)
    resetState()
    if (autoSortEnabled) {
      void buildImageMeta(nextFiles)
    } else {
      setImageMeta([])
      setMetaMissingCount(0)
    }
  }

  const handleVideoFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) return
    setVideoFile(fileList[0])
    setFiles([])
    setImageMeta([])
    setMetaMissingCount(0)
    resetState()
  }

  const handleClear = () => {
    setFiles([])
    setVideoFile(null)
    setImageMeta([])
    setMetaMissingCount(0)
    setResults([])
    setConsolidated('')
    setProgress(0)
    setCurrentFile(null)
    setSummary({
      processed: 0,
      emitted: 0,
      skippedMotion: 0,
      skippedText: 0,
      skippedDuplicate: 0
    })
    abortRef.current = false
  }

  const handleStop = () => {
    abortRef.current = true
  }

  const handleCopy = async () => {
    if (!consolidated) return
    await navigator.clipboard.writeText(consolidated)
    toast.success('Copied consolidated text.')
  }

  const handleDownload = () => {
    if (!consolidated) return
    const blob = new Blob([consolidated], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ghostwriter-vault.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const buildImageMeta = async (nextFiles: File[]) => {
    if (!nextFiles.length) return
    setMetaLoading(true)
    setMetaMissingCount(0)
    try {
      const exifrModule = await import('exifr')
      const nextMeta = []
      let missing = 0

      for (const file of nextFiles) {
        let timestamp: number | null = null
        try {
          const data = await exifrModule.parse(file, {
            pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate']
          })
          const exifDate = data?.DateTimeOriginal || data?.CreateDate || data?.ModifyDate
          if (exifDate instanceof Date) {
            timestamp = exifDate.getTime()
          }
        } catch {
          timestamp = null
        }

        if (!timestamp) missing += 1
        nextMeta.push({ file, timestamp })
      }

      setImageMeta(nextMeta)
      setMetaMissingCount(missing)
      return { meta: nextMeta, missing }
    } finally {
      setMetaLoading(false)
    }
  }

  const runOcr = useCallback(async () => {
    if (!canRun) return
    setIsProcessing(true)
    setProgress(0)
    setResults([])
    setConsolidated('')
    setCurrentFile(null)
    setSummary({
      processed: 0,
      emitted: 0,
      skippedMotion: 0,
      skippedText: 0,
      skippedDuplicate: 0
    })
    abortRef.current = false

    let worker: { terminate: () => Promise<void> } | null = null
    let processed = 0
    let skippedMotion = 0
    let skippedText = 0
    let skippedDuplicate = 0

    const consolidatedParagraphs: string[] = []
    const recentParagraphs: string[] = []
    const nextResults: CaptureResult[] = []
    let localImageEntries = sortedFiles

    const ingestParagraphs = (
      rawText: string,
      label: string,
      confidence: number | null,
      capturedAt?: string
    ) => {
      const cleanedText = lineHealEnabled ? healText(rawText) : rawText.trim()
      const paragraphs = splitParagraphs(cleanedText)
      let kept = 0
      let dropped = 0

      for (const paragraph of paragraphs) {
        if (paragraph.length < minChars) {
          dropped += 1
          skippedText += 1
          continue
        }

          if (dedupeEnabled && dedupeWindow > 0) {
          const isDuplicate = recentParagraphs.some((recent) =>
            jaccardSimilarity(recent, paragraph) >= similarityThreshold
          )
          if (isDuplicate) {
            dropped += 1
            skippedDuplicate += 1
            continue
          }
        }

        consolidatedParagraphs.push(paragraph)
        recentParagraphs.unshift(paragraph)
        if (recentParagraphs.length > dedupeWindow) {
          recentParagraphs.pop()
        }
        kept += 1
      }

      nextResults.push({
        id: `${label}-${Date.now()}`,
        name: label,
        text: cleanedText,
        confidence,
        keptParagraphs: kept,
        droppedParagraphs: dropped,
        capturedAt
      })
    }

    try {
      const { createWorker } = await import('tesseract.js')
      const createdWorker = await createWorker()
      worker = createdWorker
      await createdWorker.loadLanguage(language)
      await createdWorker.initialize(language)

      if (inputMode === 'images') {
        if (autoSortEnabled && files.length > 0 && imageMeta.length !== files.length) {
          const metaResult = await buildImageMeta(files)
          if (metaResult?.meta) {
            localImageEntries = sortImageEntries(metaResult.meta, sortMode)
          }
        }

        for (let index = 0; index < localImageEntries.length; index += 1) {
          if (abortRef.current) break
          const entry = localImageEntries[index]
          const file = entry.file
          setCurrentFile(file.name)
          const { data } = await createdWorker.recognize(file)
          const rawText = (data.text ?? '').trim()
          const capturedAt = entry.timestamp
            ? new Date(entry.timestamp).toLocaleString()
            : new Date(file.lastModified).toLocaleString()
          ingestParagraphs(
            rawText,
            file.name,
            typeof data.confidence === 'number' ? data.confidence : null,
            capturedAt
          )
          processed += 1
          setProgress(Math.round(((index + 1) / localImageEntries.length) * 100))
        }
      } else if (inputMode === 'video' && videoFile) {
        const video = document.createElement('video')
        const url = URL.createObjectURL(videoFile)
        video.src = url
        video.muted = true
        video.playsInline = true
        video.preload = 'auto'

        await new Promise<void>((resolve, reject) => {
          const onLoaded = () => resolve()
          const onError = () => reject(new Error('Failed to load video metadata.'))
          video.addEventListener('loadedmetadata', onLoaded, { once: true })
          video.addEventListener('error', onError, { once: true })
          video.load()
        })

        const duration = Number.isFinite(video.duration) ? video.duration : 0
        if (duration <= 0) {
          throw new Error('Video duration is unavailable or zero.')
        }

        const intervalSeconds = Math.max(frameIntervalMs / 1000, 0.25)
        const estimatedFrames = Math.floor(duration / intervalSeconds) + 1
        const totalFrames = Math.min(estimatedFrames, Math.max(1, maxFrames))

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const motionCanvas = document.createElement('canvas')
        const motionCtx = motionCanvas.getContext('2d')
        if (!ctx || !motionCtx) {
          throw new Error('Canvas unavailable for video processing.')
        }

        let lastMotionData: ImageData | null = null

        for (let index = 0; index < totalFrames; index += 1) {
          if (abortRef.current) break
          const time = Math.min(duration, index * intervalSeconds)
          setCurrentFile(`Frame ${index + 1} @ ${formatTimestamp(time)}`)

          await new Promise<void>((resolve) => {
            const onSeeked = () => resolve()
            video.addEventListener('seeked', onSeeked, { once: true })
            video.currentTime = time
          })

          const scale = Math.min(1, maxWidth / video.videoWidth)
          const width = Math.max(1, Math.floor(video.videoWidth * scale))
          const height = Math.max(1, Math.floor(video.videoHeight * scale))
          canvas.width = width
          canvas.height = height
          ctx.drawImage(video, 0, 0, width, height)

          motionCanvas.width = Math.max(1, Math.floor(width / MOTION_SCALE))
          motionCanvas.height = Math.max(1, Math.floor(height / MOTION_SCALE))
          motionCtx.drawImage(canvas, 0, 0, motionCanvas.width, motionCanvas.height)
          const motionData = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height)
          const motionScore = computeMotionScore(lastMotionData, motionData, sampleStep)
          lastMotionData = motionData

          if (motionScore < deltaThreshold) {
            skippedMotion += 1
            setProgress(Math.round(((index + 1) / totalFrames) * 100))
            continue
          }

          const { data } = await createdWorker.recognize(canvas)
          const rawText = (data.text ?? '').trim()
          ingestParagraphs(
            rawText,
            `Frame ${index + 1} (${formatTimestamp(time)})`,
            typeof data.confidence === 'number' ? data.confidence : null,
            formatTimestamp(time)
          )
          processed += 1
          setProgress(Math.round(((index + 1) / totalFrames) * 100))
        }

        URL.revokeObjectURL(url)
      }

      const headerLines: string[] = []
      if (includeHeader && sessionName.trim()) {
        headerLines.push(`Session: ${sessionName.trim()}`)
      }
      if (includeHeader && sourceApp.trim()) {
        headerLines.push(`Source: ${sourceApp.trim()}`)
      }
      if (includeHeader) {
        headerLines.push(`Captured: ${new Date().toLocaleString()}`)
      }
      const headerText = headerLines.length > 0 ? `${headerLines.join('\n')}\n\n` : ''
      setResults(nextResults)
      setConsolidated(headerText + consolidatedParagraphs.join('\n\n'))
      setSummary({
        processed,
        emitted: consolidatedParagraphs.length,
        skippedMotion,
        skippedText,
        skippedDuplicate
      })

      if (abortRef.current) {
        toast.info('OCR stopped early.')
      } else {
        toast.success('OCR capture complete.')
      }
    } catch (error) {
      toast.error('OCR failed. Check console for details.')
      console.error(error)
    } finally {
      if (worker) {
        await worker.terminate()
      }
      setIsProcessing(false)
      setCurrentFile(null)
      abortRef.current = false
    }
  }, [
    canRun,
    dedupeEnabled,
    dedupeWindow,
    deltaThreshold,
    frameIntervalMs,
    includeHeader,
    inputMode,
    language,
    autoSortEnabled,
    imageMeta,
    files,
    sortMode,
    maxFrames,
    maxWidth,
    minChars,
    sampleStep,
    sessionName,
    similarityThreshold,
    sortedFiles,
    sourceApp,
    lineHealEnabled,
    videoFile
  ])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <DeviceMobile size={22} />
            <div>
              <h3 className="text-lg font-semibold">iPhone Capture Vault</h3>
              <p className="text-sm text-muted-foreground">
                Upload iPhone screenshots or screen recordings of ChatGPT or Gemini threads and let
                GhostWriter stitch them into one clean note with automatic dedupe.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <div className="flex items-start gap-2">
              <Warning size={18} className="mt-0.5" />
              <div>
                iOS does not allow live capture of other apps. Use screenshots or screen recordings,
                then upload the frames here for real OCR processing.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={inputMode === 'images' ? 'default' : 'outline'}
              onClick={() => handleModeChange('images')}
            >
              Screenshots
            </Button>
            <Button
              size="sm"
              variant={inputMode === 'video' ? 'default' : 'outline'}
              onClick={() => handleModeChange('video')}
            >
              Screen Recording
            </Button>
            <Badge variant="secondary">{inputMode === 'images' ? 'Batch OCR' : 'Frame OCR'}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              {inputMode === 'images' ? (
                <>
                  <Input type="file" multiple accept="image/*" onChange={handleFiles} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={autoSortEnabled ? 'secondary' : 'outline'}
                      onClick={() => {
                        const nextValue = !autoSortEnabled
                        setAutoSortEnabled(nextValue)
                        if (nextValue) {
                          void buildImageMeta(files)
                        } else {
                          setSortMode('filename')
                          setImageMeta([])
                          setMetaMissingCount(0)
                        }
                      }}
                    >
                      {autoSortEnabled ? 'Auto EXIF Sort' : 'Manual Sort'}
                    </Button>
                    <Button
                      size="sm"
                      variant={sortMode === 'timestamp' ? 'secondary' : 'outline'}
                      onClick={() => setSortMode('timestamp')}
                      disabled={!autoSortEnabled}
                    >
                      Sort by Time
                    </Button>
                    <Button
                      size="sm"
                      variant={sortMode === 'filename' ? 'secondary' : 'outline'}
                      onClick={() => setSortMode('filename')}
                    >
                      Sort by Name
                    </Button>
                    <Button
                      size="sm"
                      variant={sortMode === 'auto' ? 'secondary' : 'outline'}
                      onClick={() => setSortMode('auto')}
                      disabled={!autoSortEnabled}
                    >
                      Auto Order
                    </Button>
                  </div>
                  {autoSortEnabled && (
                    <div className="text-xs text-muted-foreground">
                      {metaLoading
                        ? 'Reading EXIF timestamps...'
                        : metaMissingCount > 0
                          ? `${metaMissingCount} file(s) missing EXIF. Falling back to file time.`
                          : 'EXIF timestamps detected.'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Input type="file" accept="video/*" onChange={handleVideoFile} />
                  <div className="text-xs text-muted-foreground">
                    Upload one screen recording. GhostWriter will sample frames at the interval below.
                  </div>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={runOcr} disabled={!canRun}>
                  <UploadSimple size={16} className="mr-1" />
                  Run OCR
                </Button>
                <Button onClick={handleStop} variant="outline" disabled={!isProcessing}>
                  Stop
                </Button>
                <Button
                  onClick={handleClear}
                  variant="ghost"
                  disabled={isProcessing || (!files.length && !videoFile)}
                >
                  <Trash size={16} className="mr-1" />
                  Clear
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {inputMode === 'images'
                  ? `${files.length} file(s) selected.`
                  : videoFile
                    ? `Selected: ${videoFile.name}`
                    : 'No video selected.'}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
              <div className="text-xs text-muted-foreground">
                {isProcessing && currentFile ? `Processing ${currentFile}` : 'Idle'}
              </div>
            </div>
          </div>

          <Separator />

          {inputMode === 'video' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="text-sm font-medium">Frame interval (ms)</p>
                  <Input
                    type="number"
                    min={250}
                    max={3000}
                    value={frameIntervalMs}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setFrameIntervalMs(Number.isFinite(next) ? next : 900)
                    }}
                  />
                </div>
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="text-sm font-medium">Max frames</p>
                  <Input
                    type="number"
                    min={10}
                    max={600}
                    value={maxFrames}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setMaxFrames(Number.isFinite(next) ? next : 140)
                    }}
                  />
                </div>
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="text-sm font-medium">Motion delta</p>
                  <Input
                    type="number"
                    min={0.001}
                    max={0.05}
                    step={0.001}
                    value={deltaThreshold}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setDeltaThreshold(Number.isFinite(next) ? next : 0.012)
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="text-sm font-medium">Motion sample step</p>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={sampleStep}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setSampleStep(Number.isFinite(next) ? next : 4)
                    }}
                  />
                </div>
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="text-sm font-medium">Max width</p>
                  <Input
                    type="number"
                    min={480}
                    max={1920}
                    value={maxWidth}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setMaxWidth(Number.isFinite(next) ? next : 1280)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Dedupe</p>
                <p className="text-xs text-muted-foreground">Avoid repeated paragraphs</p>
              </div>
              <Switch checked={dedupeEnabled} onCheckedChange={setDedupeEnabled} />
            </div>
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-sm font-medium">Min chars</p>
              <Input
                type="number"
                min={10}
                max={200}
                value={minChars}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setMinChars(Number.isFinite(next) ? next : 40)
                }}
              />
            </div>
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-sm font-medium">Similarity</p>
              <Input
                type="number"
                min={0.5}
                max={0.99}
                step={0.01}
                value={similarityThreshold}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setSimilarityThreshold(Number.isFinite(next) ? next : 0.85)
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-sm font-medium">Session name</p>
              <Input
                value={sessionName}
                onChange={(event) => setSessionName(event.target.value)}
                placeholder="ChatGPT Project Threads"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Include header</p>
                <p className="text-xs text-muted-foreground">Add session + timestamp</p>
              </div>
              <Switch checked={includeHeader} onCheckedChange={setIncludeHeader} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-sm font-medium">Source app</p>
              <Input
                value={sourceApp}
                onChange={(event) => setSourceApp(event.target.value)}
                placeholder="ChatGPT"
              />
              <div className="flex flex-wrap gap-2 pt-2">
                {['ChatGPT', 'Gemini', 'Notes', 'Other'].map((label) => (
                  <Button
                    key={label}
                    size="sm"
                    variant={sourceApp === label ? 'secondary' : 'outline'}
                    onClick={() => setSourceApp(label)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Line heal</p>
                <p className="text-xs text-muted-foreground">Fix line breaks</p>
              </div>
              <Switch checked={lineHealEnabled} onCheckedChange={setLineHealEnabled} />
            </div>
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-sm font-medium">Dedupe window</p>
              <Input
                type="number"
                min={1}
                max={20}
                value={dedupeWindow}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setDedupeWindow(Number.isFinite(next) ? Math.max(1, next) : DEDUPE_WINDOW)
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Language</p>
            <Input
              value={language}
              onChange={(event) => setLanguage(event.target.value.trim() || 'eng')}
              placeholder="eng"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">Consolidated Thread</h3>
              <p className="text-sm text-muted-foreground">
                GhostWriter stitches screenshots or recordings into one continuous note.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCopy} disabled={!consolidated}>
                <Copy size={16} className="mr-1" />
                Copy
              </Button>
              <Button variant="outline" onClick={handleDownload} disabled={!consolidated}>
                <DownloadSimple size={16} className="mr-1" />
                Download
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">Processed {summary.processed}</Badge>
            <Badge variant="secondary">Emitted {summary.emitted}</Badge>
            <Badge variant="outline">Skipped motion {summary.skippedMotion}</Badge>
            <Badge variant="outline">Skipped text {summary.skippedText}</Badge>
            <Badge variant="outline">Duplicates {summary.skippedDuplicate}</Badge>
          </div>
          <Textarea
            value={consolidated}
            readOnly
            placeholder="Upload screenshots or a screen recording to build your consolidated thread."
            className="min-h-[260px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Capture Breakdown</h3>
            <Badge variant="secondary">
              {results.length} {inputMode === 'video' ? 'frames' : 'files'}
            </Badge>
          </div>
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">{result.name}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Kept {result.keptParagraphs}</span>
                <span>Dropped {result.droppedParagraphs}</span>
                {result.confidence !== null && (
                  <Badge variant="outline">{Math.round(result.confidence)}% conf</Badge>
                )}
                {result.capturedAt && <span>{result.capturedAt}</span>}
              </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {result.text || 'No text detected.'}
                </p>
              </div>
            ))}
            {results.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Upload iPhone screenshots or a screen recording to begin OCR extraction.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
