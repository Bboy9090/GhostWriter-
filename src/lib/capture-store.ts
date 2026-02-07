/**
 * Capture Store — Persists captured text entries in localStorage
 * and syncs them across windows via BroadcastChannel.
 *
 * Every capture entry has a timestamp, source, text, confidence, and tags.
 * The store keeps the most recent MAX_ENTRIES and broadcasts new entries
 * so the popout portal and main app both see text flowing in real-time.
 */

export interface CaptureEntry {
  id: string
  sourceApp: string
  content: string
  confidence: number
  tags: string[]
  capturedAt: string // display string e.g. "09:42 AM"
  timestamp: number // epoch ms for sorting
}

const STORAGE_KEY = 'ghostwriter-capture-log'
const CHANNEL_NAME = 'ghostwriter-captures'
const MAX_ENTRIES = 200

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
 * Add a new capture entry. Persists to localStorage and broadcasts
 * to all other windows.
 */
export function addCaptureEntry(
  content: string,
  options?: {
    sourceApp?: string
    confidence?: number
    tags?: string[]
  }
): CaptureEntry {
  const entry: CaptureEntry = {
    id: generateId(),
    sourceApp: options?.sourceApp ?? 'Portal',
    content,
    confidence: options?.confidence ?? Math.round(85 + Math.random() * 14),
    tags: options?.tags ?? autoTag(content),
    capturedAt: formatTime(new Date()),
    timestamp: Date.now(),
  }

  const existing = loadEntries()
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES)
  saveEntries(updated)
  broadcast({ type: 'NEW_ENTRY', entry })

  // Notify in-window listeners
  listeners.forEach(fn => fn(updated))

  return entry
}

/**
 * Clear all captured entries.
 */
export function clearCaptureEntries(): void {
  saveEntries([])
  broadcast({ type: 'CLEAR_ALL' })
  listeners.forEach(fn => fn([]))
}

/**
 * Subscribe to capture entry changes. Returns unsubscribe function.
 * Called with the full updated list whenever entries change.
 */
export function onCaptureChange(callback: (entries: CaptureEntry[]) => void): () => void {
  listeners.add(callback)

  // Also listen for cross-window broadcasts
  const ch = getChannel()
  const handler = (event: MessageEvent<CaptureMessage>) => {
    const msg = event.data
    switch (msg.type) {
      case 'NEW_ENTRY': {
        const current = loadEntries()
        // Avoid duplicates
        if (!current.some(e => e.id === msg.entry.id)) {
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

  ch.addEventListener('message', handler)

  return () => {
    listeners.delete(callback)
    ch.removeEventListener('message', handler)
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
