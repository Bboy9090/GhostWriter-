import { useEffect, useState } from 'react'
import {
  getCaptureEntries,
  onCaptureChange,
  requestEntriesSync,
  type CaptureEntry,
} from '@/lib/capture-store'

/**
 * React hook that returns the live capture log.
 * Automatically subscribes to new entries from any window.
 */
export function useCaptureLog() {
  const [entries, setEntries] = useState<CaptureEntry[]>(() => getCaptureEntries())

  useEffect(() => {
    // Subscribe to changes (both in-window and cross-window)
    const unsubscribe = onCaptureChange(setEntries)

    // Request a sync from other windows in case we missed entries
    requestEntriesSync()

    return unsubscribe
  }, [])

  return entries
}
