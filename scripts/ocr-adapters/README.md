# OCR Adapter Interface

Adapters translate fixtures into extracted text output.

Required export:
  export async function extractText({ fixturePath, caseData })

Arguments:
- fixturePath: Absolute path to the fixture image.
- caseData: Case metadata from tests/ocr/cases.json.

Expected return value:
  { text: string }

Available adapters:
- tesseract: Runs on-device OCR using tesseract.js (real OCR).

Example usage:
  node scripts/ocr-harness.mjs --adapter tesseract

Provide a custom adapter by creating scripts/ocr-adapters/<name>.mjs
and running:
  node scripts/ocr-harness.mjs --adapter <name>
