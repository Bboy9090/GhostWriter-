import { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  ArrowsClockwise, 
  CheckCircle, 
  Warning,
  ListBullets,
  X
} from '@phosphor-icons/react'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Alert, AlertDescription } from './ui/alert'
import { offlineSyncManager, type SyncProgress, type SyncOperation } from '@/lib/offline-sync'
import { toast } from 'sonner'

export function BatchSyncControl() {
  const [progress, setProgress] = useState<SyncProgress>({
    currentOperation: 0,
    totalOperations: 0,
    currentOperationType: '',
    isPaused: false,
    isProcessing: false
  })
  const [queueSize, setQueueSize] = useState(0)
  const [operations, setOperations] = useState<SyncOperation[]>([])
  const [isOnline, setIsOnline] = useState(offlineSyncManager.getOnlineStatus())
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const unsubscribeProgress = offlineSyncManager.onProgressUpdate((newProgress) => {
      setProgress(newProgress)
    })

    const unsubscribeStatus = offlineSyncManager.onStatusChange((online) => {
      setIsOnline(online)
    })

    const unsubscribeSync = offlineSyncManager.onSyncComplete(() => {
      updateQueueData()
    })

    updateQueueData()

    const interval = setInterval(updateQueueData, 5000)

    return () => {
      unsubscribeProgress()
      unsubscribeStatus()
      unsubscribeSync()
      clearInterval(interval)
    }
  }, [])

  const updateQueueData = async () => {
    const size = await offlineSyncManager.getQueueSize()
    const ops = await offlineSyncManager.getQueueOperations()
    setQueueSize(size)
    setOperations(ops)
  }

  const handlePause = async () => {
    await offlineSyncManager.pauseSync()
    toast.info('Sync paused')
  }

  const handleResume = async () => {
    if (!isOnline) {
      toast.error('Cannot resume sync while offline')
      return
    }
    await offlineSyncManager.resumeSync()
    toast.success('Sync resumed')
  }

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline')
      return
    }

    if (queueSize === 0) {
      toast.info('No changes to sync')
      return
    }

    if (progress.isPaused) {
      toast.info('Sync is paused. Resume to sync.')
      return
    }

    toast.info(`Starting sync of ${queueSize} ${queueSize === 1 ? 'operation' : 'operations'}...`)
    await offlineSyncManager.processSyncQueue()
  }

  const handleClearQueue = async () => {
    if (confirm('Clear all queued sync operations? This will not delete your local data.')) {
      await offlineSyncManager.clearQueue()
      toast.success('Sync queue cleared')
      updateQueueData()
    }
  }

  const getOperationIcon = (type: string) => {
    if (type.includes('CARDS')) {
      return '💳'
    } else if (type.includes('USAGE')) {
      return '🧾'
    }
    return '📦'
  }

  const getOperationLabel = (type: string) => {
    if (type.includes('CARDS')) {
      return 'Cards Data'
    } else if (type.includes('USAGE')) {
      return 'Transactions'
    }
    return 'Data'
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'just now'
  }

  const progressPercentage = progress.totalOperations > 0 
    ? (progress.currentOperation / progress.totalOperations) * 100 
    : 0

  if (queueSize === 0 && !progress.isProcessing) {
    return null
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowsClockwise size={20} weight="duotone" className="text-accent" />
              Batch Sync Control
            </CardTitle>
            <CardDescription className="mt-1">
              {progress.isProcessing 
                ? 'Syncing your data to the cloud...'
                : progress.isPaused
                ? 'Sync is paused'
                : `${queueSize} ${queueSize === 1 ? 'operation' : 'operations'} queued`
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {queueSize > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                <ListBullets size={18} className="mr-2" />
                {showDetails ? 'Hide' : 'Details'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isOnline && (
          <Alert className="bg-muted/50 border-border">
            <Warning size={18} className="text-muted-foreground" />
            <AlertDescription>
              You're offline. Sync will resume automatically when reconnected.
            </AlertDescription>
          </Alert>
        )}

        {progress.isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.currentOperationType}</span>
              <span className="font-mono font-medium">
                {progress.currentOperation} / {progress.totalOperations}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {showDetails && operations.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <h4 className="text-sm font-semibold text-muted-foreground">Queued Operations</h4>
              {operations.map((op, index) => (
                <div 
                  key={op.id} 
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    progress.isProcessing && index === progress.currentOperation - 1
                      ? 'bg-accent/20 border border-accent/30'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getOperationIcon(op.type)}</span>
                    <div>
                      <div className="font-medium">{getOperationLabel(op.type)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(op.timestamp)}
                      </div>
                    </div>
                  </div>
                  {progress.isProcessing && index === progress.currentOperation - 1 && (
                    <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                      <ArrowsClockwise size={12} weight="bold" className="mr-1 animate-spin" />
                      Syncing
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {progress.isPaused ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleResume}
              disabled={!isOnline || progress.isProcessing}
              className="gap-2"
            >
              <Play size={16} weight="fill" />
              Resume Sync
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              disabled={!progress.isProcessing}
              className="gap-2"
            >
              <Pause size={16} weight="fill" />
              Pause
            </Button>
          )}

          {!progress.isProcessing && !progress.isPaused && queueSize > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleManualSync}
              disabled={!isOnline}
              className="gap-2"
            >
              <ArrowsClockwise size={16} weight="bold" />
              Sync Now
            </Button>
          )}

          {queueSize > 0 && !progress.isProcessing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearQueue}
              className="gap-2 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X size={16} weight="bold" />
              Clear Queue
            </Button>
          )}

          {!progress.isProcessing && progress.isPaused && (
            <div className="flex items-center gap-2 ml-auto text-sm">
              <Pause size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Paused</span>
            </div>
          )}
        </div>

        {progress.isProcessing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <CheckCircle size={14} weight="duotone" className="text-success" />
            <span>
              Syncing in batches to ensure data integrity
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
