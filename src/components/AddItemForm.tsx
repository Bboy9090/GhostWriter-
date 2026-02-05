import { useState, useEffect } from 'react'
import { CartItem, StoreType, Priority, STORE_METADATA, ITEM_CATEGORIES, PRIORITY_CONFIG } from '@/lib/types'
import { generateId, detectStore } from '@/lib/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { 
  Link, Package, Tag, CurrencyDollar, Image, 
  MagicWand, SpinnerGap, X, Plus, ShoppingBag
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AddItemFormProps {
  open: boolean
  onClose: () => void
  onSave: (item: CartItem) => void
  editItem?: CartItem | null
  initialUrl?: string
}

export function AddItemForm({ open, onClose, onSave, editItem, initialUrl }: AddItemFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [imageUrl, setImageUrl] = useState('')
  const [store, setStore] = useState<StoreType>('other')
  const [storeName, setStoreName] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<Priority>('want')
  const [notes, setNotes] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (editItem) {
      setUrl(editItem.productUrl)
      setName(editItem.name)
      setDescription(editItem.description)
      setPrice(editItem.price.toString())
      setOriginalPrice(editItem.originalPrice?.toString() || '')
      setCurrency(editItem.currency)
      setImageUrl(editItem.imageUrl || '')
      setStore(editItem.store)
      setStoreName(editItem.storeName)
      setCategory(editItem.category)
      setPriority(editItem.priority)
      setNotes(editItem.notes)
      setTags(editItem.tags)
      setQuantity(editItem.quantity)
    } else if (initialUrl) {
      setUrl(initialUrl)
      handleUrlParse(initialUrl)
    } else {
      resetForm()
    }
  }, [editItem, initialUrl, open])

  const resetForm = () => {
    setUrl('')
    setName('')
    setDescription('')
    setPrice('')
    setOriginalPrice('')
    setCurrency('USD')
    setImageUrl('')
    setStore('other')
    setStoreName('')
    setCategory('')
    setPriority('want')
    setNotes('')
    setTags([])
    setTagInput('')
    setQuantity(1)
  }

  const handleUrlParse = async (inputUrl: string) => {
    if (!inputUrl) return
    
    setIsLoading(true)
    try {
      const { store: detectedStore, storeName: detectedStoreName } = detectStore(inputUrl)
      setStore(detectedStore)
      setStoreName(detectedStoreName)
      
      // Simulate URL parsing (in a real app, this would call a backend service)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success(`Detected store: ${detectedStoreName}`)
    } catch (error) {
      console.error('Failed to parse URL:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (value.startsWith('http')) {
      handleUrlParse(value)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter an item name')
      return
    }
    
    if (!price || isNaN(parseFloat(price))) {
      toast.error('Please enter a valid price')
      return
    }

    const item: CartItem = {
      id: editItem?.id || generateId(),
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      currency,
      imageUrl: imageUrl.trim() || undefined,
      productUrl: url.trim(),
      store,
      storeName: storeName || STORE_METADATA[store].name,
      category: category || 'Other',
      tags,
      priority,
      status: editItem?.status || 'active',
      quantity,
      notes: notes.trim(),
      priceHistory: editItem?.priceHistory || [],
      addedAt: editItem?.addedAt || Date.now(),
      updatedAt: Date.now(),
      addedFrom: editItem?.addedFrom || 'manual',
      collectionIds: editItem?.collectionIds || []
    }

    onSave(item)
    onClose()
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag size={24} weight="duotone" className="text-primary" />
            {editItem ? 'Edit Item' : 'Add to Universal Cart'}
          </DialogTitle>
          <DialogDescription>
            {editItem 
              ? 'Update the details of this item in your cart'
              : 'Add any product from any store to your universal wishlist'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Link size={16} />
              Product URL
            </Label>
            <div className="relative">
              <Input
                id="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://amazon.com/product/..."
                className="pr-12"
              />
              {isLoading && (
                <SpinnerGap size={20} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {store !== 'other' && (
              <Badge 
                className="mt-1"
                style={{ backgroundColor: STORE_METADATA[store].color, color: 'white' }}
              >
                {STORE_METADATA[store].logo} {storeName}
              </Badge>
            )}
          </div>

          {/* Name and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Package size={16} />
                Item Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sony WH-1000XM5 Headphones"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the item..."
              rows={2}
            />
          </div>

          {/* Price section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <CurrencyDollar size={16} />
                Price *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.99"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="129.99"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <Image size={16} />
              Image URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1"
              />
              {imageUrl && (
                <div className="w-12 h-10 rounded border overflow-hidden flex-shrink-0">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Store selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Store</Label>
              <Select value={store} onValueChange={(v: StoreType) => {
                setStore(v)
                setStoreName(STORE_METADATA[v].name)
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STORE_METADATA).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.logo} {meta.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v: Priority) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.emoji} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag size={16} />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Plus size={16} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <MagicWand size={18} weight="duotone" />
              {editItem ? 'Save Changes' : 'Add to Cart'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
