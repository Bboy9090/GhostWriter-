import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { AI_ACTIONS, applyAIAction, getAIConfig, saveAIConfig } from '../lib/ai-config'

export function AIWritingPanel({
  draft,
  onApply,
}: {
  draft: string
  onApply: (text: string) => void
}) {
  const [config, setConfig] = useState(() => getAIConfig())
  const [result, setResult] = useState('')
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const saveSettings = () => {
    const next = {
      ...config,
      enabled: true,
      provider: 'openai' as const,
      endpoint: '',
      offlineFallback: false,
    }
    saveAIConfig(next)
    setConfig(next)
    toast.success('AI settings saved on this device')
  }

  const runAction = async (actionId: string) => {
    if (!draft.trim()) {
      toast.error('Write or paste text before using AI assistance')
      return
    }
    saveSettings()
    setBusy(true)
    setActiveAction(actionId)
    setResult('')
    const response = await applyAIAction(actionId, draft)
    setBusy(false)
    if (!response.success || !response.result) {
      toast.error(response.error || 'AI request failed')
      return
    }
    setResult(response.result)
    toast.success(`AI result received${response.model ? ` from ${response.model}` : ''}`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <CardTitle className="text-base">AI Co-Author · Real BYOK</CardTitle>
        </div>
        <CardDescription>
          Your OpenAI key is stored in this browser and sent only when you explicitly run an AI action.
          GhostWriter's backend does not store the key or substitute demo text.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="OpenAI API key"
            type="password"
            autoComplete="off"
            placeholder="OpenAI API key"
            value={config.apiKey}
            onChange={event => setConfig({ ...config, apiKey: event.target.value })}
          />
          <Input
            aria-label="OpenAI model"
            placeholder="Model available to your OpenAI account"
            value={config.model}
            onChange={event => setConfig({ ...config, model: event.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_ACTIONS.map(action => (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant={activeAction === action.id ? 'default' : 'outline'}
              disabled={busy}
              onClick={() => void runAction(action.id)}
              title={action.description}
            >
              {busy && activeAction === action.id ? 'Working…' : `${action.icon} ${action.name}`}
            </Button>
          ))}
        </div>
        {result && (
          <div className="space-y-3 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm">AI result preview</strong>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onApply(result)
                  setResult('')
                  toast.success('AI result applied to the draft')
                }}
              >
                Apply to draft
              </Button>
            </div>
            <Textarea
              aria-label="AI result preview"
              value={result}
              onChange={event => setResult(event.target.value)}
              className="min-h-48 font-serif"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
