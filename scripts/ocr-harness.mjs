import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const root = process.cwd()

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    if (key === 'list' || key === 'help') {
      args[key] = true
    } else {
      args[key] = argv[i + 1]
      i += 1
    }
  }
  return args
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

function paragraphSplit(text) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function computeMetrics(expectedText, actualText) {
  const expectedWords = tokenize(expectedText)
  const actualWords = tokenize(actualText)
  const maxLen = Math.max(expectedWords.length, actualWords.length)
  const wordDistance = levenshtein(expectedWords, actualWords)
  const wordAccuracy = maxLen === 0 ? 1 : 1 - wordDistance / maxLen

  const expectedParagraphs = paragraphSplit(expectedText)
  const actualParagraphs = new Set(paragraphSplit(actualText))
  const matched = expectedParagraphs.filter((paragraph) => actualParagraphs.has(paragraph)).length
  const paragraphMatchRate = expectedParagraphs.length === 0 ? 1 : matched / expectedParagraphs.length

  return { wordAccuracy, paragraphMatchRate }
}

async function loadCases() {
  const casesPath = path.join(root, 'tests', 'ocr', 'cases.json')
  const raw = await readFile(casesPath, 'utf8')
  return JSON.parse(raw)
}

async function loadAdapter(adapterName) {
  const adapterPath = path.join(root, 'scripts', 'ocr-adapters', `${adapterName}.mjs`)
  try {
    const moduleUrl = pathToFileURL(adapterPath).href
    const module = await import(moduleUrl)
    if (typeof module.extractText !== 'function') {
      throw new Error('Adapter must export extractText()')
    }
    return module
  } catch (error) {
    throw new Error(`Failed to load adapter "${adapterName}": ${error.message}`)
  }
}

function printHelp() {
  console.log('GhostWriter OCR harness')
  console.log('Usage:')
  console.log('  node scripts/ocr-harness.mjs --adapter tesseract')
  console.log('  node scripts/ocr-harness.mjs --adapter tesseract --case OCR-001')
  console.log('Options:')
  console.log('  --adapter <name>  Adapter module name (default: mock)')
  console.log('  --case <id>       Run a single case id')
  console.log('  --list            List available cases')
}

const args = parseArgs(process.argv.slice(2))

if (args.help) {
  printHelp()
  process.exit(0)
}

const cases = await loadCases()

if (args.list) {
  cases.forEach((testCase) => {
    console.log(`${testCase.id} ${testCase.name}`)
  })
  process.exit(0)
}

const adapterName = args.adapter || process.env.GHOSTWRITER_OCR_ADAPTER || 'tesseract'

const adapter = await loadAdapter(adapterName)
const selectedCases = args.case
  ? cases.filter((testCase) => testCase.id === args.case)
  : cases

if (selectedCases.length === 0) {
  console.error('No OCR cases defined. Capture real frames with:')
  console.error('  node scripts/ocr-capture.mjs --id OCR-001 --name "Portal sample"')
  process.exit(1)
}

let failures = 0

for (const testCase of selectedCases) {
  const fixturePath = path.join(root, testCase.fixture)
  const expectedPath = path.join(root, testCase.expected)
  const expectedText = await readFile(expectedPath, 'utf8')
  const result = await adapter.extractText({ fixturePath, caseData: testCase })
  const actualText = typeof result?.text === 'string' ? result.text : ''
  const { wordAccuracy, paragraphMatchRate } = computeMetrics(expectedText, actualText)

  const minWordAccuracy = testCase.minWordAccuracy ?? 0.95
  const minParagraphMatchRate = testCase.minParagraphMatchRate ?? 1
  const pass = wordAccuracy >= minWordAccuracy && paragraphMatchRate >= minParagraphMatchRate

  if (!pass) failures += 1

  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${testCase.id} ${testCase.name}`)
  console.log(`  wordAccuracy=${wordAccuracy.toFixed(3)} (min ${minWordAccuracy})`)
  console.log(`  paragraphMatchRate=${paragraphMatchRate.toFixed(3)} (min ${minParagraphMatchRate})`)
}

if (failures > 0) {
  console.error(`OCR harness completed with ${failures} failing case(s).`)
  process.exit(1)
}

console.log('OCR harness completed successfully.')
