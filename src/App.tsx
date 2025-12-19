import { useState, useEffect, useMemo } from 'react'
import { Card as CardType, UsageEntry } from './lib/types'
import { storage, INACTIVITY_TIMEOUT } from './lib/storage'
import { offlineSyncManager } from './lib/offline-sync'
import { soundSystem } from './lib/sounds'
import { SplashScreen } from './components/SplashScreen'
import { LockScreen } from './components/LockScreen'
import { Logo } from './components/Logo'
import { CardItem } from './components/CardItem'
import { CardForm } from './components/CardForm'
import { PanicWipeDialog } from './components/PanicWipeDialog'
import { StatsDashboard } from './components/StatsDashboard'
import { UsageForm } from './components/UsageForm'
import { BackupManager } from './components/BackupManager'
import { CloudSyncStatus } from './components/CloudSyncStatus'
import { OfflineIndicator } from './components/OfflineIndicator'
import { BatchSyncControl } from './components/BatchSyncControl'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Alert, AlertDescription } from './components/ui/alert'
import { Separator } from './components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Toaster } from './components/ui/sonner'
import { 
  Lock, 
  LockOpen, 
  CreditCard, 
  MagnifyingGlass, 
  Funnel, 
  Plus, 
  Warning,
  ShieldCheck,
  Info,
  ChartLineUp,
  Receipt,
  Database,
  CloudCheck,
  SpeakerHigh,
  SpeakerSlash
} from '@phosphor-icons/react'
import { toast } from 'sonner'

