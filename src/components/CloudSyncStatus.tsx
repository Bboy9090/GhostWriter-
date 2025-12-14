import { useState, useEffect } from 'react'
import { Cloud, CloudCheck, CloudWarning, ArrowsClockwise } from '@phosphor-icons/react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { offlineSyncManager } from '@/lib/offline-sync'
import { toast } from 'sonner'

type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline'

interface CloudSyncStatusProps {
  lastSyncTime?: number
}

export function CloudSyncStatus({ lastSyncTime }: CloudSyncStatusProps) {
  const [status, setStatus] = useState<SyncStatus>('synced')
  const [timeAgo, setTimeAgo] = useState<string>('')
  const [queueSize, setQueueSize] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const unsubscribe = offlineSyncManager.onStatusChange((online) => {
      if (!online) {
        setStatus('offline')
        updateQueueSize()
      } else if (queueSize > 0) {
        setStatus('syncing')
      } else {
        setStatus('synced')
      }
    })

    const unsubscribeSync = offlineSyncManager.onSyncComplete((success) => {
      setIsSyncing(false)
      if (success) {
        setStatus('synced')
        setQueueSize(0)
      } else {
        setStatus('error')
      }
    })

    if (!offlineSyncManager.getOnlineStatus()) {
      setStatus('offline')
    }
    updateQueueSize()

    return () => {
      unsubscribe()
      unsubscribeSync()
    }
  }, [])

  useEffect(() => {
    if (!lastSyncTime) return

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastSyncTime) / 1000)
      
      if (seconds < 60) {
        setTimeAgo('just now')
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        setTimeAgo(`${minutes}m ago`)
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600)
        setTimeAgo(`${hours}h ago`)
      } else {
        const days = Math.floor(seconds / 86400)
        setTimeAgo(`${days}d ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 10000)

    return () => clearInterval(interval)
  }, [lastSyncTime])

  const updateQueueSize = async () => {
    const size = await offlineSyncManager.getQueueSize()
    setQueueSize(size)
  }

  const handleManualSync = async () => {
    if (!offlineSyncManager.getOnlineStatus()) {
      toast.error("Can't sync while offline")
      return
    }

    if (queueSize === 0) {
      toast.info('No changes to sync')
      return
    }

    if (isSyncing) {
      return
    }

    setIsSyncing(true)
    setStatus('syncing')
    toast.info(`Syncing ${queueSize} ${queueSize === 1 ? 'change' : 'changes'}...`)
    
    try {
      await offlineSyncManager.processSyncQueue()
      toast.success('All changes synced successfully')
    } catch (error) {
      toast.error('Failed to sync changes')
      console.error('Manual sync error:', error)
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'synced':
        return <CloudCheck size={16} weight="duotone" className="text-success" />
      case 'syncing':
        return <Cloud size={16} weight="duotone" className="text-accent animate-pulse" />
      case 'error':
        return <CloudWarning size={16} weight="duotone" className="text-destructive" />
      case 'offline':
        return <CloudWarning size={16} weight="duotone" className="text-muted-foreground" />
    }
  }

  const getLabel = () => {
    switch (status) {
      case 'synced':
        return timeAgo ? `Synced ${timeAgo}` : 'Synced to cloud'
      case 'syncing':
        return 'Syncing...'
      case 'error':
        return 'Sync error'
      case 'offline':
        return queueSize > 0 ? `Offline (${queueSize} queued)` : 'Offline'
    }
  }

  const getTooltip = () => {
    switch (status) {
      case 'synced':
        return 'All data is automatically backed up to secure cloud storage'
      case 'syncing':
        return 'Syncing your data to the cloud...'
      case 'error':
        return 'Failed to sync to cloud. Your data is still saved locally.'
      case 'offline':
        return queueSize > 0 
          ? `You're offline. ${queueSize} ${queueSize === 1 ? 'change' : 'changes'} will sync when reconnected.`
          : "You're offline. Changes will sync when reconnected."
    }
  }

  const getVariantClasses = () => {
    switch (status) {
      case 'synced':
        return 'bg-success/10 text-success border-success/20 hover:bg-success/20'
      case 'syncing':
        return 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
      case 'offline':
        return 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
    }
  }

  return (
    <div className="flex items-center gap-2">
      {queueSize > 0 && offlineSyncManager.getOnlineStatus() && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="gap-2 h-9"
              >
                <ArrowsClockwise 
                  size={16} 
                  weight="bold" 
                  className={isSyncing ? 'animate-spin' : ''} 
                />
                <span className="text-xs font-medium">
                  Sync Now {queueSize > 0 && `(${queueSize})`}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                Force immediate sync of {queueSize} queued {queueSize === 1 ? 'change' : 'changes'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`gap-2 px-3 py-1.5 cursor-help ${getVariantClasses()}`}
            >
              {getIcon()}
              <span className="text-xs font-medium">{getLabel()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{getTooltip()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
