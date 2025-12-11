import type { Card, AppSettings, UsageEntry } from './types'

const NAMESPACE = 'cardCommandCenter'
const KEYS = {
  CARDS: `${NAMESPACE}.cards`,
  SETTINGS: `${NAMESPACE}.settings`,
  FAILED_ATTEMPTS: `${NAMESPACE}.failedAttempts`,
  LAST_ACTIVITY: `${NAMESPACE}.lastActivity`,
  USAGE: `${NAMESPACE}.usage`,
}

export const INACTIVITY_TIMEOUT = 5 * 60 * 1000
export const MAX_FAILED_ATTEMPTS = 5

export const storage = {
  loadCards(): Card[] {
    try {
      const data = localStorage.getItem(KEYS.CARDS)
      if (!data) return []
      return JSON.parse(data)
    } catch {
      return []
    }
  },

  saveCards(cards: Card[]): void {
    localStorage.setItem(KEYS.CARDS, JSON.stringify(cards))
  },

  loadSettings(): AppSettings {
    try {
      const pinHash = localStorage.getItem(KEYS.SETTINGS)
      const failedAttempts = parseInt(localStorage.getItem(KEYS.FAILED_ATTEMPTS) || '0', 10)
      const lastActivity = parseInt(localStorage.getItem(KEYS.LAST_ACTIVITY) || Date.now().toString(), 10)
      
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

  savePinHash(hash: string): void {
    localStorage.setItem(KEYS.SETTINGS, hash)
  },

  saveFailedAttempts(count: number): void {
    localStorage.setItem(KEYS.FAILED_ATTEMPTS, count.toString())
  },

  saveLastActivity(timestamp: number): void {
    localStorage.setItem(KEYS.LAST_ACTIVITY, timestamp.toString())
  },

  resetToSampleData(): Card[] {
    const sampleCards: Card[] = [
      {
        id: 'main-visa',
        label: 'Main Visa – Online Shopping',
        bank: 'Chase',
        network: 'Visa',
        last4: '1234',
        expMonth: '12',
        expYear: '2028',
        status: 'active',
        usageTags: ['shopping', 'primary'],
        notes: 'Use this for Amazon and general online orders',
        sourceUrl: 'https://chase.com/cards',
        createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'backup-mastercard',
        label: 'Backup Mastercard',
        bank: 'Capital One',
        network: 'Mastercard',
        last4: '5678',
        expMonth: '06',
        expYear: '2027',
        status: 'active',
        usageTags: ['backup', 'travel'],
        notes: 'Keep for emergencies and international travel',
        createdAt: Date.now() - 300 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'amex-rewards',
        label: 'Amex Gold – Rewards',
        bank: 'American Express',
        network: 'Amex',
        last4: '9012',
        expMonth: '03',
        expYear: '2029',
        status: 'active',
        usageTags: ['rewards', 'dining'],
        notes: '4x points on dining and groceries',
        sourceUrl: 'https://americanexpress.com',
        createdAt: Date.now() - 250 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'bills-visa',
        label: 'Visa – Subscriptions & Bills',
        bank: 'Bank of America',
        network: 'Visa',
        last4: '3456',
        expMonth: '09',
        expYear: '2026',
        status: 'active',
        usageTags: ['bills', 'subscriptions'],
        notes: 'All recurring payments: Netflix, Spotify, utilities',
        createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'frozen-discover',
        label: 'Discover – Temporarily Frozen',
        bank: 'Discover',
        network: 'Discover',
        last4: '7890',
        expMonth: '01',
        expYear: '2025',
        status: 'frozen',
        usageTags: ['frozen'],
        notes: 'Suspicious activity detected, froze until I can call them',
        createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'old-visa',
        label: 'Old Visa – Closed Account',
        bank: 'Wells Fargo',
        network: 'Visa',
        last4: '2468',
        expMonth: '11',
        expYear: '2024',
        status: 'closed',
        usageTags: [],
        notes: 'Closed this account after switching banks',
        createdAt: Date.now() - 500 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'business-amex',
        label: 'Amex Business Card',
        bank: 'American Express',
        network: 'Amex',
        last4: '1357',
        expMonth: '08',
        expYear: '2028',
        status: 'active',
        usageTags: ['business', 'primary'],
        notes: 'For all business expenses and client meetings',
        createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'travel-mastercard',
        label: 'Travel Rewards Mastercard',
        bank: 'Citi',
        network: 'Mastercard',
        last4: '8642',
        expMonth: '04',
        expYear: '2027',
        status: 'active',
        usageTags: ['travel', 'rewards'],
        notes: 'No foreign transaction fees, use for all travel bookings',
        createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
      },
    ]

    this.saveCards(sampleCards)
    this.initializeSampleUsageData()
    return sampleCards
  },

  loadUsage(): UsageEntry[] {
    try {
      const data = localStorage.getItem(KEYS.USAGE)
      if (!data) return []
      return JSON.parse(data)
    } catch {
      return []
    }
  },

  saveUsage(usage: UsageEntry[]): void {
    localStorage.setItem(KEYS.USAGE, JSON.stringify(usage))
  },

  initializeSampleUsageData(): void {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    
    const categories = ['Dining', 'Groceries', 'Shopping', 'Travel', 'Entertainment', 'Bills', 'Gas', 'Healthcare', 'Other']
    const merchants: Record<string, string> = {
      'Dining': 'Restaurant',
      'Groceries': 'Supermarket',
      'Shopping': 'Online Store',
      'Travel': 'Airline',
      'Entertainment': 'Streaming Service',
      'Bills': 'Utility Company',
      'Gas': 'Gas Station',
      'Healthcare': 'Pharmacy',
      'Other': 'Various Merchant'
    }
    
    const cardIds = [
      'main-visa',
      'backup-mastercard',
      'amex-rewards',
      'bills-visa',
      'business-amex',
      'travel-mastercard'
    ]
    
    const sampleUsage: UsageEntry[] = []
    
    for (let i = 0; i < 90; i++) {
      const numTransactions = Math.floor(Math.random() * 5) + 2
      
      for (let j = 0; j < numTransactions; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)]
        const cardId = cardIds[Math.floor(Math.random() * cardIds.length)]
        
        let amount = 0
        if (category === 'Dining') amount = Math.random() * 80 + 20
        else if (category === 'Groceries') amount = Math.random() * 150 + 50
        else if (category === 'Shopping') amount = Math.random() * 200 + 30
        else if (category === 'Travel') amount = Math.random() * 500 + 100
        else if (category === 'Bills') amount = Math.random() * 150 + 50
        else if (category === 'Gas') amount = Math.random() * 60 + 30
        else amount = Math.random() * 100 + 20
        
        sampleUsage.push({
          id: `usage-${now}-${i}-${j}`,
          cardId,
          amount: Math.round(amount * 100) / 100,
          merchant: merchants[category],
          category,
          date: now - (i * oneDay),
          notes: ''
        })
      }
    }
    
    this.saveUsage(sampleUsage)
  },

  performPanicWipe(): void {
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  },

  getAllKeys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(NAMESPACE)) {
        keys.push(key)
      }
    }
    return keys
  },
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
