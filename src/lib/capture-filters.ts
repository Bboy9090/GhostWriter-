/**
 * Capture Filters — Configurable pipeline that processes text before
 * it enters the vault. Handles:
 *
 *  1. Role Detection  — Label "ChatGPT:", "You:", "Gemini:" prefixes
 *  2. Noise Blocklist — Skip UI chrome ("Regenerate response", "Copy", etc.)
 *  3. Source Blocklist — Skip captures from blocked sites/apps
 *  4. Sensitive Filter — Redact or flag passwords, keys, tokens
 *  5. Min Length Gate  — Skip very short snippets
 *  6. Dedup Gate       — Skip text too similar to recent captures
 */

// ── Types ────────────────────────────────────────────────────

export interface FilterSettings {
  /** Strip and label AI chat role prefixes */
  roleDetection: boolean
  /** Custom user-speaker patterns (comma-separated) */
  userPatterns: string
  /** Custom assistant-speaker patterns (comma-separated) */
  assistantPatterns: string

  /** Block known UI noise phrases */
  noiseFilter: boolean
  /** One phrase per line — any captured text containing these is dropped */
  noiseList: string

  /** Block captures from specific sources/sites */
  sourceBlocklist: boolean
  /** One source per line — captures from these apps/sites are dropped */
  blockedSources: string

  /** Auto-flag or redact sensitive content */
  sensitiveFilter: boolean
  /** What to do with sensitive content: 'flag' tags it, 'redact' replaces it, 'drop' skips it */
  sensitiveAction: 'flag' | 'redact' | 'drop'

  /** Minimum character length to keep a capture */
  minLength: number

  /** Simple dedup: skip if Jaccard similarity > threshold with recent N captures */
  dedupEnabled: boolean
  dedupThreshold: number
  dedupWindow: number
}

export interface FilterResult {
  /** null if the text should be dropped entirely */
  text: string | null
  /** Detected role label, if any */
  role: 'user' | 'assistant' | null
  /** Original text before any cleaning */
  original: string
  /** Why it was dropped (if dropped) */
  dropReason: string | null
  /** Extra tags added by filters */
  addedTags: string[]
}

// ── Defaults ─────────────────────────────────────────────────

const DEFAULT_USER_PATTERNS = 'You:, User:, Me:, Human:'
const DEFAULT_ASSISTANT_PATTERNS =
  'ChatGPT:, Assistant:, Gemini:, Claude:, AI:, Copilot:, GPT-4:, GPT:'

const DEFAULT_NOISE_LIST = `Regenerate response
Stop generating
Copy
Share
New chat
Edit
Retry
Scroll to bottom
Copied
Feedback
Thumbs up
Thumbs down
Like
Dislike
Report
Send a message
Type a message
Search
Continue generating
Show more
Show less
Loading
Thinking
Sign in
Log in
Log out
Cookie
Accept cookies
Privacy policy
Terms of service
Subscribe
Upgrade
Premium
Pro
Free trial`

const DEFAULT_BLOCKED_SOURCES = `Ads
Pop-up
Advertisement
Sponsored
Cookie Banner`

const SETTINGS_KEY = 'ghostwriter-filter-settings'

// ── Settings persistence ─────────────────────────────────────

export function getDefaultSettings(): FilterSettings {
  return {
    roleDetection: true,
    userPatterns: DEFAULT_USER_PATTERNS,
    assistantPatterns: DEFAULT_ASSISTANT_PATTERNS,
    noiseFilter: true,
    noiseList: DEFAULT_NOISE_LIST,
    sourceBlocklist: true,
    blockedSources: DEFAULT_BLOCKED_SOURCES,
    sensitiveFilter: true,
    sensitiveAction: 'flag',
    minLength: 15,
    dedupEnabled: true,
    dedupThreshold: 0.85,
    dedupWindow: 10,
  }
}

export function loadFilterSettings(): FilterSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return getDefaultSettings()
    return { ...getDefaultSettings(), ...JSON.parse(raw) }
  } catch {
    return getDefaultSettings()
  }
}

