import type { Card, UsageEntry } from './types'

export type SyncOperation = 
  | { type: 'SAVE_CARDS'; data: Card[]; timestamp: number }
  | { type: 'SAVE_USAGE'; data: UsageEntry[]; timestamp: number }

export interface SyncQueue {
  operations: SyncOperation[]
  lastProcessedTime: number
}

const SYNC_QUEUE_KEY = 'cardCommandCenter.syncQueue'

declare global {
  interface Window {
    spark: {
      kv: {
        keys: () => Promise<string[]>
        get: <T>(key: string) => Promise<T | undefined>
        set: <T>(key: string, value: T) => Promise<void>
        delete: (key: string) => Promise<void>
      }
    }
  }
}

const spark = window.spark

export class OfflineSyncManager {
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false
  private listeners: Set<(isOnline: boolean) => void> = new Set()
  private syncListeners: Set<(success: boolean) => void> = new Set()

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners()
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners()
    })
  }

  getOnlineStatus(): boolean {
    return this.isOnline
  }

  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  onSyncComplete(callback: (success: boolean) => void): () => void {
    this.syncListeners.add(callback)
    return () => this.syncListeners.delete(callback)
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.isOnline))
  }

  private notifySyncListeners(success: boolean) {
    this.syncListeners.forEach(callback => callback(success))
  }

  async addToQueue(operation: SyncOperation): Promise<void> {
    const queue = await this.loadQueue()
    
    const existingIndex = queue.operations.findIndex(
      op => op.type === operation.type
    )
    
    if (existingIndex !== -1) {
      queue.operations[existingIndex] = operation
    } else {
      queue.operations.push(operation)
    }
    
    await this.saveQueue(queue)
  }

  async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return
    }

    this.syncInProgress = true
    const queue = await this.loadQueue()

    if (queue.operations.length === 0) {
      this.syncInProgress = false
      return
    }

    try {
      for (const operation of queue.operations) {
        await this.executeOperation(operation)
      }

      queue.operations = []
      queue.lastProcessedTime = Date.now()
      await this.saveQueue(queue)
      
      this.notifySyncListeners(true)
    } catch (error) {
      console.error('Failed to process sync queue:', error)
      this.notifySyncListeners(false)
    } finally {
      this.syncInProgress = false
    }
  }

  private async executeOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'SAVE_CARDS':
        await spark.kv.set('cardCommandCenter.cards', operation.data)
        localStorage.removeItem('cardCommandCenter.cards')
        break
      case 'SAVE_USAGE':
        await spark.kv.set('cardCommandCenter.usage', operation.data)
        localStorage.removeItem('cardCommandCenter.usage')
        break
    }
  }

  async getQueueSize(): Promise<number> {
    const queue = await this.loadQueue()
    return queue.operations.length
  }

  async clearQueue(): Promise<void> {
    await this.saveQueue({ operations: [], lastProcessedTime: Date.now() })
  }

  private async loadQueue(): Promise<SyncQueue> {
    try {
      const queue = await spark.kv.get<SyncQueue>(SYNC_QUEUE_KEY)
      if (!queue) {
        return { operations: [], lastProcessedTime: Date.now() }
      }
      return queue
    } catch {
      return { operations: [], lastProcessedTime: Date.now() }
    }
  }

  private async saveQueue(queue: SyncQueue): Promise<void> {
    try {
      await spark.kv.set(SYNC_QUEUE_KEY, queue)
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }
}

export const offlineSyncManager = new OfflineSyncManager()
