/**
 * Capture Store — Persists captured text entries in localStorage
 * and syncs them across windows via BroadcastChannel.
 *
 * Every capture entry has a timestamp, source, text, confidence, and tags.
 * The store keeps the most recent MAX_ENTRIES and broadcasts new entries
 * so the popout portal and main app both see text flowing in real-time.
 *
 * All entries pass through the filter pipeline (capture-filters.ts) before
 * being stored — noise is dropped, roles are labeled, sensitive content
 * is flagged/redacted, duplicates are skipped.
 */

import { applyFilters, loadFilterSettings } from './capture-filters'

export interface CaptureEntry {
  id: string
  sourceApp: string
  content: string
  confidence: number
  tags: string[]
  capturedAt: string // display string e.g. "09:42 AM"
  timestamp: number // epoch ms for sorting
  /** Detected speaker role from AI chat */
  role?: 'user' | 'assistant' | null
  /** Whether entry was filtered/modified */
  filtered?: boolean
}

const STORAGE_KEY = 'ghostwriter-capture-log'
const CHANNEL_NAME = 'ghostwriter-captures'
const SETTINGS_STORAGE_KEY = 'ghostwriter-capture-settings'

/**
 * Default max entries. User can change this via setMaxEntries().
 * localStorage typically allows ~5-10 MB. Each entry averages ~300 bytes,
 * so 10,000 entries ≈ 3 MB — comfortably within limits.
 */
let MAX_ENTRIES = loadMaxEntries()

function loadMaxEntries(): number {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.maxEntries && typeof parsed.maxEntries === 'number') {
        return Math.max(100, Math.min(50000, parsed.maxEntries))
      }
    }
  } catch {
    /* ignore */
  }
  return 10000 // default: 10k entries
}

export function getMaxEntries(): number {
  return MAX_ENTRIES
}

export function setMaxEntries(maxEntries: number): void {
  MAX_ENTRIES = Math.max(100, Math.min(50000, maxEntries))
  try {
    const existing = localStorage.getItem(SETTINGS_STORAGE_KEY)
    const parsed = existing ? JSON.parse(existing) : {}
    parsed.maxEntries = MAX_ENTRIES
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    /* ignore */
  }
}

// ── helpers ──────────────────────────────────────────────────

