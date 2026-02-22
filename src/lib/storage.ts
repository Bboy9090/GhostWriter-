import type { 
  CartItem, Collection, Friend, Message, Conversation, 
  FeedPost, UserProfile, Notification, PriceAlert, QuickCapture,
  AppSettings, StoreType
} from './types'
import { STORE_METADATA } from './types'
import { offlineSyncManager } from './offline-sync'

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

const NAMESPACE = 'universalCart'
const KEYS = {
  // Cart & Items
  ITEMS: `${NAMESPACE}.items`,
  COLLECTIONS: `${NAMESPACE}.collections`,
  QUICK_CAPTURES: `${NAMESPACE}.quickCaptures`,
  PRICE_ALERTS: `${NAMESPACE}.priceAlerts`,
  
  // Social
  FRIENDS: `${NAMESPACE}.friends`,
  CONVERSATIONS: `${NAMESPACE}.conversations`,
  MESSAGES: `${NAMESPACE}.messages`,
  FEED: `${NAMESPACE}.feed`,
  NOTIFICATIONS: `${NAMESPACE}.notifications`,
  
  // User
  PROFILE: `${NAMESPACE}.profile`,
  SETTINGS: `${NAMESPACE}.settings`,
  
  // Auth & Security
  PIN_HASH: `${NAMESPACE}.pinHash`,
  FAILED_ATTEMPTS: `${NAMESPACE}.failedAttempts`,
  LAST_ACTIVITY: `${NAMESPACE}.lastActivity`,
  
  // Legacy (for backward compatibility)
  LEGACY_CARDS: 'cardCommandCenter.cards',
  LEGACY_USAGE: 'cardCommandCenter.usage',
}

export const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes for universal cart
export const MAX_FAILED_ATTEMPTS = 5

// Helper function for storage operations
async function safeGet<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const data = await spark.kv.get<T>(key)
    if (data !== undefined) return data
    
    const localData = localStorage.getItem(key)
    if (localData) return JSON.parse(localData)
    
    return defaultValue
  } catch {
    const localData = localStorage.getItem(key)
    if (localData) return JSON.parse(localData)
    return defaultValue
  }
}

async function safeSave<T>(key: string, data: T, queueType: string): Promise<void> {
  if (offlineSyncManager.getOnlineStatus()) {
    try {
      await spark.kv.set(key, data)
    } catch (error) {
      console.error(`Failed to save ${queueType} to cloud, queueing:`, error)
      await offlineSyncManager.addToQueue({
        type: queueType,
        data,
        timestamp: Date.now()
      })
      localStorage.setItem(key, JSON.stringify(data))
    }
  } else {
    await offlineSyncManager.addToQueue({
      type: queueType,
      data,
      timestamp: Date.now()
    })
    localStorage.setItem(key, JSON.stringify(data))
  }
}

