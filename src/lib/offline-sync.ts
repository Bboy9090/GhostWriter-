import type { Card, UsageEntry } from './types'

export type SyncOperation =
  | { type: 'SAVE_CARDS'; data: Card[]; timestamp: number; id: string }
  | { type: 'SAVE_USAGE'; data: UsageEntry[]; timestamp: number; id: string }

export interface SyncQueue {
  operations: SyncOperation[]
  lastProcessedTime: number
  isPaused: boolean
}

export interface SyncProgress {
  currentOperation: number
  totalOperations: number
  currentOperationType: string
  isPaused: boolean
  isProcessing: boolean
}

const SYNC_QUEUE_KEY = 'cardCommandCenter.syncQueue'
const BATCH_SIZE = 1
const BATCH_DELAY_MS = 500
const SPARK_KV_MAX_ATTEMPTS = 4
const SPARK_KV_BASE_DELAY_MS = 500

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
  private isPaused: boolean = false
  private currentProgress: SyncProgress = {
    currentOperation: 0,
    totalOperations: 0,
    currentOperationType: '',
    isPaused: false,
    isProcessing: false,
  }
  private listeners: Set<(isOnline: boolean) => void> = new Set()
  private syncListeners: Set<(success: boolean) => void> = new Set()
  private progressListeners: Set<(progress: SyncProgress) => void> = new Set()

  constructor() {
    this.setupEventListeners()
    this.loadPausedState()
  }

  private async loadPausedState() {
    const queue = await this.loadQueue()
    this.isPaused = queue.isPaused
    this.currentProgress.isPaused = queue.isPaused
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners()
      if (!this.isPaused) {
        this.processSyncQueue()
      }
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

  onProgressUpdate(callback: (progress: SyncProgress) => void): () => void {
    this.progressListeners.add(callback)
    callback(this.currentProgress)
    return () => this.progressListeners.delete(callback)
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.isOnline))
  }

  private notifySyncListeners(success: boolean) {
    this.syncListeners.forEach(callback => callback(success))
  }

  private notifyProgressListeners() {
    this.progressListeners.forEach(callback => callback({ ...this.currentProgress }))
  }

  async addToQueue(operation: Omit<SyncOperation, 'id'>): Promise<void> {
    const queue = await this.loadQueue()

    const operationWithId = {
      ...operation,
      id: `${operation.type}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    } as SyncOperation

    const existingIndex = queue.operations.findIndex(op => op.type === operation.type)

    if (existingIndex !== -1) {
      queue.operations[existingIndex] = operationWithId
    } else {
      queue.operations.push(operationWithId)
    }

    await this.saveQueue(queue)
    this.updateProgress()
  }

  async pauseSync(): Promise<void> {
    this.isPaused = true
    const queue = await this.loadQueue()
    queue.isPaused = true
    await this.saveQueue(queue)
    this.currentProgress.isPaused = true
    this.notifyProgressListeners()
  }

  async resumeSync(): Promise<void> {
    this.isPaused = false
    const queue = await this.loadQueue()
    queue.isPaused = false
    await this.saveQueue(queue)
    this.currentProgress.isPaused = false
    this.notifyProgressListeners()

    if (this.isOnline && !this.syncInProgress) {
      await this.processSyncQueue()
    }
  }

  isPausedState(): boolean {
    return this.isPaused
  }

  getCurrentProgress(): SyncProgress {
    return { ...this.currentProgress }
  }

  private updateProgress() {
    this.notifyProgressListeners()
  }

  async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.isPaused) {
      return
    }

    this.syncInProgress = true
    this.currentProgress.isProcessing = true
    const queue = await this.loadQueue()

    if (queue.operations.length === 0) {
      this.syncInProgress = false
      this.currentProgress.isProcessing = false
      this.currentProgress.currentOperation = 0
      this.currentProgress.totalOperations = 0
      this.notifyProgressListeners()
      return
    }

    this.currentProgress.totalOperations = queue.operations.length
    this.currentProgress.currentOperation = 0
    this.notifyProgressListeners()

    try {
      const operations = [...queue.operations]

      for (let i = 0; i < operations.length; i++) {
        if (this.isPaused) {
          this.syncInProgress = false
          this.currentProgress.isProcessing = false
          this.notifyProgressListeners()
          return
        }

        const operation = operations[i]
        this.currentProgress.currentOperation = i + 1
        this.currentProgress.currentOperationType = this.getOperationLabel(operation.type)
        this.notifyProgressListeners()

        await this.executeOperation(operation)

        queue.operations = queue.operations.filter(op => op.id !== operation.id)
        await this.saveQueue(queue)

        if (i < operations.length - 1 && BATCH_DELAY_MS > 0) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
        }
      }

      queue.lastProcessedTime = Date.now()
      await this.saveQueue(queue)

      this.currentProgress.currentOperation = 0
      this.currentProgress.totalOperations = 0
      this.currentProgress.currentOperationType = ''
      this.notifyProgressListeners()
      this.notifySyncListeners(true)
    } catch (error) {
      console.error('Failed to process sync queue:', error)
      this.notifySyncListeners(false)
    } finally {
      this.syncInProgress = false
      this.currentProgress.isProcessing = false
      this.notifyProgressListeners()
    }
  }

  private getOperationLabel(type: string): string {
    switch (type) {
      case 'SAVE_CARDS':
        return 'Syncing cards'
      case 'SAVE_USAGE':
        return 'Syncing transactions'
      default:
        return 'Syncing data'
    }
  }

  private async sparkKvSetWithRetry<T>(key: string, value: T): Promise<void> {
    let lastErr: unknown
    for (let attempt = 1; attempt <= SPARK_KV_MAX_ATTEMPTS; attempt++) {
      try {
        await spark.kv.set(key, value)
        return
      } catch (e) {
        lastErr = e
        if (attempt < SPARK_KV_MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, SPARK_KV_BASE_DELAY_MS * Math.pow(2, attempt - 1)))
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Spark KV sync failed')
  }

  private async executeOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'SAVE_CARDS':
        await this.sparkKvSetWithRetry('cardCommandCenter.cards', operation.data)
        localStorage.removeItem('cardCommandCenter.cards')
        break
      case 'SAVE_USAGE':
        await this.sparkKvSetWithRetry('cardCommandCenter.usage', operation.data)
        localStorage.removeItem('cardCommandCenter.usage')
        break
    }
  }

  async getQueueSize(): Promise<number> {
    const queue = await this.loadQueue()
    return queue.operations.length
  }

  async getQueueOperations(): Promise<SyncOperation[]> {
    const queue = await this.loadQueue()
    return queue.operations
  }

  async clearQueue(): Promise<void> {
    await this.saveQueue({ operations: [], lastProcessedTime: Date.now(), isPaused: false })
    this.isPaused = false
    this.currentProgress.isPaused = false
    this.currentProgress.currentOperation = 0
    this.currentProgress.totalOperations = 0
    this.notifyProgressListeners()
  }

  private async loadQueue(): Promise<SyncQueue> {
    try {
      const queue = await spark.kv.get<SyncQueue>(SYNC_QUEUE_KEY)
      if (!queue) {
        return { operations: [], lastProcessedTime: Date.now(), isPaused: false }
      }
      return queue
    } catch {
      return { operations: [], lastProcessedTime: Date.now(), isPaused: false }
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
