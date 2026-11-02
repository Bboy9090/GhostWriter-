import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyAIAction, saveAIConfig } from './ai-config'

describe('real AI writing client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubEnv('VITE_API_URL', 'https://ghostwriter-api.example')
    saveAIConfig({
      enabled: true,
      provider: 'openai',
      apiKey: 'test-key',
      endpoint: '',
      model: 'test-model',
      offlineFallback: false,
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('sends explicit text to the backend and returns provider output', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        ok: true,
        text: 'Improved text.',
        provider: 'openai',
        model: 'test-model',
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    )

    const result = await applyAIAction('improve', 'Original text.')

    expect(result).toEqual({ success: true, result: 'Improved text.', model: 'test-model' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://ghostwriter-api.example/ai/write')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({
      'content-type': 'application/json',
      authorization: 'Bearer test-key',
    })
    expect(JSON.parse(String(init?.body))).toEqual({
      action: 'improve',
      text: 'Original text.',
      model: 'test-model',
    })
  })

  it('never fabricates a successful result when the backend rejects the request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        ok: false,
        error: 'provider failed',
      }), { status: 502, headers: { 'content-type': 'application/json' } }),
    )

    const result = await applyAIAction('improve', 'Original text.')

    expect(result.success).toBe(false)
    expect(result.result).toBeUndefined()
    expect(result.error).toBe('provider failed')
  })
})