export function saveFilterSettings(settings: FilterSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

// ── Filter pipeline ──────────────────────────────────────────

/** Recent texts for dedup comparison */
const recentTexts: string[] = []

/**
 * Run all enabled filters on a captured text string.
 * Returns null text if the entry should be dropped.
 */
export function applyFilters(
  text: string,
  sourceApp: string,
  settings: FilterSettings
): FilterResult {
  const result: FilterResult = {
    text,
    role: null,
    original: text,
    dropReason: null,
    addedTags: [],
  }

  let cleaned = text.trim()

  // 1. Min length gate
  if (cleaned.length < settings.minLength) {
    result.text = null
    result.dropReason = 'too-short'
    return result
  }

  // 2. Source blocklist
  if (settings.sourceBlocklist) {
    const blocked = parseLines(settings.blockedSources)
    const srcLower = sourceApp.toLowerCase()
    if (blocked.some(b => srcLower.includes(b.toLowerCase()))) {
      result.text = null
      result.dropReason = 'blocked-source'
      return result
    }
  }

  // 3. Noise filter
  if (settings.noiseFilter) {
    const noisePhrases = parseLines(settings.noiseList)
    const cleanedLower = cleaned.toLowerCase()
    // Drop if the ENTIRE text is just a noise phrase (exact or near-match)
    for (const phrase of noisePhrases) {
      const phraseLower = phrase.toLowerCase()
      if (cleanedLower === phraseLower || cleanedLower.trim() === phraseLower.trim()) {
        result.text = null
        result.dropReason = 'noise'
        return result
      }
    }
    // Also drop if text is short AND contains a noise phrase
    if (cleaned.length < 80) {
      for (const phrase of noisePhrases) {
        if (cleanedLower.includes(phrase.toLowerCase())) {
          result.text = null
          result.dropReason = 'noise'
          return result
        }
      }
    }
  }

  // 4. Role detection — strip prefix and label
  if (settings.roleDetection) {
    const userPats = parseCSV(settings.userPatterns)
    const assistantPats = parseCSV(settings.assistantPatterns)

    const matchResult = detectAndStripRole(cleaned, userPats, assistantPats)
    if (matchResult) {
      cleaned = matchResult.text
      result.role = matchResult.role
      result.addedTags.push(matchResult.role === 'user' ? 'you' : 'ai')
    }
  }

  // 5. Sensitive content
  if (settings.sensitiveFilter) {
    const hasSensitive = detectSensitive(cleaned)
    if (hasSensitive) {
      if (settings.sensitiveAction === 'drop') {
        result.text = null
        result.dropReason = 'sensitive'
        return result
      } else if (settings.sensitiveAction === 'redact') {
        cleaned = redactSensitive(cleaned)
        result.addedTags.push('redacted')
      } else {
        // flag
        result.addedTags.push('sensitive')
      }
    }
  }

  // 6. Dedup gate
  if (settings.dedupEnabled) {
    const isDupe = recentTexts
      .slice(0, settings.dedupWindow)
      .some(recent => jaccardSimilarity(recent, cleaned) >= settings.dedupThreshold)
    if (isDupe) {
      result.text = null
      result.dropReason = 'duplicate'
      return result
    }
    // Add to recent window
    recentTexts.unshift(cleaned)
    if (recentTexts.length > settings.dedupWindow + 5) {
      recentTexts.length = settings.dedupWindow
    }
  }

  result.text = cleaned
  return result
}

// ── Helpers ──────────────────────────────────────────────────

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
}

function parseCSV(text: string): string[] {
  return text
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function detectAndStripRole(
  text: string,
  userPatterns: string[],
  assistantPatterns: string[]
): { text: string; role: 'user' | 'assistant' } | null {
  const lower = text.toLowerCase()

  for (const pat of userPatterns) {
    if (lower.startsWith(pat.toLowerCase())) {
      return {
        text: text.slice(pat.length).trim(),
        role: 'user',
      }
    }
  }

  for (const pat of assistantPatterns) {
    if (lower.startsWith(pat.toLowerCase())) {
      return {
        text: text.slice(pat.length).trim(),
        role: 'assistant',
      }
    }
  }

  return null
}

const SENSITIVE_PATTERNS = [
  /\bpassword\s*[:=]\s*\S+/gi,
  /\bsecret\s*[:=]\s*\S+/gi,
  /\bapi[_-]?key\s*[:=]\s*\S+/gi,
  /\btoken\s*[:=]\s*\S+/gi,
  /\bauth\s*[:=]\s*\S+/gi,
  /\bBearer\s+[A-Za-z0-9._-]+/g,
  /\b[A-Za-z0-9]{32,}\b/g, // long hashes/tokens
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // credit card-like
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN-like
]

function detectSensitive(text: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => {
    pattern.lastIndex = 0
    return pattern.test(text)
  })
}

function redactSensitive(text: string): string {
  let result = text
  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  )
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a)
  const setB = tokenize(b)
  if (setA.size === 0 || setB.size === 0) return 0

  let intersection = 0
  for (const tok of setA) {
    if (setB.has(tok)) intersection++
  }

  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}