export const storage = {
  // =========================================
  // CART ITEMS
  // =========================================
  async loadItems(): Promise<CartItem[]> {
    return safeGet<CartItem[]>(KEYS.ITEMS, [])
  },

  async saveItems(items: CartItem[]): Promise<void> {
    await safeSave(KEYS.ITEMS, items, 'SAVE_ITEMS')
  },

  async addItem(item: CartItem): Promise<CartItem[]> {
    const items = await this.loadItems()
    const updated = [...items, item]
    await this.saveItems(updated)
    return updated
  },

  async updateItem(id: string, updates: Partial<CartItem>): Promise<CartItem[]> {
    const items = await this.loadItems()
    const updated = items.map(item => 
      item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
    )
    await this.saveItems(updated)
    return updated
  },

  async deleteItem(id: string): Promise<CartItem[]> {
    const items = await this.loadItems()
    const updated = items.filter(item => item.id !== id)
    await this.saveItems(updated)
    return updated
  },

  // =========================================
  // COLLECTIONS
  // =========================================
  async loadCollections(): Promise<Collection[]> {
    return safeGet<Collection[]>(KEYS.COLLECTIONS, [])
  },

  async saveCollections(collections: Collection[]): Promise<void> {
    await safeSave(KEYS.COLLECTIONS, collections, 'SAVE_COLLECTIONS')
  },

  async addCollection(collection: Collection): Promise<Collection[]> {
    const collections = await this.loadCollections()
    const updated = [...collections, collection]
    await this.saveCollections(updated)
    return updated
  },

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection[]> {
    const collections = await this.loadCollections()
    const updated = collections.map(col => 
      col.id === id ? { ...col, ...updates, updatedAt: Date.now() } : col
    )
    await this.saveCollections(updated)
    return updated
  },

  async deleteCollection(id: string): Promise<Collection[]> {
    const collections = await this.loadCollections()
    const updated = collections.filter(col => col.id !== id)
    await this.saveCollections(updated)
    return updated
  },

  // =========================================
  // FRIENDS
  // =========================================
  async loadFriends(): Promise<Friend[]> {
    return safeGet<Friend[]>(KEYS.FRIENDS, [])
  },

  async saveFriends(friends: Friend[]): Promise<void> {
    await safeSave(KEYS.FRIENDS, friends, 'SAVE_FRIENDS')
  },

  async addFriend(friend: Friend): Promise<Friend[]> {
    const friends = await this.loadFriends()
    const updated = [...friends, friend]
    await this.saveFriends(updated)
    return updated
  },

  async updateFriend(id: string, updates: Partial<Friend>): Promise<Friend[]> {
    const friends = await this.loadFriends()
    const updated = friends.map(friend => friend.id === id ? { ...friend, ...updates } : friend)
    await this.saveFriends(updated)
    return updated
  },

  async removeFriend(id: string): Promise<Friend[]> {
    const friends = await this.loadFriends()
    const updated = friends.filter(friend => friend.id !== id)
    await this.saveFriends(updated)
    return updated
  },

  // =========================================
  // CONVERSATIONS & MESSAGES
  // =========================================
  async loadConversations(): Promise<Conversation[]> {
    return safeGet<Conversation[]>(KEYS.CONVERSATIONS, [])
  },

  async saveConversations(conversations: Conversation[]): Promise<void> {
    await safeSave(KEYS.CONVERSATIONS, conversations, 'SAVE_CONVERSATIONS')
  },

  async loadMessages(conversationId?: string): Promise<Message[]> {
    const allMessages = await safeGet<Message[]>(KEYS.MESSAGES, [])
    if (conversationId) {
      return allMessages.filter(message => message.conversationId === conversationId)
    }
    return allMessages
  },

  async saveMessages(messages: Message[]): Promise<void> {
    await safeSave(KEYS.MESSAGES, messages, 'SAVE_MESSAGES')
  },

  async addMessage(message: Message): Promise<Message[]> {
    const messages = await this.loadMessages()
    const updated = [...messages, message]
    await this.saveMessages(updated)
    return updated
  },

  // =========================================
  // FEED
  // =========================================
  async loadFeed(): Promise<FeedPost[]> {
    return safeGet<FeedPost[]>(KEYS.FEED, [])
  },

  async saveFeed(feed: FeedPost[]): Promise<void> {
    await safeSave(KEYS.FEED, feed, 'SAVE_FEED')
  },

  async addFeedPost(post: FeedPost): Promise<FeedPost[]> {
    const feed = await this.loadFeed()
    const updated = [post, ...feed].slice(0, 100) // Keep last 100 posts
    await this.saveFeed(updated)
    return updated
  },

  // =========================================
  // NOTIFICATIONS
  // =========================================
  async loadNotifications(): Promise<Notification[]> {
    return safeGet<Notification[]>(KEYS.NOTIFICATIONS, [])
  },

  async saveNotifications(notifications: Notification[]): Promise<void> {
    await safeSave(KEYS.NOTIFICATIONS, notifications, 'SAVE_NOTIFICATIONS')
  },

  async addNotification(notification: Notification): Promise<Notification[]> {
    const notifications = await this.loadNotifications()
    const updated = [notification, ...notifications].slice(0, 50)
    await this.saveNotifications(updated)
    return updated
  },

  async markNotificationRead(id: string): Promise<void> {
    const notifications = await this.loadNotifications()
    const updated = notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    )
    await this.saveNotifications(updated)
  },

  async clearNotifications(): Promise<void> {
    await this.saveNotifications([])
  },

  // =========================================
  // PRICE ALERTS
  // =========================================
  async loadPriceAlerts(): Promise<PriceAlert[]> {
    return safeGet<PriceAlert[]>(KEYS.PRICE_ALERTS, [])
  },

  async savePriceAlerts(alerts: PriceAlert[]): Promise<void> {
    await safeSave(KEYS.PRICE_ALERTS, alerts, 'SAVE_PRICE_ALERTS')
  },

  // =========================================
  // QUICK CAPTURES
  // =========================================
  async loadQuickCaptures(): Promise<QuickCapture[]> {
    return safeGet<QuickCapture[]>(KEYS.QUICK_CAPTURES, [])
  },

  async saveQuickCaptures(captures: QuickCapture[]): Promise<void> {
    await safeSave(KEYS.QUICK_CAPTURES, captures, 'SAVE_QUICK_CAPTURES')
  },

  async addQuickCapture(capture: QuickCapture): Promise<QuickCapture[]> {
    const captures = await this.loadQuickCaptures()
    const updated = [...captures, capture]
    await this.saveQuickCaptures(updated)
    return updated
  },

  // =========================================
  // USER PROFILE
  // =========================================
  async loadProfile(): Promise<UserProfile | null> {
    return safeGet<UserProfile | null>(KEYS.PROFILE, null)
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    await safeSave(KEYS.PROFILE, profile, 'SAVE_PROFILE')
  },

  // =========================================
  // SETTINGS & AUTH
  // =========================================
  async loadSettings(): Promise<AppSettings> {
    try {
      const pinHash = await spark.kv.get<string>(KEYS.PIN_HASH)
      const failedAttempts = await spark.kv.get<number>(KEYS.FAILED_ATTEMPTS) || 0
      const lastActivity = await spark.kv.get<number>(KEYS.LAST_ACTIVITY) || Date.now()
      
      return {
        pinHash: pinHash || undefined,
        failedAttempts,
        lastActivity,
      }
    } catch {
      return {
        failedAttempts: 0,
        lastActivity: Date.now(),
      }
    }
  },

  async savePinHash(hash: string): Promise<void> {
    await spark.kv.set(KEYS.PIN_HASH, hash)
  },

  async saveFailedAttempts(count: number): Promise<void> {
    await spark.kv.set(KEYS.FAILED_ATTEMPTS, count)
  },

  async saveLastActivity(timestamp: number): Promise<void> {
    await spark.kv.set(KEYS.LAST_ACTIVITY, timestamp)
  },

  // =========================================
  // SAMPLE DATA
  // =========================================
  async resetToSampleData(): Promise<CartItem[]> {
    const sampleItems: CartItem[] = [
      {
        id: 'item-1',
        name: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Industry-leading noise canceling with Auto NC Optimizer',
        price: 349.99,
        originalPrice: 399.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        productUrl: 'https://amazon.com/dp/example',
        store: 'amazon',
        storeName: 'Amazon',
        category: 'Electronics',
        tags: ['headphones', 'audio', 'wireless'],
        priority: 'want',
        status: 'active',
        quantity: 1,
        notes: 'Great reviews, perfect for work from home',
        priceHistory: [
          { price: 399.99, date: Date.now() - 30 * 24 * 60 * 60 * 1000, currency: 'USD' },
          { price: 349.99, date: Date.now(), currency: 'USD' }
        ],
        addedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        addedFrom: 'manual',
        collectionIds: ['col-tech']
      },
      {
        id: 'item-2',
        name: 'Nike Air Jordan 1 Retro High OG',
        description: 'Classic colorway, limited edition',
        price: 180.00,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        productUrl: 'https://nike.com/example',
        store: 'nike',
        storeName: 'Nike',
        category: 'Fashion',
        tags: ['sneakers', 'jordan', 'shoes'],
        priority: 'dream',
        status: 'active',
        quantity: 1,
        notes: 'Been wanting these for months!',
        priceHistory: [],
        addedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        addedFrom: 'extension',
        collectionIds: ['col-fashion']
      },
      {
        id: 'item-3',
        name: 'LEGO Star Wars Millennium Falcon',
        description: 'Ultimate Collector Series - 7541 pieces',
        price: 849.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        productUrl: 'https://target.com/example',
        store: 'target',
        storeName: 'Target',
        category: 'Toys & Games',
        tags: ['lego', 'starwars', 'collectible'],
        priority: 'dream',
        status: 'active',
        quantity: 1,
        notes: 'Ultimate dream collectible',
        priceHistory: [],
        addedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        addedFrom: 'manual',
        collectionIds: ['col-gifts']
      },
      {
        id: 'item-4',
        name: 'Apple MacBook Pro 14"',
        description: 'M3 Pro chip, 18GB RAM, 512GB SSD',
        price: 1999.00,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
        productUrl: 'https://apple.com/macbook-pro',
        store: 'apple',
        storeName: 'Apple',
        category: 'Electronics',
        tags: ['laptop', 'apple', 'work'],
        priority: 'need',
        status: 'active',
        quantity: 1,
        notes: 'Need for development work',
        priceHistory: [],
        addedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        addedFrom: 'manual',
        collectionIds: ['col-tech']
      },
      {
        id: 'item-5',
        name: 'Dyson V15 Detect Vacuum',
        description: 'Cordless vacuum with laser dust detection',
        price: 749.99,
        originalPrice: 849.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
        productUrl: 'https://bestbuy.com/example',
        store: 'bestbuy',
        storeName: 'Best Buy',
        category: 'Home & Garden',
        tags: ['vacuum', 'cleaning', 'home'],
        priority: 'want',
        status: 'active',
        quantity: 1,
        notes: 'On sale! Should grab this soon',
        priceHistory: [
          { price: 849.99, date: Date.now() - 7 * 24 * 60 * 60 * 1000, currency: 'USD' }
        ],
        priceAlertThreshold: 600,
        addedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        addedFrom: 'extension',
        collectionIds: ['col-home']
      },
      {
        id: 'item-6',
        name: 'Birthday Gift for Mom - Spa Set',
        description: 'Luxury bath bombs and aromatherapy kit',
        price: 59.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
        productUrl: 'https://etsy.com/example',
        store: 'etsy',
        storeName: 'Etsy',
        category: 'Beauty & Health',
        tags: ['gift', 'mom', 'spa'],
        priority: 'gift',
        status: 'active',
        quantity: 1,
        notes: 'Mom\'s birthday is in 2 weeks!',
        priceHistory: [],
        addedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        addedFrom: 'manual',
        collectionIds: ['col-gifts']
      }
    ]

    const sampleCollections: Collection[] = [
      {
        id: 'col-tech',
        name: 'Tech & Gadgets',
        description: 'All my tech wishlist items',
        emoji: '💻',
        color: '#3B82F6',
        isPublic: false,
        sharedWith: [],
        itemCount: 2,
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      },
      {
        id: 'col-fashion',
        name: 'Fashion & Style',
        description: 'Clothes and accessories I want',
        emoji: '👟',
        color: '#EC4899',
        isPublic: true,
        sharedWith: [],
        itemCount: 1,
        createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      },
      {
        id: 'col-home',
        name: 'Home Upgrades',
        description: 'Things for the house',
        emoji: '🏠',
        color: '#10B981',
        isPublic: false,
        sharedWith: [],
        itemCount: 1,
        createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      },
      {
        id: 'col-gifts',
        name: 'Gift Ideas',
        description: 'Gift ideas for friends and family',
        emoji: '🎁',
        color: '#F59E0B',
        isPublic: false,
        sharedWith: [],
        itemCount: 2,
        createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      }
    ]

    const sampleFriends: Friend[] = [
      {
        id: 'friend-1',
        username: 'sarah_shops',
        displayName: 'Sarah Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        bio: 'Shopping enthusiast 🛍️',
        status: 'accepted',
        addedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
        lastActive: Date.now() - 2 * 60 * 60 * 1000,
        sharedCollections: ['col-fashion'],
        mutualFriends: 3
      },
      {
        id: 'friend-2',
        username: 'tech_mike',
        displayName: 'Mike Johnson',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        bio: 'Tech reviewer & deal hunter',
        status: 'accepted',
        addedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
        lastActive: Date.now() - 30 * 60 * 1000,
        sharedCollections: ['col-tech'],
        mutualFriends: 5
      },
      {
        id: 'friend-3',
        username: 'emma_style',
        displayName: 'Emma Wilson',
        bio: 'Fashion blogger',
        status: 'pending',
        addedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        sharedCollections: [],
        mutualFriends: 2
      }
    ]

    const sampleFeed: FeedPost[] = [
      {
        id: 'post-1',
        userId: 'friend-1',
        userName: 'Sarah Chen',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        type: 'wishlist_add',
        content: 'Just added this to my wishlist! Been eyeing it for months 👀',
        itemId: 'shared-item-1',
        likes: ['friend-2'],
        comments: [
          {
            id: 'comment-1',
            userId: 'friend-2',
            userName: 'Mike Johnson',
            userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            content: 'Great choice! I have those and they\'re amazing',
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
            likes: []
          }
        ],
        timestamp: Date.now() - 4 * 60 * 60 * 1000,
        isPublic: true
      },
      {
        id: 'post-2',
        userId: 'friend-2',
        userName: 'Mike Johnson',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        type: 'price_drop',
        content: '🚨 Price drop alert! This just went on sale',
        itemId: 'shared-item-2',
        likes: ['friend-1', 'user'],
        comments: [],
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        isPublic: true
      }
    ]

    await this.saveItems(sampleItems)
    await this.saveCollections(sampleCollections)
    await this.saveFriends(sampleFriends)
    await this.saveFeed(sampleFeed)

    return sampleItems
  },

  // =========================================
  // PANIC WIPE
  // =========================================
  async performPanicWipe(): Promise<void> {
    const allKeys = await spark.kv.keys()
    const appKeys = allKeys.filter(key => key.startsWith(NAMESPACE) || key.startsWith('cardCommandCenter'))
    await Promise.all(appKeys.map(key => spark.kv.delete(key)))
    
    // Clear localStorage too
    Object.values(KEYS).forEach(key => localStorage.removeItem(key))
  },

  async getAllKeys(): Promise<string[]> {
    const allKeys = await spark.kv.keys()
    return allKeys.filter(key => key.startsWith(NAMESPACE))
  },

  // Legacy methods for backward compatibility
  async loadCards(): Promise<any[]> {
    return safeGet<any[]>(KEYS.LEGACY_CARDS, [])
  },

  async saveCards(cards: any[]): Promise<void> {
    await safeSave(KEYS.LEGACY_CARDS, cards, 'SAVE_CARDS')
  },

  async loadUsage(): Promise<any[]> {
    return safeGet<any[]>(KEYS.LEGACY_USAGE, [])
  },

  async saveUsage(usage: any[]): Promise<void> {
    await safeSave(KEYS.LEGACY_USAGE, usage, 'SAVE_USAGE')
  },

  async initializeSampleUsageData(): Promise<void> {
    // No-op for backward compatibility
  }
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// URL parser for detecting stores
export function detectStore(url: string): { store: StoreType; storeName: string } {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    
    for (const [storeType, meta] of Object.entries(STORE_METADATA)) {
      if (meta.domain.some((d: string) => hostname.includes(d))) {
        return { store: storeType as StoreType, storeName: meta.name }
      }
    }
  } catch {
    // Invalid URL
  }
  
  return { store: 'other', storeName: 'Other Store' }
}

// Format currency
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(price)
}

// Calculate savings
export function calculateSavings(originalPrice: number, currentPrice: number): number {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
}
