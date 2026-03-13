import { useState, useEffect, useCallback } from 'react'
import { offlineSyncManager } from '@/lib/offline-sync'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { WifiSlash, WifiHigh, CloudArrowUp, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface OfflineIndicatorProps {
  compact?: boolean
}

export function OfflineIndicator({ compact = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(offlineSyncManager.getOnlineStatus())
  const [queueSize, setQueueSize] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [showSyncSuccess, setShowSyncSuccess] = useState(false)

  const updateQueueSize = useCallback(async () => {
    const size = await offlineSyncManager.getQueueSize()
    setQueueSize(size)
  }, [])

  useEffect(() => {
    const unsubscribe = offlineSyncManager.onStatusChange((online) => {
      setIsOnline(online)
      if (online) {
        updateQueueSize()
      }
    })

    const unsubscribeSync = offlineSyncManager.onSyncComplete((success) => {
      setSyncing(false)
      if (success) {
        setShowSyncSuccess(true)
        setQueueSize(0)
        setTimeout(() => setShowSyncSuccess(false), 3000)
      }
    })

    queueMicrotask(() => { void updateQueueSize() })

    return () => {
      unsubscribe()
      unsubscribeSync()
    }
  }, [updateQueueSize])

  useEffect(() => {
    if (isOnline && queueSize > 0 && !syncing) {
      queueMicrotask(() => setSyncing(true))
      offlineSyncManager.processSyncQueue()
    }
  }, [isOnline, queueSize, syncing])

  if (compact) {
    return (
      <AnimatePresence mode="wait">
        {!isOnline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Badge variant="outline" className="gap-2 px-3 py-1.5 bg-destructive/10 text-destructive border-destructive/20">
              <WifiSlash size={16} weight="bold" />
              <span className="text-xs font-semibold">Offline</span>
              {queueSize > 0 && (
                <span className="text-xs">({queueSize} queued)</span>
              )}
            </Badge>
          </motion.div>
        ) : syncing ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Badge variant="outline" className="gap-2 px-3 py-1.5 bg-accent/10 text-accent border-accent/20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <CloudArrowUp size={16} weight="bold" />
              </motion.div>
              <span className="text-xs font-semibold">Syncing...</span>
            </Badge>
          </motion.div>
        ) : showSyncSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Badge variant="outline" className="gap-2 px-3 py-1.5 bg-success/10 text-success border-success/20">
              <CheckCircle size={16} weight="bold" />
              <span className="text-xs font-semibold">Synced</span>
            </Badge>
          </motion.div>
        ) : (
          <motion.div
            key="online"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Badge variant="outline" className="gap-2 px-3 py-1.5 bg-muted/50 text-muted-foreground border-border">
              <WifiHigh size={16} weight="bold" />
              <span className="text-xs font-semibold">Online</span>
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  if (!isOnline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Alert className="bg-destructive/5 border-destructive/20">
          <WifiSlash size={20} className="text-destructive" weight="bold" />
          <AlertDescription className="text-sm">
            <strong className="font-semibold">You're offline.</strong> Changes will be saved locally and synced to the cloud when you reconnect.
            {queueSize > 0 && (
              <span className="block mt-1 text-xs text-muted-foreground">
                {queueSize} {queueSize === 1 ? 'change' : 'changes'} waiting to sync
              </span>
            )}
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  if (syncing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Alert className="bg-accent/5 border-accent/20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <CloudArrowUp size={20} className="text-accent" weight="bold" />
          </motion.div>
          <AlertDescription className="text-sm">
            <strong className="font-semibold">Syncing your changes...</strong> Updating cloud storage with queued changes.
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  if (showSyncSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Alert className="bg-success/5 border-success/20">
          <CheckCircle size={20} className="text-success" weight="bold" />
          <AlertDescription className="text-sm">
            <strong className="font-semibold">All changes synced!</strong> Your data has been successfully backed up to the cloud.
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  return null
}
