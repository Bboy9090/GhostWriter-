import { useState, useEffect } from 'react'
import { offlineSyncManager } from '@/lib/offline-sync'

interface UseOfflineSyncReturn {
  isOnline: boolean
  queueSize: number
  isSyncing: boolean
  triggerSync: () => Promise<void>
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(offlineSyncManager.getOnlineStatus())
  const [queueSize, setQueueSize] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await offlineSyncManager.getQueueSize()
      setQueueSize(size)
    }

    const unsubscribeStatus = offlineSyncManager.onStatusChange((online) => {
      setIsOnline(online)
      updateQueueSize()
    })

    const unsubscribeSync = offlineSyncManager.onSyncComplete((success) => {
      setIsSyncing(false)
      if (success) {
        setQueueSize(0)
      }
      updateQueueSize()
    })

    updateQueueSize()

    return () => {
      unsubscribeStatus()
      unsubscribeSync()
    }
  }, [])

  const triggerSync = async () => {
    if (!isOnline || isSyncing) return
    setIsSyncing(true)
    await offlineSyncManager.processSyncQueue()
  }

  return {
    isOnline,
    queueSize,
    isSyncing,
    triggerSync
  }
}
