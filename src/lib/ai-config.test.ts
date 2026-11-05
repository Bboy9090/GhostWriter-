import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyAIAction, clearAIConfig, getAIConfig, getProviderHints, saveAIConfig, validateAIConfig } from './ai-config'

describe('real AI writing client', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
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

  it('never persists a BYOK key in durable browser storage', () => {
    expect(localStorage.getItem('ghostwriter:ai-config')).not.toContain('test-key')
    expect(sessionStorage.getItem('ghostwriter:ai-session-key')).toBe('test-key')
    expect(getAIConfig().apiKey).toBe('test-key')
    sessionStorage.clear()
    expect(getAIConfig().apiKey).toBe('')
    expect(getAIConfig().provider).toBe('openai')
  })

  it('scrubs legacy persisted BYOK secrets without silently reusing them', () => {
    localStorage.setItem('ghostwriter:ai-config', JSON.stringify({
      enabled: true, provider: 'openai', apiKey: 'legacy-private-key', model: 'test-model'
    }))
    sessionStorage.clear()
    expect(getAIConfig().apiKey).toBe('')
    expect(getAIConfig().model).toBe('test-model')
    expect(localStorage.getItem('ghostwriter:ai-config')).not.toContain('legacy-private-key')
    expect(localStorage.getItem('ghostwriter:ai-config')).not.toContain('apiKey')
  })

  it('clears the session credential and durable preferences on reset', () => {
    clearAIConfig()
    expect(sessionStorage.getItem('ghostwriter:ai-session-key')).toBeNull()
    expect(localStorage.getItem('ghostwriter:ai-config')).toBeNull()
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

  it('rejects provider settings that the real writing endpoint cannot execute', () => {
    const template = {
      enabled: true, provider: 'openai' as const, apiKey: 'test-key',
      endpoint: '', model: 'gpt-6-luna', offlineFallback: false,
    }
    expect(validateAIConfig(template).valid).toBe(true)
    expect(validateAIConfig({ ...template, provider: 'anthropic' }).errors)
      .toContain('This build supports OpenAI BYOK only; other providers are not connected to the writing endpoint')
    expect(validateAIConfig({ ...template, provider: 'custom', endpoint: 'https://example.test' }).valid).toBe(false)
  })

  it('does not advertise unsupported AI integrations or legacy GPT-4 suggestions', () => {
    expect(getProviderHints('openai').models).toContain('gpt-6-luna')
    expect(getProviderHints('openai').models).not.toContain('gpt-3.5-turbo')
    expect(getProviderHints('anthropic').models).toEqual([])
    expect(getProviderHints('custom').models).toEqual([])
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
