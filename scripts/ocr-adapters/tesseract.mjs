import { createWorker } from 'tesseract.js'

export async function extractText({ fixturePath, caseData }) {
  if (!fixturePath) {
    throw new Error('fixturePath is required for tesseract adapter.')
  }

  const language = caseData?.language ?? 'eng'
  const worker = await createWorker()

  try {
    await worker.loadLanguage(language)
    await worker.initialize(language)
    const { data } = await worker.recognize(fixturePath)
    return { text: data.text ?? '' }
  } finally {
    await worker.terminate()
  }
}
