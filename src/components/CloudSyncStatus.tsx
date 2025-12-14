import { useState, useEffect } from 'react'
import { Cloud, CloudCheck, CloudWarning } from '@phosphor-icons/react'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

type SyncStatus = 'synced' | 'syncing' | 'error'

interface CloudSyncStatusProps {
  lastSyncTime?: number
}

export function CloudSyncStatus({ lastSyncTime }: CloudSyncStatusProps) {
  const [status, setStatus] = useState<SyncStatus>('synced')
  const [timeAgo, setTimeAgo] = useState<string>('')

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

  const getIcon = () => {
    switch (status) {
      case 'synced':
        return <CloudCheck size={16} weight="duotone" className="text-success" />
      case 'syncing':
        return <Cloud size={16} weight="duotone" className="text-accent animate-pulse" />
      case 'error':
        return <CloudWarning size={16} weight="duotone" className="text-destructive" />
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
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="gap-2 px-3 py-1.5 bg-success/10 text-success border-success/20 hover:bg-success/20 cursor-help"
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
  )
}
