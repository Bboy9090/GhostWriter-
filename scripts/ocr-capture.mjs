import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = process.cwd()

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

function normalizeCaseId(id) {
  return id?.trim().toUpperCase()
}

async function loadCases(casesPath) {
  try {
    const raw = await readFile(casesPath, 'utf8')
    return JSON.parse(raw)
  } catch (error) {
    return []
  }
}

async function saveCases(casesPath, cases) {
  await writeFile(casesPath, JSON.stringify(cases, null, 2) + '\n', 'utf8')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const id = normalizeCaseId(args.id)
  const name = args.name?.trim()

  if (!id || !name) {
    console.error('Usage: node scripts/ocr-capture.mjs --id OCR-001 --name "Portal sample"')
    process.exit(1)
  }

  const casesPath = path.join(root, 'tests', 'ocr', 'cases.json')
  const fixturesDir = path.join(root, 'tests', 'ocr', 'live')
  const expectedDir = path.join(root, 'tests', 'ocr', 'expected')

  await mkdir(fixturesDir, { recursive: true })
  await mkdir(expectedDir, { recursive: true })

  const cases = await loadCases(casesPath)
  if (cases.some((entry) => entry.id === id)) {
    console.error(`Case ${id} already exists.`)
    process.exit(1)
  }

  const fixturePath = path.join(fixturesDir, `${id}.png`)
  const expectedPath = path.join(expectedDir, `${id}.txt`)

  try {
    const { stdout } = await execFileAsync('adb', ['exec-out', 'screencap', '-p'], {
      encoding: 'buffer',
      maxBuffer: 20 * 1024 * 1024
    })
    await writeFile(fixturePath, stdout)
  } catch (error) {
    console.error('Failed to capture screen via adb. Is a device connected?')
    console.error(error.message)
    process.exit(1)
  }

  await writeFile(
    expectedPath,
    'TODO: Paste the ground truth text captured in this frame.\n',
    'utf8'
  )

  const newCase = {
    id,
    name,
    fixture: path.relative(root, fixturePath),
    expected: path.relative(root, expectedPath),
    minWordAccuracy: 0.95,
    minParagraphMatchRate: 1
  }

  cases.push(newCase)
  await saveCases(casesPath, cases)

  console.log(`Captured ${id}. Update ${newCase.expected} with ground truth text.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