type SortBy = 'label' | 'bank' | 'expiry'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [isLocked, setIsLocked] = useState(true)
  const [cards, setCards] = useState<CardType[]>([])
  const [usage, setUsage] = useState<UsageEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortBy>('label')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardType | null>(null)
  const [isPanicDialogOpen, setIsPanicDialogOpen] = useState(false)
  const [showDangerZone, setShowDangerZone] = useState(false)
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null)
  const [isUsageFormOpen, setIsUsageFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('cards')
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now())
  const [isOnline, setIsOnline] = useState(offlineSyncManager.getOnlineStatus())
  const [soundEnabled, setSoundEnabled] = useState(soundSystem.isEnabled())

  useEffect(() => {
    const unsubscribe = offlineSyncManager.onStatusChange((online) => {
      setIsOnline(online)
      if (online) {
        toast.info('Connection restored. Syncing changes...')
      } else {
        toast.info('You\'re offline. Changes will sync when reconnected.')
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      const loadedCards = await storage.loadCards()
      const loadedUsage = await storage.loadUsage()
      
      if (loadedCards.length === 0) {
        const sampleCards = await storage.resetToSampleData()
        setCards(sampleCards)
      } else {
        setCards(loadedCards)
      }
      
      setUsage(loadedUsage)
    }
    
    loadData()
  }, [])

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
      window.addEventListener('scroll', handleActivity)

      return () => {
        window.removeEventListener('mousemove', handleActivity)
        window.removeEventListener('keydown', handleActivity)
        window.removeEventListener('click', handleActivity)
        window.removeEventListener('scroll', handleActivity)
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

  const handleUnlock = () => {
    setIsLocked(false)
    soundSystem.playSuccess()
    toast.success('Welcome back! Vault unlocked.')
  }

  const handlePanicWipe = async () => {
    await storage.performPanicWipe()
    setCards([])
    setUsage([])
    setIsLocked(true)
    setIsPanicDialogOpen(false)
    toast.success('Local data wiped successfully.')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const handleSaveCard = async (card: CardType) => {
    let updatedCards: CardType[]
    
    if (editingCard) {
      updatedCards = cards.map(c => c.id === card.id ? card : c)
      soundSystem.playSuccess()
      toast.success('Card updated successfully')
    } else {
      updatedCards = [...cards, { ...card, createdAt: Date.now() }]
      soundSystem.playSuccess()
      toast.success('Card added successfully')
    }
    
    setCards(updatedCards)
    await storage.saveCards(updatedCards)
    setLastSyncTime(Date.now())
    setEditingCard(null)
  }

  const handleEditCard = (card: CardType) => {
    setEditingCard(card)
    setIsFormOpen(true)
  }

  const handleDeleteCard = async (id: string) => {
    const card = cards.find(c => c.id === id)
    if (!card) return

    if (confirm(`Delete "${card.label}"? This cannot be undone.`)) {
      const updatedCards = cards.filter(c => c.id !== id)
      setCards(updatedCards)
      await storage.saveCards(updatedCards)
      setLastSyncTime(Date.now())
      soundSystem.playDelete()
      toast.success('Card deleted')
    }
  }

  const handleSaveUsage = async (usageEntry: UsageEntry) => {
    const updatedUsage = [...usage, usageEntry]
    setUsage(updatedUsage)
    await storage.saveUsage(updatedUsage)
    setLastSyncTime(Date.now())
    soundSystem.playSuccess()
    toast.success('Transaction added successfully')
  }

  const handleImportData = async (importedCards: CardType[], importedUsage: UsageEntry[], merge: boolean) => {
    if (merge) {
      const existingCardIds = new Set(cards.map(c => c.id))
      const existingUsageIds = new Set(usage.map(u => u.id))
      
      const newCards = importedCards.filter(c => !existingCardIds.has(c.id))
      const newUsage = importedUsage.filter(u => !existingUsageIds.has(u.id))
      
      const mergedCards = [...cards, ...newCards]
      const mergedUsage = [...usage, ...newUsage]
      
      setCards(mergedCards)
      setUsage(mergedUsage)
      await storage.saveCards(mergedCards)
      await storage.saveUsage(mergedUsage)
      setLastSyncTime(Date.now())
    } else {
      setCards(importedCards)
      setUsage(importedUsage)
      await storage.saveCards(importedCards)
      await storage.saveUsage(importedUsage)
      setLastSyncTime(Date.now())
    }
  }

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    cards.forEach(card => card.usageTags.forEach(tag => tags.add(tag)))
    return Array.from(tags).sort()
  }, [cards])

  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards.filter(card => {
      const matchesSearch = 
        card.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.network.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.last4.includes(searchQuery) ||
        card.notes.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || card.status === statusFilter
      const matchesTag = tagFilter === 'all' || card.usageTags.includes(tagFilter)

      return matchesSearch && matchesStatus && matchesTag
    })

    filtered.sort((a, b) => {
      if (sortBy === 'label') {
        return a.label.localeCompare(b.label)
      } else if (sortBy === 'bank') {
        return a.bank.localeCompare(b.bank)
      } else if (sortBy === 'expiry') {
        const dateA = new Date(parseInt(a.expYear), parseInt(a.expMonth) - 1)
        const dateB = new Date(parseInt(b.expYear), parseInt(b.expMonth) - 1)
        return dateA.getTime() - dateB.getTime()
      }
      return 0
    })

    return filtered
  }, [cards, searchQuery, statusFilter, tagFilter, sortBy])

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

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Logo size={48} />
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Card Command Center</h1>
                <p className="text-muted-foreground text-sm">Secure metadata management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSound}
                title={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
              >
                {soundEnabled ? (
                  <SpeakerHigh size={20} weight="duotone" />
                ) : (
                  <SpeakerSlash size={20} weight="duotone" />
                )}
              </Button>
              <CloudSyncStatus lastSyncTime={lastSyncTime} />
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success border border-success/20">
                <LockOpen size={20} weight="duotone" />
                <span className="text-sm font-semibold">Unlocked</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLocked(true)
                  soundSystem.playLock()
                  toast.info('Vault locked')
                }}
              >
                <Lock size={18} className="mr-2" />
                Lock
              </Button>
            </div>
          </div>

          <Alert className="bg-accent/5 border-accent/20">
            <Info size={18} className="text-accent" />
            <AlertDescription className="text-sm">
              This tool only stores card metadata (no full numbers or CVVs). All data is automatically backed up to secure cloud storage and kept in sync across your devices.
            </AlertDescription>
          </Alert>

          <OfflineIndicator />
          
          <BatchSyncControl />
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="cards" className="gap-2">
              <CreditCard size={20} weight="duotone" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <ChartLineUp size={20} weight="duotone" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[250px] relative">
                  <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search cards by name, bank, network, last 4, or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus size={20} weight="bold" className="mr-2" />
                  Add Card
                </Button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Funnel size={18} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="frozen">Frozen</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag} className="capitalize">
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(val: SortBy) => setSortBy(val)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="label">Sort by Label (A-Z)</SelectItem>
                    <SelectItem value="bank">Sort by Bank</SelectItem>
                    <SelectItem value="expiry">Sort by Expiration</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery || statusFilter !== 'all' || tagFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setTagFilter('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {filteredAndSortedCards.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-4">
                  <CreditCard size={48} className="text-muted-foreground" weight="duotone" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  {cards.length === 0 ? 'No cards yet' : 'No cards found'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {cards.length === 0 
                    ? 'Add your first card to get started organizing your payment methods'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {cards.length === 0 && (
                  <Button onClick={() => setIsFormOpen(true)} size="lg">
                    <Plus size={20} weight="bold" className="mr-2" />
                    Add Your First Card
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {filteredAndSortedCards.map((card) => (
                    <CardItem
                      key={card.id}
                      card={card}
                      onEdit={handleEditCard}
                      onDelete={handleDeleteCard}
                    />
                  ))}
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Showing {filteredAndSortedCards.length} of {cards.length} cards
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Spending Insights</h2>
                <p className="text-sm text-muted-foreground">Track your card usage and spending patterns</p>
              </div>
              <Button onClick={() => setIsUsageFormOpen(true)}>
                <Receipt size={20} weight="bold" className="mr-2" />
                Add Transaction
              </Button>
            </div>

            <StatsDashboard cards={cards} usage={usage} />
          </TabsContent>
        </Tabs>

        <Separator className="my-12" />

        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Database size={24} weight="duotone" />
                  Data Management
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your data is automatically backed up to the cloud. Export to download a local copy.
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-card space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CloudCheck size={20} weight="duotone" className="text-success" />
                  Automatic Cloud Backup
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  All your cards and transactions are automatically saved to secure cloud storage. 
                  Your data syncs instantly whenever you make changes and is available across all your devices.
                </p>
                <Alert className="bg-success/5 border-success/20">
                  <Info size={18} className="text-success" />
                  <AlertDescription className="text-sm">
                    <strong>Cloud backup is active.</strong> Your data is encrypted and securely stored. 
                    No action needed - everything syncs automatically!
                  </AlertDescription>
                </Alert>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-2">Export Local Copy</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download a JSON file backup for offline storage or to import into another system.
                </p>
                <BackupManager 
                  cards={cards} 
                  usage={usage}
                  onImport={handleImportData}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Danger Zone</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDangerZone(!showDangerZone)}
              >
                {showDangerZone ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showDangerZone && (
              <div className="border border-destructive/20 rounded-lg p-6 bg-destructive/5">
                <div className="flex items-start gap-4">
                  <Warning size={24} className="text-destructive flex-shrink-0 mt-1" weight="fill" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Panic Wipe (Clear Local Data)</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently erase all locally stored card metadata and app settings from this browser. 
                      This action cannot be undone. Use this if you suspect your device has been compromised or 
                      you need to quickly destroy all stored information.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setIsPanicDialogOpen(true)}
                    >
                      <Warning size={18} weight="fill" className="mr-2" />
                      Panic Wipe
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingCard(null)
        }}
        onSave={handleSaveCard}
        editCard={editingCard}
      />

      <UsageForm
        open={isUsageFormOpen}
        onClose={() => setIsUsageFormOpen(false)}
        onSave={handleSaveUsage}
        cards={cards}
      />

      <PanicWipeDialog
        open={isPanicDialogOpen}
        onClose={() => setIsPanicDialogOpen(false)}
        onConfirm={handlePanicWipe}
      />
      </div>
    </>
  )
}

export default App