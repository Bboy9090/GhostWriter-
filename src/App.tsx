import { useState, useEffect, useMemo } from 'react'
import { 
  CartItem, Collection, Friend, Message, Conversation, 
  FeedPost, FeedComment, QuickCapture as QuickCaptureType,
  PRIORITY_CONFIG, STORE_METADATA
} from './lib/types'
import { storage, generateId, INACTIVITY_TIMEOUT, formatPrice } from './lib/storage'
import { offlineSyncManager } from './lib/offline-sync'
import { soundSystem } from './lib/sounds'

// Components
import { SplashScreen } from './components/SplashScreen'
import { LockScreen } from './components/LockScreen'
import { Logo, LogoWithText } from './components/Logo'
import { CartItemCard } from './components/CartItemCard'
import { AddItemForm } from './components/AddItemForm'
import { CollectionsPanel } from './components/CollectionsPanel'
import { FriendsPanel } from './components/FriendsPanel'
import { ChatPanel } from './components/ChatPanel'
import { SocialFeed } from './components/SocialFeed'
import { QuickCapture } from './components/QuickCapture'
import { BrowserExtension } from './components/BrowserExtension'
import { CloudSyncStatus } from './components/CloudSyncStatus'
import { OfflineIndicator } from './components/OfflineIndicator'
import { BatchSyncControl } from './components/BatchSyncControl'
import { PanicWipeDialog } from './components/PanicWipeDialog'

// UI Components
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card, CardContent } from './components/ui/card'
// ScrollArea imported but only used in child components
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar'
import { Toaster } from './components/ui/sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog'

// Icons
import { 
  Lock, LockOpen, ShoppingCart, MagnifyingGlass, Plus, Warning,
  Folder, Users, Chat, Sparkle, Lightning, Browser, Bell,
  TrendDown, Heart, Share, GridFour,
  List, SpeakerHigh, SpeakerSlash, Camera, ShoppingBag
} from '@phosphor-icons/react'
import { toast } from 'sonner'

type ViewMode = 'grid' | 'list'
type SortBy = 'newest' | 'price-low' | 'price-high' | 'name' | 'priority'