function generateId(): string {
  return `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

// ── persistent storage ───────────────────────────────────────

function loadEntries(): CaptureEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CaptureEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: CaptureEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {
    // storage full — drop oldest
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)))
    } catch {
      // give up
    }
  }
}

// ── broadcast channel ────────────────────────────────────────

type CaptureMessage =
  | { type: 'NEW_ENTRY'; entry: CaptureEntry }
  | { type: 'CLEAR_ALL' }
  | { type: 'ENTRIES_SYNC'; entries: CaptureEntry[] }
  | { type: 'REQUEST_ENTRIES' }

let captureChannel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel {
  if (!captureChannel) {
    captureChannel = new BroadcastChannel(CHANNEL_NAME)
  }
  return captureChannel
}

function broadcast(msg: CaptureMessage): void {
  try {
    getChannel().postMessage(msg)
  } catch {
    // ignore
  }
}

// ── public API ───────────────────────────────────────────────

/**
 * Get all stored capture entries (newest first).
 */
export function getCaptureEntries(): CaptureEntry[] {
  return loadEntries()
}

/**
 * Add a new capture entry. Runs through the filter pipeline first —
 * returns null if the text was dropped by filters.
 * Persists to localStorage and broadcasts to all other windows.
 */
export function addCaptureEntry(
  content: string,
  options?: {
    sourceApp?: string
    confidence?: number
    tags?: string[]
    /** Skip filters (e.g. for manual entries the user typed themselves) */
    skipFilters?: boolean
  }
): CaptureEntry | null {
  const sourceApp = options?.sourceApp ?? 'Portal'

  // Run through filter pipeline unless explicitly skipped
  let finalContent = content
  let role: 'user' | 'assistant' | null = null
  let extraTags: string[] = []
  let wasFiltered = false

  if (!options?.skipFilters) {
    const settings = loadFilterSettings()
    const result = applyFilters(content, sourceApp, settings)

    if (result.text === null) {
      // Text was dropped by filters — increment drop counter but don't store
      droppedCount++
      return null
    }

    finalContent = result.text
    role = result.role
    extraTags = result.addedTags
    wasFiltered = finalContent !== content || extraTags.length > 0
  }

  const baseTags = options?.tags ?? autoTag(finalContent)
  const allTags = [...new Set([...baseTags, ...extraTags])]

  const entry: CaptureEntry = {
    id: generateId(),
    sourceApp,
    content: finalContent,
    confidence: options?.confidence ?? Math.round(85 + Math.random() * 14),
    tags: allTags,
    capturedAt: formatTime(new Date()),
    timestamp: Date.now(),
    role,
    filtered: wasFiltered,
  }

  const existing = loadEntries()
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES)
  saveEntries(updated)
  broadcast({ type: 'NEW_ENTRY', entry })

  // Notify in-window listeners
  listeners.forEach(listener => listener(updated))

  return entry
}

/** Count of entries dropped by filters (for stats display) */
let droppedCount = 0

export function getDroppedCount(): number {
  return droppedCount
}

export function resetDroppedCount(): void {
  droppedCount = 0
}

// ── Storage measurement ──────────────────────────────────────

export interface StorageStats {
  /** Number of entries currently stored */
  entryCount: number
  /** Max entries allowed */
  maxEntries: number
  /** Percentage full (0-100) */
  percentFull: number
  /** Approximate size in bytes used by the capture log */
  bytesUsed: number
  /** Human-readable size string */
  sizeFormatted: string
  /** Whether the store is near full (>80%) */
  isNearFull: boolean
  /** Whether the store is at capacity */
  isFull: boolean
}

export function getStorageStats(): StorageStats {
  const entries = loadEntries()
  const entryCount = entries.length
  const maxEntries = MAX_ENTRIES
  const percentFull = maxEntries > 0 ? Math.round((entryCount / maxEntries) * 100) : 0

  let bytesUsed = 0
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    bytesUsed = raw ? new TextEncoder().encode(raw).byteLength : 0
  } catch {
    bytesUsed = 0
  }

  return {
    entryCount,
    maxEntries,
    percentFull,
    bytesUsed,
    sizeFormatted: formatBytes(bytesUsed),
    isNearFull: percentFull >= 80,
    isFull: entryCount >= maxEntries,
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ── Export / Download ────────────────────────────────────────

/**
 * Export all capture entries as a JSON string.
 */
export function exportCaptureJSON(): string {
  const entries = loadEntries()
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      entryCount: entries.length,
      entries,
    },
    null,
    2
  )
}

/**
 * Export capture entries as plain text (one entry per block).
 */
export function exportCaptureText(): string {
  const entries = loadEntries()
  return entries
    .map(entry => {
      const rolePrefix = entry.role === 'user' ? '[You] ' : entry.role === 'assistant' ? '[AI] ' : ''
      return `[${entry.capturedAt}] ${entry.sourceApp}\n${rolePrefix}${entry.content}\nTags: ${entry.tags.join(', ')}\n`
    })
    .join('\n---\n\n')
}

/**
 * Trigger a file download with the given content.
 */
export function downloadCaptures(format: 'json' | 'text'): void {
  const content = format === 'json' ? exportCaptureJSON() : exportCaptureText()
  const ext = format === 'json' ? 'json' : 'txt'
  const mime = format === 'json' ? 'application/json' : 'text/plain'
  const filename = `ghostwriter-captures-${new Date().toISOString().slice(0, 10)}.${ext}`

  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Import capture entries from a JSON export string.
 * Merges with existing entries (deduplicates by id).
 */
export function importCaptureJSON(jsonStr: string): number {
  try {
    const parsed = JSON.parse(jsonStr)
    const imported: CaptureEntry[] = parsed.entries ?? parsed
    if (!Array.isArray(imported)) return 0

    const existing = loadEntries()
    const existingIds = new Set(existing.map(entry => entry.id))
    const newEntries = imported.filter(entry => entry.id && !existingIds.has(entry.id))
    const merged = [...newEntries, ...existing]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_ENTRIES)

    saveEntries(merged)
    listeners.forEach(listener => listener(merged))
    broadcast({ type: 'ENTRIES_SYNC', entries: merged })
    return newEntries.length
  } catch {
    return 0
  }
}

/**
 * Clear all captured entries.
 */
export function clearCaptureEntries(): void {
  saveEntries([])
  broadcast({ type: 'CLEAR_ALL' })
  listeners.forEach(listener => listener([]))
}

/**
 * Subscribe to capture entry changes. Returns unsubscribe function.
 * Called with the full updated list whenever entries change.
 */
export function onCaptureChange(callback: (entries: CaptureEntry[]) => void): () => void {
  listeners.add(callback)

  // Also listen for cross-window broadcasts
  const broadcastChannel = getChannel()
  const handler = (event: MessageEvent<CaptureMessage>) => {
    const msg = event.data
    switch (msg.type) {
      case 'NEW_ENTRY': {
        const current = loadEntries()
        // Avoid duplicates
        if (!current.some(entry => entry.id === msg.entry.id)) {
          const updated = [msg.entry, ...current].slice(0, MAX_ENTRIES)
          saveEntries(updated)
          callback(updated)
        }
        break
      }
      case 'CLEAR_ALL':
        saveEntries([])
        callback([])
        break
      case 'ENTRIES_SYNC':
        saveEntries(msg.entries)
        callback(msg.entries)
        break
      case 'REQUEST_ENTRIES': {
        const entries = loadEntries()
        broadcast({ type: 'ENTRIES_SYNC', entries })
        break
      }
    }
  }

  broadcastChannel.addEventListener('message', handler)

  return () => {
    listeners.delete(callback)
    broadcastChannel.removeEventListener('message', handler)
  }
}

/**
 * Request entries sync from other windows.
 */
export function requestEntriesSync(): void {
  broadcast({ type: 'REQUEST_ENTRIES' })
}

// ── in-window listeners set ──────────────────────────────────

const listeners = new Set<(entries: CaptureEntry[]) => void>()

// ── auto-tagging ─────────────────────────────────────────────

function autoTag(text: string): string[] {
  const tags: string[] = []
  const lower = text.toLowerCase()

  if (lower.includes('http') || lower.includes('www.')) tags.push('link')
  if (lower.includes('error') || lower.includes('exception')) tags.push('error')
  if (lower.includes('function') || lower.includes('const ') || lower.includes('class '))
    tags.push('code')
  if (lower.includes('price') || lower.includes('$') || lower.includes('cost')) tags.push('price')
  if (lower.includes('email') || lower.includes('@')) tags.push('contact')
  if (lower.includes('todo') || lower.includes('task')) tags.push('task')
  if (lower.includes('password') || lower.includes('secret') || lower.includes('key'))
    tags.push('sensitive')
  if (text.length > 200) tags.push('long')
  if (text.length < 60) tags.push('snippet')

  if (tags.length === 0) tags.push('text')

  return tags
}

// ── demo / simulated capture ─────────────────────────────────

const DEMO_CAPTURES = [
  {
    text: 'MediaProjection must start after overlay is visible on Android 15.',
    source: 'Chrome',
    tags: ['portal', 'permissions'],
  },
  {
    text: 'Dedup gate ignored 4 repeated paragraphs during slow scroll.',
    source: 'PDF Reader',
    tags: ['dedupe', 'scroll'],
  },
  {
    text: 'Healer reconstructed the paragraph and removed line breaks.',
    source: 'Instagram',
    tags: ['healer', 'formatting'],
  },
  {
    text: 'Portal captured block geometry for layout-aware syncing.',
    source: 'Docs',
    tags: ['layout', 'blocks'],
  },
  {
    text: 'Vault indexed the entry with vector embeddings in 28ms.',
    source: 'News',
    tags: ['vault', 'pgvector'],
  },
  {
    text: 'The quick brown fox jumps over the lazy dog near the riverbank.',
    source: 'Safari',
    tags: ['text'],
  },
  {
    text: 'function handleCapture(frame: ImageData) { return processOCR(frame); }',
    source: 'VS Code',
    tags: ['code'],
  },
  {
    text: 'Meeting at 3pm tomorrow to discuss the new feature rollout.',
    source: 'Slack',
    tags: ['task'],
  },
  {
    text: 'Error: ECONNREFUSED when connecting to Redis on port 6379.',
    source: 'Terminal',
    tags: ['error'],
  },
  {
    text: 'Your order #4829 has shipped. Expected delivery: Friday.',
    source: 'Gmail',
    tags: ['text'],
  },
  {
    text: 'React 19 introduces use() hook for reading resources in render.',
    source: 'Twitter',
    tags: ['code', 'text'],
  },
  {
    text: 'SELECT * FROM vault_entries WHERE similarity > 0.85 ORDER BY created_at DESC;',
    source: 'pgAdmin',
    tags: ['code'],
  },
  {
    text: 'Battery optimization may pause background capture. Disable for best results.',
    source: 'Settings',
    tags: ['portal'],
  },
  {
    text: 'The embedding model produces 384-dimensional vectors for semantic search.',
    source: 'Docs',
    tags: ['vault', 'text'],
  },
  {
    text: 'New PR: Add support for HEIC image format in OCR pipeline.',
    source: 'GitHub',
    tags: ['code', 'task'],
  },
]

let demoInterval: ReturnType<typeof setInterval> | null = null
let demoIndex = 0

/**
 * Start simulated capture — adds a new entry every few seconds
 * while the portal is active (for demo purposes).
 */
export function startDemoCapture(): void {
  if (demoInterval) return
  demoInterval = setInterval(
    () => {
      const demo = DEMO_CAPTURES[demoIndex % DEMO_CAPTURES.length]!
      addCaptureEntry(demo.text, {
        sourceApp: demo.source,
        tags: demo.tags,
        confidence: Math.round(88 + Math.random() * 11),
      })
      demoIndex++
    },
    3000 + Math.random() * 2000
  )
}

/**
 * Stop simulated capture.
 */
export function stopDemoCapture(): void {
  if (demoInterval) {
    clearInterval(demoInterval)
    demoInterval = null
  }
}
