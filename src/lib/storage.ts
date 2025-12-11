import type { Card, AppSettings } from './types'

const NAMESPACE = 'cardCommandCenter'
const KEYS = {
  CARDS: `${NAMESPACE}.cards`,
  SETTINGS: `${NAMESPACE}.settings`,
  FAILED_ATTEMPTS: `${NAMESPACE}.failedAttempts`,
  LAST_ACTIVITY: `${NAMESPACE}.lastActivity`,
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
      },
    ]

    this.saveCards(sampleCards)
    return sampleCards
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
