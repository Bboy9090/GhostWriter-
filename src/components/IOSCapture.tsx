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
}

const DEDUPE_WINDOW = 8

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

export function IOSCapture() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<CaptureResult[]>([])
  const [consolidated, setConsolidated] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [dedupeEnabled, setDedupeEnabled] = useState(true)
  const [minChars, setMinChars] = useState(40)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.85)
  const [language, setLanguage] = useState('eng')
  const abortRef = useRef(false)

  const canRun = files.length > 0 && !isProcessing

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => a.name.localeCompare(b.name))
  }, [files])

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList) return
    setFiles(Array.from(fileList))
    setResults([])
    setConsolidated('')
    setProgress(0)
    setCurrentFile(null)
  }

  const handleClear = () => {
    setFiles([])
    setResults([])
    setConsolidated('')
    setProgress(0)
    setCurrentFile(null)
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

  const runOcr = useCallback(async () => {
    if (!canRun) return
    setIsProcessing(true)
    setProgress(0)
    setResults([])
    setConsolidated('')
    setCurrentFile(null)
    abortRef.current = false

    let worker: { terminate: () => Promise<void> } | null = null
    try {
      const { createWorker } = await import('tesseract.js')
      const createdWorker = await createWorker()
      worker = createdWorker
      await createdWorker.loadLanguage(language)
      await createdWorker.initialize(language)

      const consolidatedParagraphs: string[] = []
      const recentParagraphs: string[] = []
      const nextResults: CaptureResult[] = []

      for (let index = 0; index < sortedFiles.length; index += 1) {
        if (abortRef.current) break
        const file = sortedFiles[index]
        setCurrentFile(file.name)
        const { data } = await createdWorker.recognize(file)
        const rawText = (data.text ?? '').trim()
        const paragraphs = splitParagraphs(rawText)

        let kept = 0
        let dropped = 0
        for (const paragraph of paragraphs) {
          if (paragraph.length < minChars) {
            dropped += 1
            continue
          }

          if (dedupeEnabled) {
            const isDuplicate = recentParagraphs.some((recent) =>
              jaccardSimilarity(recent, paragraph) >= similarityThreshold
            )
            if (isDuplicate) {
              dropped += 1
              continue
            }
          }

          consolidatedParagraphs.push(paragraph)
          recentParagraphs.unshift(paragraph)
          if (recentParagraphs.length > DEDUPE_WINDOW) {
            recentParagraphs.pop()
          }
          kept += 1
        }

        nextResults.push({
          id: `${file.name}-${index}`,
          name: file.name,
          text: rawText,
          confidence: typeof data.confidence === 'number' ? data.confidence : null,
          keptParagraphs: kept,
          droppedParagraphs: dropped
        })

        setProgress(Math.round(((index + 1) / sortedFiles.length) * 100))
      }

      setResults(nextResults)
      setConsolidated(consolidatedParagraphs.join('\n\n'))
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
  }, [canRun, dedupeEnabled, language, minChars, similarityThreshold, sortedFiles])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <DeviceMobile size={22} />
            <div>
              <h3 className="text-lg font-semibold">iPhone Capture Vault</h3>
              <p className="text-sm text-muted-foreground">
                Upload iPhone screenshots of ChatGPT or Gemini threads and let GhostWriter
                stitch them into one clean note with automatic dedupe.
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Input type="file" multiple accept="image/*" onChange={handleFiles} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={runOcr} disabled={!canRun}>
                  <UploadSimple size={16} className="mr-1" />
                  Run OCR
                </Button>
                <Button onClick={handleStop} variant="outline" disabled={!isProcessing}>
                  Stop
                </Button>
                <Button onClick={handleClear} variant="ghost" disabled={isProcessing && !files.length}>
                  <Trash size={16} className="mr-1" />
                  Clear
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {files.length} file(s) selected.
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
                onChange={(event) => setMinChars(Number(event.target.value))}
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
                onChange={(event) => setSimilarityThreshold(Number(event.target.value))}
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
                GhostWriter stitches all screenshots into one continuous note.
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
          <Textarea
            value={consolidated}
            readOnly
            placeholder="Upload screenshots to build your consolidated thread."
            className="min-h-[260px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Capture Breakdown</h3>
            <Badge variant="secondary">{results.length} files</Badge>
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
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {result.text || 'No text detected.'}
                </p>
              </div>
            ))}
            {results.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Upload iPhone screenshots to begin OCR extraction.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
