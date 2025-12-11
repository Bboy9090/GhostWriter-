export type CardNetwork = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Other'

export type CardStatus = 'active' | 'frozen' | 'closed'

export interface Card {
  id: string
  label: string
  bank: string
  network: CardNetwork
  last4: string
  expMonth: string
  expYear: string
  status: CardStatus
  usageTags: string[]
  notes: string
  sourceUrl?: string
  createdAt?: number
}

export interface UsageEntry {
  id: string
  cardId: string
  amount: number
  merchant: string
  category: string
  date: number
  notes?: string
}

export interface AppSettings {
  pinHash?: string
  failedAttempts: number
  lastActivity: number
}