function App() {
  // Core state
  const [showSplash, setShowSplash] = useState(true)
  const [isLocked, setIsLocked] = useState(true)
  const [activeTab, setActiveTab] = useState('cart')
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now())
  const [isOnline, setIsOnline] = useState(offlineSyncManager.getOnlineStatus())
  const [soundEnabled, setSoundEnabled] = useState(soundSystem.isEnabled())
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null)

  // Cart state
  const [items, setItems] = useState<CartItem[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Social state
  const [friends, setFriends] = useState<Friend[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [quickCaptures, setQuickCaptures] = useState<QuickCaptureType[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)

  // Dialog state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false)
  const [isExtensionOpen, setIsExtensionOpen] = useState(false)
  const [isPanicDialogOpen, setIsPanicDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [sharingItem, setSharingItem] = useState<CartItem | null>(null)

  // Current user (mock)
  const currentUserId = 'current-user'
  const currentUserName = 'You'

  // Initialize app data
  useEffect(() => {
    const loadData = async () => {
      const loadedItems = await storage.loadItems()
      const loadedCollections = await storage.loadCollections()
      const loadedFriends = await storage.loadFriends()
      const loadedConversations = await storage.loadConversations()
      const loadedMessages = await storage.loadMessages()
      const loadedFeed = await storage.loadFeed()
      const loadedCaptures = await storage.loadQuickCaptures()

      if (loadedItems.length === 0) {
        // Load sample data
        const sampleItems = await storage.resetToSampleData()
        setItems(sampleItems)
        const sampleCollections = await storage.loadCollections()
        setCollections(sampleCollections)
        const sampleFriends = await storage.loadFriends()
        setFriends(sampleFriends)
        const sampleFeed = await storage.loadFeed()
        setFeedPosts(sampleFeed)
      } else {
        setItems(loadedItems)
        setCollections(loadedCollections)
        setFriends(loadedFriends)
        setConversations(loadedConversations)
        setMessages(loadedMessages)
        setFeedPosts(loadedFeed)
        setQuickCaptures(loadedCaptures)
      }
    }

    loadData()
  }, [])

  // Online status listener
  useEffect(() => {
    const unsubscribe = offlineSyncManager.onStatusChange((online) => {
      setIsOnline(online)
      if (online) {
        toast.info('Connection restored. Syncing...')
      } else {
        toast.info('You\'re offline. Changes will sync when reconnected.')
      }
    })
    return () => unsubscribe()
  }, [])

  // Inactivity timer
  useEffect(() => {
    if (!isLocked) {
      resetInactivityTimer()
      const handleActivity = () => {
        storage.saveLastActivity(Date.now()).catch(console.error)
        resetInactivityTimer()
      }
      window.addEventListener('mousemove', handleActivity)
      window.addEventListener('keydown', handleActivity)
      window.addEventListener('click', handleActivity)
      return () => {
        window.removeEventListener('mousemove', handleActivity)
        window.removeEventListener('keydown', handleActivity)
        window.removeEventListener('click', handleActivity)
        if (inactivityTimer) clearTimeout(inactivityTimer)
      }
    }
  }, [isLocked])

  const resetInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer)
    const timer = setTimeout(() => {
      setIsLocked(true)
      toast.info('Session locked due to inactivity')
    }, INACTIVITY_TIMEOUT)
    setInactivityTimer(timer)
  }

  // Handlers
  const handleUnlock = () => {
    setIsLocked(false)
    soundSystem.playSuccess()
    toast.success('Welcome back! 🛒')
  }

  const handlePanicWipe = async () => {
    await storage.performPanicWipe()
    setItems([])
    setCollections([])
    setFriends([])
    setFeedPosts([])
    setIsLocked(true)
    setIsPanicDialogOpen(false)
    toast.success('All data wiped successfully.')
    setTimeout(() => window.location.reload(), 1000)
  }

  // Item handlers
  const handleSaveItem = async (item: CartItem) => {
    let updatedItems: CartItem[]
    
    if (editingItem) {
      updatedItems = items.map(i => i.id === item.id ? item : i)
      soundSystem.playSuccess()
      toast.success('Item updated!')
    } else {
      updatedItems = [...items, item]
      soundSystem.playSuccess()
      toast.success('Item added to cart! 🎉')
      
      // Add to feed
      const feedPost: FeedPost = {
        id: generateId(),
        userId: currentUserId,
        userName: currentUserName,
        type: 'wishlist_add',
        content: `Added ${item.name} to wishlist`,
        itemId: item.id,
        item,
        likes: [],
        comments: [],
        timestamp: Date.now(),
        isPublic: true
      }
      const updatedFeed = await storage.addFeedPost(feedPost)
      setFeedPosts(updatedFeed)
    }

    setItems(updatedItems)
    await storage.saveItems(updatedItems)
    setLastSyncTime(Date.now())
    setEditingItem(null)
  }

  const handleDeleteItem = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    if (confirm(`Remove "${item.name}" from your cart?`)) {
      const updatedItems = items.filter(i => i.id !== id)
      setItems(updatedItems)
      await storage.saveItems(updatedItems)
      setLastSyncTime(Date.now())
      soundSystem.playDelete()
      toast.success('Item removed')
    }
  }

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    const updatedItems = items.map(i => 
      i.id === id ? { ...i, quantity, updatedAt: Date.now() } : i
    )
    setItems(updatedItems)
    await storage.saveItems(updatedItems)
  }

  const handleMarkPurchased = async (id: string) => {
    const updatedItems = items.map(i => 
      i.id === id ? { ...i, status: 'purchased' as const, updatedAt: Date.now() } : i
    )
    setItems(updatedItems)
    await storage.saveItems(updatedItems)
    soundSystem.playSuccess()
    toast.success('Marked as purchased! 🎊')
  }

  const handleShareItem = (item: CartItem) => {
    setSharingItem(item)
    setIsShareDialogOpen(true)
  }

  const handleAddToCollection = (item: CartItem) => {
    // Quick add to first collection or show selector
    if (collections.length > 0) {
      const collection = collections[0]
      const updatedItems = items.map(i => 
        i.id === item.id 
          ? { ...i, collectionIds: [...new Set([...i.collectionIds, collection.id])] }
          : i
      )
      setItems(updatedItems)
      storage.saveItems(updatedItems)
      toast.success(`Added to "${collection.name}"`)
    } else {
      toast.info('Create a collection first!')
    }
  }

  // Collection handlers
  const handleCreateCollection = async (collection: Collection) => {
    const updatedCollections = await storage.addCollection(collection)
    setCollections(updatedCollections)
  }

  const handleUpdateCollection = async (id: string, updates: Partial<Collection>) => {
    const updatedCollections = await storage.updateCollection(id, updates)
    setCollections(updatedCollections)
  }

  const handleDeleteCollection = async (id: string) => {
    const updatedCollections = await storage.deleteCollection(id)
    setCollections(updatedCollections)
  }

  // Friend handlers
  const handleAddFriend = async (friend: Friend) => {
    const updatedFriends = await storage.addFriend(friend)
    setFriends(updatedFriends)
  }

  const handleUpdateFriend = async (id: string, updates: Partial<Friend>) => {
    const updatedFriends = await storage.updateFriend(id, updates)
    setFriends(updatedFriends)
  }

  const handleRemoveFriend = async (id: string) => {
    const updatedFriends = await storage.removeFriend(id)
    setFriends(updatedFriends)
    toast.success('Friend removed')
  }

  const handleStartChat = (friend: Friend) => {
    setSelectedFriend(friend)
    setActiveTab('chat')
  }

  const handleViewWishlist = (friend: Friend) => {
    toast.info(`Viewing ${friend.displayName}'s wishlist`)
  }

  // Message handlers
  const handleSendMessage = async (message: Message) => {
    const updatedMessages = await storage.addMessage(message)
    setMessages(updatedMessages)
  }

  const handleStartConversation = (friendId: string) => {
    const newConv: Conversation = {
      id: generateId(),
      participants: [currentUserId, friendId],
      participantNames: {},
      participantAvatars: {},
      unreadCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isGroup: false
    }
    setConversations([...conversations, newConv])
  }

  // Feed handlers
  const handleLikePost = async (postId: string) => {
    const updatedPosts = feedPosts.map(post => {
      if (post.id === postId) {
        const isLiked = post.likes.includes(currentUserId)
        return {
          ...post,
          likes: isLiked 
            ? post.likes.filter(id => id !== currentUserId)
            : [...post.likes, currentUserId]
        }
      }
      return post
    })
    setFeedPosts(updatedPosts)
    await storage.saveFeed(updatedPosts)
  }

  const handleCommentPost = async (postId: string, comment: FeedComment) => {
    const updatedPosts = feedPosts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, comment] }
      }
      return post
    })
    setFeedPosts(updatedPosts)
    await storage.saveFeed(updatedPosts)
  }

  const handleSharePost = (post: FeedPost) => {
    toast.success('Post link copied!')
  }

  const handleAddFromFeed = async (item: CartItem) => {
    const newItem = { ...item, id: generateId(), addedFrom: 'share' as const }
    await handleSaveItem(newItem)
  }

  // Quick capture handlers
  const handleQuickCapture = async (capture: QuickCaptureType) => {
    const updatedCaptures = await storage.addQuickCapture(capture)
    setQuickCaptures(updatedCaptures)
  }

  const handleConvertCapture = (capture: QuickCaptureType) => {
    setEditingItem(null)
    setIsAddItemOpen(true)
    // Pre-fill form with capture data
  }

  // Sound toggle
  const toggleSound = () => {
    const newState = !soundEnabled
    setSoundEnabled(newState)
    soundSystem.setEnabled(newState)
    if (newState) {
      soundSystem.playClick()
      toast.success('Sound effects enabled')
    } else {
      toast.info('Sound effects disabled')
    }
  }

  // Filtered items
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => item.status !== 'archived')

    // Collection filter
    if (selectedCollectionId) {
      filtered = filtered.filter(item => item.collectionIds.includes(selectedCollectionId))
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.storeName.toLowerCase().includes(q) ||
        item.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter)
    }

    // Store filter
    if (storeFilter !== 'all') {
      filtered = filtered.filter(item => item.store === storeFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.addedAt - a.addedAt
        case 'price-low': return a.price - b.price
        case 'price-high': return b.price - a.price
        case 'name': return a.name.localeCompare(b.name)
        case 'priority': {
          const priorityOrder: Record<string, number> = { need: 0, want: 1, dream: 2, gift: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        default: return 0
      }
    })

    return filtered
  }, [items, selectedCollectionId, searchQuery, priorityFilter, storeFilter, sortBy])

  // Stats
  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.filter(i => i.status === 'active').length
  const priceDropCount = items.filter(i => i.originalPrice && i.price < i.originalPrice).length
  const pendingFriendRequests = friends.filter(f => f.status === 'pending').length

  // Get unique stores
  const uniqueStores = useMemo(() => {
    const stores = new Set(items.map(i => i.store))
    return Array.from(stores)
  }, [items])

  // Splash screen
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  // Lock screen
  if (isLocked) {
    return (
      <>
        <LockScreen onUnlock={handleUnlock} onPanicWipe={handlePanicWipe} />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <LogoWithText size={40} />

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSound}
                  title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
                >
                  {soundEnabled ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setActiveTab('friends')}
                >
                  <Bell size={20} />
                  {pendingFriendRequests > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingFriendRequests}
                    </span>
                  )}
                </Button>

                <CloudSyncStatus lastSyncTime={lastSyncTime} />

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20">
                  <LockOpen size={16} />
                  <span className="text-sm font-medium">Unlocked</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLocked(true)
                    soundSystem.playLock()
                    toast.info('Cart locked')
                  }}
                >
                  <Lock size={16} className="mr-1" />
                  Lock
                </Button>
              </div>
            </div>
          </div>
        </header>

        <OfflineIndicator />
        <BatchSyncControl />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 mb-6">
              <TabsTrigger value="cart" className="gap-1.5">
                <ShoppingCart size={18} />
                <span className="hidden sm:inline">Cart</span>
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                  {totalItems}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="feed" className="gap-1.5">
                <Sparkle size={18} />
                <span className="hidden sm:inline">Feed</span>
              </TabsTrigger>
              <TabsTrigger value="friends" className="gap-1.5 relative">
                <Users size={18} />
                <span className="hidden sm:inline">Friends</span>
                {pendingFriendRequests > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingFriendRequests}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1.5">
                <Chat size={18} />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="capture" className="gap-1.5">
                <Camera size={18} />
                <span className="hidden sm:inline">Capture</span>
              </TabsTrigger>
            </TabsList>

            {/* Cart Tab */}
            <TabsContent value="cart" className="mt-0">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar - Collections */}
                <aside className="w-full lg:w-72 flex-shrink-0">
                  <CollectionsPanel
                    collections={collections}
                    items={items}
                    onCreateCollection={handleCreateCollection}
                    onUpdateCollection={handleUpdateCollection}
                    onDeleteCollection={handleDeleteCollection}
                    onSelectCollection={(col) => setSelectedCollectionId(col?.id || null)}
                    selectedCollectionId={selectedCollectionId}
                  />
                </aside>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/20">
                            <ShoppingBag size={20} className="text-purple-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{totalItems}</p>
                            <p className="text-xs text-muted-foreground">Items</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/20">
                            <TrendDown size={20} className="text-green-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{priceDropCount}</p>
                            <p className="text-xs text-muted-foreground">On Sale</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            <Folder size={20} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{collections.length}</p>
                            <p className="text-xs text-muted-foreground">Collections</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/20">
                            <Heart size={20} className="text-amber-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{formatPrice(totalValue)}</p>
                            <p className="text-xs text-muted-foreground">Total Value</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex-1 min-w-[250px] relative">
                      <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search items, stores, tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.emoji} {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={storeFilter} onValueChange={setStoreFilter}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Store" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stores</SelectItem>
                          {uniqueStores.map(store => (
                            <SelectItem key={store} value={store}>
                              {STORE_METADATA[store].logo} {STORE_METADATA[store].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={(v: SortBy) => setSortBy(v)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="name">Name A-Z</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex border rounded-lg overflow-hidden">
                        <Button
                          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="rounded-none"
                          onClick={() => setViewMode('grid')}
                        >
                          <GridFour size={18} />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="rounded-none"
                          onClick={() => setViewMode('list')}
                        >
                          <List size={18} />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => setIsAddItemOpen(true)}>
                        <Plus size={18} className="mr-1" />
                        Add Item
                      </Button>
                      <Button variant="outline" onClick={() => setIsExtensionOpen(true)}>
                        <Browser size={18} className="mr-1" />
                        Extension
                      </Button>
                    </div>
                  </div>

                  {/* Items Grid */}
                  {filteredItems.length === 0 ? (
                    <Card className="py-16 text-center">
                      <ShoppingCart size={64} className="mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-xl font-semibold mb-2">
                        {items.length === 0 ? 'Your cart is empty' : 'No items found'}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {items.length === 0 
                          ? 'Start adding items from any store on the web'
                          : 'Try adjusting your filters or search query'
                        }
                      </p>
                      {items.length === 0 && (
                        <div className="flex justify-center gap-3">
                          <Button onClick={() => setIsAddItemOpen(true)}>
                            <Plus size={18} className="mr-1" />
                            Add Your First Item
                          </Button>
                          <Button variant="outline" onClick={() => setIsExtensionOpen(true)}>
                            <Browser size={18} className="mr-1" />
                            Get Extension
                          </Button>
                        </div>
                      )}
                    </Card>
                  ) : (
                    <>
                      <div className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                          : 'space-y-3'
                      }>
                        {filteredItems.map(item => (
                          <CartItemCard
                            key={item.id}
                            item={item}
                            compact={viewMode === 'list'}
                            onEdit={(item) => {
                              setEditingItem(item)
                              setIsAddItemOpen(true)
                            }}
                            onDelete={handleDeleteItem}
                            onShare={handleShareItem}
                            onUpdateQuantity={handleUpdateQuantity}
                            onMarkPurchased={handleMarkPurchased}
                            onAddToCollection={handleAddToCollection}
                          />
                        ))}
                      </div>
                      <p className="text-center text-sm text-muted-foreground mt-6">
                        Showing {filteredItems.length} of {items.length} items
                      </p>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Feed Tab */}
            <TabsContent value="feed" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <SocialFeed
                  posts={feedPosts}
                  items={items}
                  collections={collections}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  onLikePost={handleLikePost}
                  onCommentPost={handleCommentPost}
                  onSharePost={handleSharePost}
                  onAddToCart={handleAddFromFeed}
                />
              </div>
            </TabsContent>

            {/* Friends Tab */}
            <TabsContent value="friends" className="mt-0">
              <div className="max-w-md mx-auto">
                <FriendsPanel
                  friends={friends}
                  onAddFriend={handleAddFriend}
                  onUpdateFriend={handleUpdateFriend}
                  onRemoveFriend={handleRemoveFriend}
                  onStartChat={handleStartChat}
                  onViewWishlist={handleViewWishlist}
                />
              </div>
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="mt-0">
              <div className="max-w-md mx-auto">
                <ChatPanel
                  friends={friends}
                  conversations={conversations}
                  messages={messages}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  items={items}
                  onSendMessage={handleSendMessage}
                  onStartConversation={handleStartConversation}
                  selectedFriend={selectedFriend}
                  onBack={() => setSelectedFriend(null)}
                />
              </div>
            </TabsContent>

            {/* Capture Tab */}
            <TabsContent value="capture" className="mt-0">
              <div className="max-w-lg mx-auto text-center py-8">
                <Lightning size={64} className="mx-auto mb-4 text-amber-500" />
                <h2 className="text-2xl font-bold mb-2">Quick Capture</h2>
                <p className="text-muted-foreground mb-6">
                  Snap photos or scan barcodes of items you find in real life
                </p>
                <Button size="lg" onClick={() => setIsQuickCaptureOpen(true)}>
                  <Camera size={20} className="mr-2" />
                  Start Capture
                </Button>

                {quickCaptures.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-medium mb-4">Recent Captures ({quickCaptures.length})</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quickCaptures.slice(0, 4).map(capture => (
                        <Card key={capture.id} className="text-left">
                          <CardContent className="p-3">
                            <p className="font-medium text-sm truncate">
                              {capture.productName || 'Unnamed'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {capture.storeName}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t mt-12 py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Logo size={32} animated={false} />
                <div className="text-sm text-muted-foreground">
                  Universal Cart • Shop anywhere, save everything
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setIsExtensionOpen(true)}>
                  <Browser size={16} className="mr-1" />
                  Browser Extension
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => setIsPanicDialogOpen(true)}
                >
                  <Warning size={16} className="mr-1" />
                  Danger Zone
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Dialogs */}
      <AddItemForm
        open={isAddItemOpen}
        onClose={() => {
          setIsAddItemOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSaveItem}
        editItem={editingItem}
      />

      <QuickCapture
        open={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onCapture={handleQuickCapture}
        onConvertToItem={handleConvertCapture}
        captures={quickCaptures}
      />

      <BrowserExtension
        open={isExtensionOpen}
        onClose={() => setIsExtensionOpen(false)}
      />

      <PanicWipeDialog
        open={isPanicDialogOpen}
        onClose={() => setIsPanicDialogOpen(false)}
        onConfirm={handlePanicWipe}
      />

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share size={20} />
              Share Item
            </DialogTitle>
            <DialogDescription>
              Share "{sharingItem?.name}" with friends
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {friends.filter(f => f.status === 'accepted').slice(0, 6).map(friend => (
                <Button
                  key={friend.id}
                  variant="outline"
                  className="flex-col h-auto py-3"
                  onClick={() => {
                    toast.success(`Shared with ${friend.displayName}!`)
                    setIsShareDialogOpen(false)
                  }}
                >
                  <Avatar className="h-10 w-10 mb-1">
                    <AvatarImage src={friend.avatarUrl} />
                    <AvatarFallback>{friend.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate w-full">{friend.displayName}</span>
                </Button>
              ))}
            </div>
            
            <Separator />
            
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(sharingItem?.productUrl || '')
                toast.success('Link copied!')
              }}
            >
              <Share size={16} className="mr-2" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default App
