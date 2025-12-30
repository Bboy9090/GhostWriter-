// =========================================
// UNIVERSAL CART - GOD MODE TYPES
// The ultimate shopping companion across all stores
// =========================================

// Store types for universal cart items
export type StoreType = 
  | 'amazon' | 'walmart' | 'target' | 'bestbuy' | 'costco' | 'ebay'
  | 'etsy' | 'shopify' | 'aliexpress' | 'wish' | 'shein' | 'asos'
  | 'nike' | 'adidas' | 'zara' | 'hm' | 'nordstrom' | 'macys'
  | 'ikea' | 'wayfair' | 'homedepot' | 'lowes'
  | 'apple' | 'samsung' | 'microsoft'
  | 'grocery' | 'restaurant' | 'local' | 'other'

// Priority levels for cart items
export type Priority = 'want' | 'need' | 'dream' | 'gift'

// Item status
export type ItemStatus = 'active' | 'purchased' | 'archived' | 'shared'

// Price change tracking
export interface PriceHistory {
  price: number
  date: number
  currency: string
}

// Main Cart Item interface
export interface CartItem {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  imageUrl?: string
  productUrl: string
  store: StoreType
  storeName: string
  storeLogoUrl?: string
  category: string
  tags: string[]
  priority: Priority
  status: ItemStatus
  quantity: number
  notes: string
  priceHistory: PriceHistory[]
  priceAlertThreshold?: number
  addedAt: number
  updatedAt: number
  addedFrom: 'manual' | 'extension' | 'share' | 'scan'
  sharedBy?: string
  collectionIds: string[]
}

// Collection for organizing items
export interface Collection {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  isPublic: boolean
  sharedWith: string[]
  itemCount: number
  createdAt: number
  updatedAt: number
  coverImageUrl?: string
}

// Friend/User profile
export interface Friend {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  bio?: string
  status: 'pending' | 'accepted' | 'blocked'
  addedAt: number
  lastActive?: number
  sharedCollections: string[]
  mutualFriends?: number
}

// Chat message
export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: number
  type: 'text' | 'item_share' | 'collection_share' | 'image' | 'reaction'
  attachedItemId?: string
  attachedCollectionId?: string
  isRead: boolean
  reactions?: { emoji: string; userId: string }[]
}

// Conversation thread
export interface Conversation {
  id: string
  participants: string[]
  participantNames: { [id: string]: string }
  participantAvatars: { [id: string]: string }
  lastMessage?: Message
  unreadCount: number
  createdAt: number
  updatedAt: number
  isGroup: boolean
  groupName?: string
  groupAvatar?: string
}

// Feed post for social features
export interface FeedPost {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  type: 'wishlist_add' | 'price_drop' | 'purchased' | 'collection_created' | 'item_shared'
  content: string
  itemId?: string
  item?: CartItem
  collectionId?: string
  collection?: Collection
  likes: string[]
  comments: FeedComment[]
  timestamp: number
  isPublic: boolean
}

// Comment on feed post
export interface FeedComment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: number
  likes: string[]
}

// User profile
export interface UserProfile {
  id: string
  username: string
  displayName: string
  email?: string
  avatarUrl?: string
  bio?: string
  coverImageUrl?: string
  joinedAt: number
  lastActive: number
  settings: UserSettings
  stats: UserStats
}

// User settings
export interface UserSettings {
  isProfilePublic: boolean
  showWishlistToFriends: boolean
  allowFriendRequests: boolean
  enablePriceAlerts: boolean
  enableSocialNotifications: boolean
  enableChatNotifications: boolean
  theme: 'light' | 'dark' | 'system'
  currency: string
  language: string
}

// User stats
export interface UserStats {
  totalItems: number
  totalCollections: number
  totalFriends: number
  itemsShared: number
  totalSaved: number
}

// Notification
export interface Notification {
  id: string
  type: 'friend_request' | 'item_shared' | 'price_drop' | 'comment' | 'like' | 'mention' | 'message'
  title: string
  message: string
  timestamp: number
  isRead: boolean
  actionUrl?: string
  fromUserId?: string
  fromUserName?: string
  fromUserAvatar?: string
  relatedItemId?: string
  relatedCollectionId?: string
}

// Price alert
export interface PriceAlert {
  id: string
  itemId: string
  targetPrice: number
  currentPrice: number
  isTriggered: boolean
  createdAt: number
  triggeredAt?: number
}

// Quick capture for real-life items
export interface QuickCapture {
  id: string
  imageUrl?: string
  barcode?: string
  productName?: string
  storeName: string
  location?: string
  estimatedPrice?: number
  notes: string
  capturedAt: number
  convertedToItemId?: string
}

