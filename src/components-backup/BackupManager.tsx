import { useState } from 'react'
import { Card as CardType, UsageEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DownloadSimple, UploadSimple, Info, CheckCircle, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface BackupData {
  version: string
  exportDate: number
  cards: CardType[]
  usage: UsageEntry[]
}

interface BackupManagerProps {
  cards: CardType[]
  usage: UsageEntry[]
  onImport: (cards: CardType[], usage: UsageEntry[], merge: boolean) => void
}

export function BackupManager({ cards, usage, onImport }: BackupManagerProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importError, setImportError] = useState<string>('')
  const [importPreview, setImportPreview] = useState<BackupData | null>(null)

  const handleExport = () => {
    const backupData: BackupData = {
      version: '1.0.0',
      exportDate: Date.now(),
      cards,
      usage,
    }

    const dataStr = JSON.stringify(backupData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `card-command-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setIsExportDialogOpen(false)
    toast.success('Backup exported successfully')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as BackupData

        if (!data.version || !data.exportDate || !Array.isArray(data.cards) || !Array.isArray(data.usage)) {
          setImportError('Invalid backup file format. Missing required fields.')
          setImportPreview(null)
          return
        }

        setImportError('')
        setImportPreview(data)
      } catch (error) {
        setImportError('Failed to parse backup file. Please ensure it is a valid JSON file.')
        setImportPreview(null)
      }
    }

    reader.onerror = () => {
      setImportError('Failed to read file. Please try again.')
      setImportPreview(null)
    }

    reader.readAsText(file)
  }

  const handleImportConfirm = () => {
    if (!importPreview) return

    const mergeConfirmed = confirm(
      `This will merge ${importPreview.cards.length} cards and ${importPreview.usage.length} transactions with your existing data. Continue?`
    )

    if (mergeConfirmed) {
      onImport(importPreview.cards, importPreview.usage, true)
      setIsImportDialogOpen(false)
      setImportPreview(null)
      setImportError('')
      toast.success('Backup merged successfully')
    }
  }

  const handleImportReplace = () => {
    if (!importPreview) return

    const replaceConfirmed = confirm(
      `This will REPLACE all your existing data with ${importPreview.cards.length} cards and ${importPreview.usage.length} transactions from the backup. This cannot be undone. Continue?`
    )

    if (replaceConfirmed) {
      onImport(importPreview.cards, importPreview.usage, false)
      setIsImportDialogOpen(false)
      setImportPreview(null)
      setImportError('')
      toast.success('Data replaced with backup successfully')
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setIsExportDialogOpen(true)}
        >
          <DownloadSimple size={18} weight="bold" className="mr-2" />
          Export Backup
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsImportDialogOpen(true)}
        >
          <UploadSimple size={18} weight="bold" className="mr-2" />
          Import Backup
        </Button>
      </div>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Data Backup</DialogTitle>
            <DialogDescription>
              Download a backup file containing all your cards and transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-accent/5 border-accent/20">
              <Info size={18} className="text-accent" />
              <AlertDescription className="text-sm">
                The backup file will include:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{cards.length} card{cards.length !== 1 ? 's' : ''}</li>
                  <li>{usage.length} transaction{usage.length !== 1 ? 's' : ''}</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-muted border-border">
              <Warning size={18} className="text-muted-foreground" />
              <AlertDescription className="text-sm">
                <strong>Security Note:</strong> The backup file will be saved as plain JSON. 
                Store it securely and do not share it publicly, as it contains your card metadata.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <DownloadSimple size={18} weight="bold" className="mr-2" />
              Download Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Data Backup</DialogTitle>
            <DialogDescription>
              Restore cards and transactions from a backup file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!importPreview && (
              <>
                <Alert className="bg-accent/5 border-accent/20">
                  <Info size={18} className="text-accent" />
                  <AlertDescription className="text-sm">
                    Select a backup file (.json) exported from Card Command Center. 
                    You'll be able to preview the data before importing.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-center w-full">
                  <label htmlFor="backup-file-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadSimple size={32} className="mb-2 text-muted-foreground" weight="duotone" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Click to select</span> a backup file
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">JSON files only</p>
                    </div>
                    <input
                      id="backup-file-input"
                      type="file"
                      className="hidden"
                      accept=".json,application/json"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>

                {importError && (
                  <Alert className="bg-destructive/5 border-destructive/20">
                    <Warning size={18} className="text-destructive" />
                    <AlertDescription className="text-sm text-destructive">
                      {importError}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {importPreview && (
              <>
                <Alert className="bg-success/5 border-success/20">
                  <CheckCircle size={18} className="text-success" />
                  <AlertDescription className="text-sm">
                    <strong>Backup file validated successfully</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Version: {importPreview.version}</li>
                      <li>Export Date: {new Date(importPreview.exportDate).toLocaleDateString()}</li>
                      <li>{importPreview.cards.length} card{importPreview.cards.length !== 1 ? 's' : ''}</li>
                      <li>{importPreview.usage.length} transaction{importPreview.usage.length !== 1 ? 's' : ''}</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-semibold mb-3">Cards in Backup:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {importPreview.cards.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No cards in this backup</p>
                    ) : (
                      importPreview.cards.map((card) => (
                        <div key={card.id} className="text-sm bg-background p-2 rounded border">
                          <div className="font-medium">{card.label}</div>
                          <div className="text-muted-foreground text-xs">
                            {card.bank} • {card.network} •••• {card.last4}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Alert className="bg-muted border-border">
                  <Warning size={18} className="text-muted-foreground" />
                  <AlertDescription className="text-sm">
                    <strong>Choose import method:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>Merge:</strong> Add backup data to your existing cards and transactions</li>
                      <li><strong>Replace:</strong> Delete all existing data and restore only from backup</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportDialogOpen(false)
                setImportPreview(null)
                setImportError('')
              }}
            >
              Cancel
            </Button>
            {importPreview && (
              <>
                <Button variant="secondary" onClick={handleImportConfirm}>
                  Merge with Existing
                </Button>
                <Button variant="destructive" onClick={handleImportReplace}>
                  Replace All Data
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
