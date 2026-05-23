import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, Database, Download, Settings, BarChart3, FileText, Copy, Check } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { dataExtractor, ExtractedData } from '@/lib/data-extractor'
import { cn } from '@/lib/utils'

export function GodModeExtractor() {
  const [godMode, setGodMode] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputText, setInputText] = useState('')
  const [activeWordZone, setActiveWordZone] = useState<string | null>(null)
  const [wordZoneContent, setWordZoneContent] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState({
    totalExtracted: 0,
    tablesFound: 0,
    listsFound: 0,
    formsFound: 0,
    avgConfidence: 0
  })

  useEffect(() => {
    dataExtractor.setGodMode(godMode)
  }, [godMode])

  const handleExtract = async (text: string) => {
    if (!text.trim()) {
      toast.error('No text to extract')
      return
    }

    setIsProcessing(true)
    try {
      const result = await dataExtractor.extract(text, {
        sourceApp: 'GhostWriter',
        timestamp: new Date().toISOString()
      })

      setExtractedData(prev => [result, ...prev])
      updateStats([result, ...extractedData])
      toast.success(`✨ Extracted ${result.type} data with ${(result.confidence * 100).toFixed(0)}% confidence`)
    } catch (error) {
      toast.error('Extraction failed')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const updateStats = (data: ExtractedData[]) => {
    const tables = data.reduce((acc, d) => acc + (d.structured?.tables?.length || 0), 0)
    const lists = data.reduce((acc, d) => acc + (d.structured?.lists?.length || 0), 0)
    const forms = data.reduce((acc, d) => acc + (d.structured?.forms?.length || 0), 0)
    const avgConf = data.reduce((acc, d) => acc + d.confidence, 0) / data.length || 0

    setStats({
      totalExtracted: data.length,
      tablesFound: tables,
      listsFound: lists,
      formsFound: forms,
      avgConfidence: avgConf
    })
  }

  const exportData = (data: ExtractedData, format: 'csv' | 'json' | 'markdown' | 'xml') => {
    const exported = dataExtractor.exportToFormat(data, format)
    const blob = new Blob([exported], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extracted_${data.id}.${format}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported as ${format.toUpperCase()}`)
  }

  const openWordZone = (data: ExtractedData, type: 'all' | 'tables' | 'lists' | 'forms' = 'all') => {
    let content = ''

    if (type === 'all' || type === 'tables') {
      if (data.structured?.tables && data.structured.tables.length > 0) {
        data.structured.tables.forEach((table, idx) => {
          content += `\n## Table ${idx + 1}\n\n`
          content += `| ${table.headers.join(' | ')} |\n`
          content += `| ${table.headers.map(() => '---').join(' | ')} |\n`
          table.rows.forEach(row => {
            content += `| ${row.join(' | ')} |\n`
          })
          content += '\n'
        })
      }
    }

    if (type === 'all' || type === 'lists') {
      if (data.structured?.lists && data.structured.lists.length > 0) {
        data.structured.lists.forEach((list, idx) => {
          content += `\n## List ${idx + 1} (${list.type})\n\n`
          list.items.forEach((item, i) => {
            const prefix = list.type === 'ordered' ? `${i + 1}. ` : '- '
            content += `${prefix}${item}\n`
          })
          content += '\n'
        })
      }
    }

    if (type === 'all' || type === 'forms') {
      if (data.structured?.forms && data.structured.forms.length > 0) {
        data.structured.forms.forEach((form, idx) => {
          content += `\n## Form ${idx + 1}\n\n`
          form.fields.forEach(field => {
            content += `**${field.label}**: ${field.value}\n`
          })
          content += '\n'
        })
      }
    }

    // If no structured data, show raw text
    if (!content.trim()) {
      content = data.rawText
    }

    setWordZoneContent(content)
    setActiveWordZone(`${data.id}-${type}`)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wordZoneContent)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const closeWordZone = () => {
    setActiveWordZone(null)
    setWordZoneContent('')
  }

  return (
    <div className="space-y-4">
      {/* God Mode Toggle */}
      <Card className="border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                godMode ? "bg-emerald-500/20" : "bg-muted"
              )}>
                <Sparkles className={cn(
                  "h-5 w-5",
                  godMode ? "text-emerald-400" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  🚀 God Mode Extractor
                  {godMode && (
                    <Badge className="bg-emerald-500 text-white animate-pulse">
                      ACTIVE
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Advanced automatic data extraction with structured detection
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={godMode}
              onCheckedChange={(checked) => {
                setGodMode(checked)
                toast.success(checked ? '🚀 God Mode Activated!' : 'God Mode Deactivated')
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Auto Detect</p>
                <p className="text-sm font-medium">{godMode ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Structured</p>
                <p className="text-sm font-medium">{godMode ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Batch Size</p>
                <p className="text-sm font-medium">{godMode ? '50' : '10'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Mode</p>
                <p className="text-sm font-medium">{godMode ? 'God' : 'Normal'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardHeader>
          <CardTitle>Extract Data</CardTitle>
          <CardDescription>
            Paste or type text to extract structured data automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste text here... (tables, lists, forms, JSON, code, etc.)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleExtract(inputText)}
              disabled={isProcessing || !inputText.trim()}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Extract Data
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setInputText('')}
              disabled={!inputText}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats.totalExtracted}</p>
              <p className="text-xs text-muted-foreground">Total Extracted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.tablesFound}</p>
              <p className="text-xs text-muted-foreground">Tables</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.listsFound}</p>
              <p className="text-xs text-muted-foreground">Lists</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{stats.formsFound}</p>
              <p className="text-xs text-muted-foreground">Forms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">Avg Confidence</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extracted Data */}
      {extractedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
            <CardDescription>
              {extractedData.length} item{extractedData.length !== 1 ? 's' : ''} extracted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all" onClick={() => {
                  const firstData = extractedData[0]
                  if (firstData) openWordZone(firstData, 'all')
                }}>
                  All
                </TabsTrigger>
                <TabsTrigger value="tables" onClick={() => {
                  const tableData = extractedData.find(d => d.type === 'table' || d.structured?.tables)
                  if (tableData) openWordZone(tableData, 'tables')
                }}>
                  Tables
                </TabsTrigger>
                <TabsTrigger value="lists" onClick={() => {
                  const listData = extractedData.find(d => d.type === 'list' || d.structured?.lists)
                  if (listData) openWordZone(listData, 'lists')
                }}>
                  Lists
                </TabsTrigger>
                <TabsTrigger value="forms" onClick={() => {
                  const formData = extractedData.find(d => d.type === 'form' || d.structured?.forms)
                  if (formData) openWordZone(formData, 'forms')
                }}>
                  Forms
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {extractedData.map((data) => (
                  <ExtractedItem
                    key={data.id}
                    data={data}
                    onExport={exportData}
                    onOpenWordZone={() => openWordZone(data, 'all')}
                  />
                ))}
              </TabsContent>

              <TabsContent value="tables" className="space-y-4">
                {extractedData
                  .filter(d => d.type === 'table' || d.structured?.tables)
                  .map((data) => (
                    <ExtractedItem
                      key={data.id}
                      data={data}
                      onExport={exportData}
                      onOpenWordZone={() => openWordZone(data, 'tables')}
                    />
                  ))}
              </TabsContent>

              <TabsContent value="lists" className="space-y-4">
                {extractedData
                  .filter(d => d.type === 'list' || d.structured?.lists)
                  .map((data) => (
                    <ExtractedItem
                      key={data.id}
                      data={data}
                      onExport={exportData}
                      onOpenWordZone={() => openWordZone(data, 'lists')}
                    />
                  ))}
              </TabsContent>

              <TabsContent value="forms" className="space-y-4">
                {extractedData
                  .filter(d => d.type === 'form' || d.structured?.forms)
                  .map((data) => (
                    <ExtractedItem
                      key={data.id}
                      data={data}
                      onExport={exportData}
                      onOpenWordZone={() => openWordZone(data, 'forms')}
                    />
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Word Zone - Appears when tab is clicked */}
      <AnimatePresence>
        {activeWordZone && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-4 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeWordZone} />
            <Card className="relative w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-emerald-500/50">
              <CardHeader className="flex-shrink-0 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <FileText className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle>✨ Word Zone</CardTitle>
                      <CardDescription>
                        View and edit extracted content
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={closeWordZone}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-6">
                <Textarea
                  value={wordZoneContent}
                  onChange={(e) => setWordZoneContent(e.target.value)}
                  className="w-full h-full min-h-[400px] font-mono text-sm resize-none"
                  placeholder="Extracted content will appear here..."
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ExtractedItem({
  data,
  onExport,
  onOpenWordZone
}: {
  data: ExtractedData
  onExport: (data: ExtractedData, format: 'csv' | 'json' | 'markdown' | 'xml') => void
  onOpenWordZone?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{data.type}</Badge>
          <Badge className="bg-emerald-500/20 text-emerald-400">
            {(data.confidence * 100).toFixed(0)}% confidence
          </Badge>
          {data.metadata.categories.map(cat => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          {onOpenWordZone && (
            <Button
              size="sm"
              variant="default"
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={onOpenWordZone}
            >
              <FileText className="h-3 w-3 mr-1" />
              Word Zone
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(data, 'csv')}
          >
            <Download className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(data, 'json')}
          >
            <Download className="h-3 w-3 mr-1" />
            JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(data, 'markdown')}
          >
            <Download className="h-3 w-3 mr-1" />
            MD
          </Button>
        </div>
      </div>

      {/* Tables */}
      {data.structured?.tables && data.structured.tables.length > 0 && (
        <div className="space-y-2">
          {data.structured.tables.map((table, idx) => (
            <div key={idx} className="overflow-x-auto">
              <table className="min-w-full border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    {table.headers.map((header, i) => (
                      <th key={i} className="border p-2 text-left text-sm font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="border p-2 text-sm">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Lists */}
      {data.structured?.lists && data.structured.lists.length > 0 && (
        <div className="space-y-2">
          {data.structured.lists.map((list, idx) => (
            <div key={idx}>
              <p className="text-xs text-muted-foreground mb-1">
                {list.type} list ({list.items.length} items)
              </p>
              <ul className="list-disc list-inside space-y-1">
                {list.items.map((item, i) => (
                  <li key={i} className="text-sm">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Forms */}
      {data.structured?.forms && data.structured.forms.length > 0 && (
        <div className="space-y-2">
          {data.structured.forms.map((form, idx) => (
            <div key={idx} className="space-y-1">
              {form.fields.map((field, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">
                    {field.label}:
                  </span>
                  <span>{field.value}</span>
                  {field.type && (
                    <Badge variant="outline" className="text-xs">
                      {field.type}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Entities */}
      {data.metadata.entities && data.metadata.entities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.metadata.entities.map((entity, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {entity.type}: {entity.value}
            </Badge>
          ))}
        </div>
      )}

      {/* Raw text preview */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          View raw text ({data.rawText.length} chars)
        </summary>
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
          {data.rawText}
        </pre>
      </details>
    </motion.div>
  )
}