// Extension message for browser extension communication
export interface ExtensionMessage {
  type: 'ADD_ITEM' | 'GET_COLLECTIONS' | 'SYNC_STATUS'
  payload: any
  timestamp: number
}

// Share link
export interface ShareLink {
  id: string
  type: 'item' | 'collection' | 'wishlist'
  targetId: string
  createdBy: string
  createdAt: number
  expiresAt?: number
  accessCount: number
  isActive: boolean
}

// App settings (keeping some original structure)
export interface AppSettings {
  pinHash?: string
  failedAttempts: number
  lastActivity: number
}

// Legacy type aliases for backward compatibility
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

// Store metadata for auto-detection
export const STORE_METADATA: Record<StoreType, { name: string; logo: string; color: string; domain: string[] }> = {
  amazon: { name: 'Amazon', logo: '📦', color: '#FF9900', domain: ['amazon.com', 'amazon.co.uk', 'amazon.ca'] },
  walmart: { name: 'Walmart', logo: '🏪', color: '#0071CE', domain: ['walmart.com'] },
  target: { name: 'Target', logo: '🎯', color: '#CC0000', domain: ['target.com'] },
  bestbuy: { name: 'Best Buy', logo: '💻', color: '#0046BE', domain: ['bestbuy.com'] },
  costco: { name: 'Costco', logo: '🏬', color: '#005DAA', domain: ['costco.com'] },
  ebay: { name: 'eBay', logo: '🏷️', color: '#E53238', domain: ['ebay.com'] },
  etsy: { name: 'Etsy', logo: '🎨', color: '#F56400', domain: ['etsy.com'] },
  shopify: { name: 'Shopify Store', logo: '🛍️', color: '#96BF48', domain: ['myshopify.com'] },
  aliexpress: { name: 'AliExpress', logo: '🌏', color: '#E62E04', domain: ['aliexpress.com'] },
  wish: { name: 'Wish', logo: '⭐', color: '#2FB7EC', domain: ['wish.com'] },
  shein: { name: 'SHEIN', logo: '👗', color: '#000000', domain: ['shein.com'] },
  asos: { name: 'ASOS', logo: '👔', color: '#2D2D2D', domain: ['asos.com'] },
  nike: { name: 'Nike', logo: '👟', color: '#111111', domain: ['nike.com'] },
  adidas: { name: 'Adidas', logo: '⚽', color: '#000000', domain: ['adidas.com'] },
  zara: { name: 'Zara', logo: '👚', color: '#000000', domain: ['zara.com'] },
  hm: { name: 'H&M', logo: '👕', color: '#E50010', domain: ['hm.com'] },
  nordstrom: { name: 'Nordstrom', logo: '💎', color: '#000000', domain: ['nordstrom.com'] },
  macys: { name: "Macy's", logo: '🌟', color: '#E21A2C', domain: ['macys.com'] },
  ikea: { name: 'IKEA', logo: '🪑', color: '#0058A3', domain: ['ikea.com'] },
  wayfair: { name: 'Wayfair', logo: '🛋️', color: '#7B0099', domain: ['wayfair.com'] },
  homedepot: { name: 'Home Depot', logo: '🔨', color: '#F96302', domain: ['homedepot.com'] },
  lowes: { name: "Lowe's", logo: '🔧', color: '#004990', domain: ['lowes.com'] },
  apple: { name: 'Apple', logo: '🍎', color: '#000000', domain: ['apple.com'] },
  samsung: { name: 'Samsung', logo: '📱', color: '#1428A0', domain: ['samsung.com'] },
  microsoft: { name: 'Microsoft', logo: '🪟', color: '#00A4EF', domain: ['microsoft.com'] },
  grocery: { name: 'Grocery', logo: '🛒', color: '#4CAF50', domain: [] },
  restaurant: { name: 'Restaurant', logo: '🍽️', color: '#FF5722', domain: [] },
  local: { name: 'Local Store', logo: '📍', color: '#9C27B0', domain: [] },
  other: { name: 'Other', logo: '🛍️', color: '#607D8B', domain: [] },
}

// Categories for items
export const ITEM_CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Garden', 'Sports & Outdoors', 
  'Beauty & Health', 'Toys & Games', 'Books & Media', 'Food & Grocery',
  'Automotive', 'Office', 'Pet Supplies', 'Baby & Kids', 'Jewelry',
  'Art & Crafts', 'Travel', 'Services', 'Other'
]

// Priority colors
export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; emoji: string }> = {
  want: { label: 'Want', color: 'bg-blue-500', emoji: '💭' },
  need: { label: 'Need', color: 'bg-green-500', emoji: '✅' },
  dream: { label: 'Dream', color: 'bg-purple-500', emoji: '✨' },
  gift: { label: 'Gift Idea', color: 'bg-pink-500', emoji: '🎁' },
}
