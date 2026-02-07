/**
 * CaptureFilters — Settings panel for configuring what text gets
 * captured, cleaned, or dropped by the portal's filter pipeline.
 *
 * Sections:
 *  - Role Detection (ChatGPT/Gemini speaker labels)
 *  - Noise Blocklist (UI chrome, buttons, popups)
 *  - Source Blocklist (sites/apps to ignore)
 *  - Sensitive Content (passwords, keys, tokens)
 *  - Quality Gate (min length, dedup)
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { toast } from 'sonner'
import {
  Funnel,
  ChatCircleDots,
  Prohibit,
  ShieldCheck,
  TextAa,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import {
  loadFilterSettings,
  saveFilterSettings,
  getDefaultSettings,
  type FilterSettings,
} from '@/lib/capture-filters'
import { getDroppedCount, resetDroppedCount } from '@/lib/capture-store'

export function CaptureFilters() {
  const [settings, setSettings] = useState<FilterSettings>(() => loadFilterSettings())
  const [droppedCount, setDroppedCount] = useState(0)
  const [expandedSection, setExpandedSection] = useState<string | null>('roles')

  // Persist settings whenever they change
  useEffect(() => {
    saveFilterSettings(settings)
  }, [settings])

  // Poll dropped count
  useEffect(() => {
    const interval = setInterval(() => {
      setDroppedCount(getDroppedCount())
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const update = (patch: Partial<FilterSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  const resetToDefaults = () => {
    const defaults = getDefaultSettings()
    setSettings(defaults)
    saveFilterSettings(defaults)
    resetDroppedCount()
    toast.success('Filters reset to defaults')
  }

  const toggleSection = (id: string) => {
    setExpandedSection(prev => (prev === id ? null : id))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="card-neon border-purple-500/15 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Funnel size={20} weight="fill" className="text-purple-400" />
              <div>
                <h3 className="font-semibold text-base">Capture Filters</h3>
                <p className="text-xs text-muted-foreground">
                  Control what text gets captured, cleaned, or dropped
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {droppedCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {droppedCount} filtered out
                </Badge>
              )}
              <Button size="sm" variant="ghost" onClick={resetToDefaults} className="text-xs h-7">
                <ArrowCounterClockwise size={14} className="mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Role Detection ── */}
      <FilterSection
        id="roles"
        icon={<ChatCircleDots size={18} weight="fill" className="text-cyan-400" />}
        title="AI Chat Role Detection"
        description='Strip "ChatGPT:", "You:", "Gemini:" prefixes and label who said what'
        enabled={settings.roleDetection}
        onToggle={v => update({ roleDetection: v })}
        expanded={expandedSection === 'roles'}
        onExpand={() => toggleSection('roles')}
        borderColor="border-cyan-500/15"
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Your speaker patterns (comma-separated)
            </label>
            <Input
              value={settings.userPatterns}
              onChange={e => update({ userPatterns: e.target.value })}
              placeholder="You:, User:, Me:, Human:"
              className="text-xs bg-muted/30 border-border/50"
            />
            <p className="text-[10px] text-muted-foreground">
              Text starting with these gets tagged as{' '}
              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                you
              </Badge>
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              AI speaker patterns (comma-separated)
            </label>
            <Input
              value={settings.assistantPatterns}
              onChange={e => update({ assistantPatterns: e.target.value })}
              placeholder="ChatGPT:, Assistant:, Gemini:, Claude:"
              className="text-xs bg-muted/30 border-border/50"
            />
            <p className="text-[10px] text-muted-foreground">
              Text starting with these gets tagged as{' '}
              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                ai
              </Badge>
            </p>
          </div>
        </div>
      </FilterSection>

      {/* ── Noise Blocklist ── */}
      <FilterSection
        id="noise"
        icon={<Prohibit size={18} weight="fill" className="text-amber-400" />}
        title="Noise Blocklist"
        description="Drop UI chrome, buttons, popups — anything you don't want recorded"
        enabled={settings.noiseFilter}
        onToggle={v => update({ noiseFilter: v })}
        expanded={expandedSection === 'noise'}
        onExpand={() => toggleSection('noise')}
        borderColor="border-amber-500/15"
      >
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Blocked phrases (one per line) — captures matching these are dropped
          </label>
          <textarea
            value={settings.noiseList}
            onChange={e => update({ noiseList: e.target.value })}
            rows={8}
            className="w-full rounded-lg border border-border/50 bg-muted/30 p-3 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Regenerate response&#10;Copy&#10;Share&#10;..."
          />
          <p className="text-[10px] text-muted-foreground">
            Short captures (&lt;80 chars) containing any of these phrases are dropped. Exact matches
            are always dropped regardless of length.
          </p>
        </div>
      </FilterSection>

      {/* ── Source Blocklist ── */}
      <FilterSection
        id="sources"
        icon={<Prohibit size={18} weight="fill" className="text-red-400" />}
        title="Source / Site Blocklist"
        description="Block captures from specific apps, websites, or popups"
        enabled={settings.sourceBlocklist}
        onToggle={v => update({ sourceBlocklist: v })}
        expanded={expandedSection === 'sources'}
        onExpand={() => toggleSection('sources')}
        borderColor="border-red-500/15"
      >
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Blocked sources (one per line) — captures from these are dropped
          </label>
          <textarea
            value={settings.blockedSources}
            onChange={e => update({ blockedSources: e.target.value })}
            rows={5}
            className="w-full rounded-lg border border-border/50 bg-muted/30 p-3 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ads&#10;Pop-up&#10;Advertisement&#10;..."
          />
          <p className="text-[10px] text-muted-foreground">
            If the source app/site name contains any of these (case-insensitive), the capture is
            dropped.
          </p>
        </div>
      </FilterSection>

      {/* ── Sensitive Content ── */}
      <FilterSection
        id="sensitive"
        icon={<ShieldCheck size={18} weight="fill" className="text-emerald-400" />}
        title="Sensitive Content"
        description="Auto-detect passwords, API keys, tokens, credit card numbers"
        enabled={settings.sensitiveFilter}
        onToggle={v => update({ sensitiveFilter: v })}
        expanded={expandedSection === 'sensitive'}
        onExpand={() => toggleSection('sensitive')}
        borderColor="border-emerald-500/15"
      >
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">
            When sensitive content is detected:
          </label>
          <div className="flex flex-wrap gap-2">
            {(['flag', 'redact', 'drop'] as const).map(action => (
              <Button
                key={action}
                size="sm"
                variant={settings.sensitiveAction === action ? 'default' : 'outline'}
                onClick={() => update({ sensitiveAction: action })}
                className={settings.sensitiveAction === action ? 'shadow-lg shadow-primary/20' : ''}
              >
                {action === 'flag' && '🏷️ Flag it'}
                {action === 'redact' && '██ Redact it'}
                {action === 'drop' && '🗑️ Drop it'}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Detects: passwords, API keys, bearer tokens, long hashes, credit card numbers, SSN-like
            patterns.
            {settings.sensitiveAction === 'flag' && ' Flagged entries get a "sensitive" tag.'}
            {settings.sensitiveAction === 'redact' &&
              ' Matched patterns are replaced with [REDACTED].'}
            {settings.sensitiveAction === 'drop' &&
              ' Entries containing sensitive data are dropped entirely.'}
          </p>
        </div>
      </FilterSection>

      {/* ── Quality Gate ── */}
      <FilterSection
        id="quality"
        icon={<TextAa size={18} weight="fill" className="text-purple-400" />}
        title="Quality Gate"
        description="Minimum length and deduplication to keep the vault clean"
        enabled={true}
        onToggle={() => {}}
        expanded={expandedSection === 'quality'}
        onExpand={() => toggleSection('quality')}
        borderColor="border-purple-500/15"
        alwaysOn
      >
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-1.5 rounded-lg border border-border/50 p-3">
              <label className="text-xs font-medium">Min length</label>
              <Input
                type="number"
                min={0}
                max={200}
                value={settings.minLength}
                onChange={e => update({ minLength: Math.max(0, Number(e.target.value) || 0) })}
                className="text-xs bg-muted/30 border-border/50"
              />
              <p className="text-[10px] text-muted-foreground">Characters</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <p className="text-xs font-medium">Dedup</p>
                <p className="text-[10px] text-muted-foreground">Skip repeats</p>
              </div>
              <Switch
                checked={settings.dedupEnabled}
                onCheckedChange={v => update({ dedupEnabled: v })}
              />
            </div>

            <div className="space-y-1.5 rounded-lg border border-border/50 p-3">
              <label className="text-xs font-medium">Similarity</label>
              <Input
                type="number"
                min={0.5}
                max={0.99}
                step={0.05}
                value={settings.dedupThreshold}
                onChange={e =>
                  update({
                    dedupThreshold: Math.max(0.5, Math.min(0.99, Number(e.target.value) || 0.85)),
                  })
                }
                className="text-xs bg-muted/30 border-border/50"
                disabled={!settings.dedupEnabled}
              />
              <p className="text-[10px] text-muted-foreground">Jaccard threshold</p>
            </div>
          </div>
        </div>
      </FilterSection>
    </div>
  )
}

// ── Reusable collapsible section ──────────────────────────────

function FilterSection({
  id,
  icon,
  title,
  description,
  enabled,
  onToggle,
  expanded,
  onExpand,
  borderColor,
  alwaysOn,
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  enabled: boolean
  onToggle: (v: boolean) => void
  expanded: boolean
  onExpand: () => void
  borderColor: string
  alwaysOn?: boolean
  children: React.ReactNode
}) {
  return (
    <Card className={`card-neon ${borderColor} overflow-hidden`}>
      <CardContent className="p-0">
        {/* Section header */}
        <button
          onClick={onExpand}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/10 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{title}</h4>
                {!alwaysOn && (
                  <Badge
                    variant="secondary"
                    className={`text-[9px] ${enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}
                  >
                    {enabled ? 'ON' : 'OFF'}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-3" onClick={e => e.stopPropagation()}>
            {!alwaysOn && <Switch checked={enabled} onCheckedChange={onToggle} />}
            <span className="text-muted-foreground text-xs">{expanded ? '▾' : '▸'}</span>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
            <Separator className="mb-4 opacity-30" />
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
