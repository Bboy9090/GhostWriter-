/**
 * Optional cloud vault (Go API) — semantic search via POST /vault/search.
 * Configure with VITE_GHOSTWRITER_API_URL and VITE_GHOSTWRITER_USER_ID (UUID).
 */

export type CloudVaultSearchHit = {
  id: number
  text_content: string
  similarity: number
  created_at?: string
}

function apiBaseUrl(): string | undefined {
  const explicit = import.meta.env.VITE_GHOSTWRITER_API_URL as string | undefined
  const fallback = import.meta.env.VITE_API_URL as string | undefined
  const raw = (explicit?.trim() || fallback?.trim()) ?? ''
  return raw ? raw.replace(/\/$/, '') : undefined
}

export function isCloudVaultConfigured(): boolean {
  return Boolean(
    apiBaseUrl() && (import.meta.env.VITE_GHOSTWRITER_USER_ID as string | undefined)?.trim()
  )
}

export async function searchCloudVault(
  query: string,
  options?: { limit?: number }
): Promise<CloudVaultSearchHit[]> {
  const base = apiBaseUrl()
  const userId = import.meta.env.VITE_GHOSTWRITER_USER_ID as string | undefined
  if (!base || !userId?.trim()) {
    throw new Error(
      'Cloud vault is not configured (set VITE_GHOSTWRITER_API_URL and VITE_GHOSTWRITER_USER_ID).'
    )
  }

  const res = await fetch(`${base}/vault/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId.trim(),
      query: query.trim(),
      limit: options?.limit ?? 12,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(errText || `Search failed (${res.status})`)
  }

  const data = (await res.json()) as {
    results?: Array<{
      id: number
      text_content: string
      similarity: number
      created_at?: string
    }>
  }

  return (data.results ?? []).map(r => ({
    id: r.id,
    text_content: r.text_content,
    similarity: r.similarity,
    created_at: r.created_at,
  }))
}
