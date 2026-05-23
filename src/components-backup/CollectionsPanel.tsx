import { useState } from 'react'
import { Collection, CartItem } from '@/lib/types'
import { generateId } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import {
  FolderPlus, Folder, Globe, Lock, Users, Trash,
  PencilSimple, Eye, Share, Plus, Package, ArrowRight
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CollectionsPanelProps {
  collections: Collection[]
  items: CartItem[]
  onCreateCollection: (collection: Collection) => void
  onUpdateCollection: (id: string, updates: Partial<Collection>) => void
  onDeleteCollection: (id: string) => void
  onSelectCollection: (collection: Collection | null) => void
  selectedCollectionId: string | null
}

const EMOJI_OPTIONS = ['📦', '💻', '👟', '🏠', '🎁', '✨', '🎮', '📚', '🎨', '🍔', '✈️', '💪', '🌟', '❤️', '🔥']
const COLOR_OPTIONS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#6366F1']

export function CollectionsPanel({
  collections,
  items,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onSelectCollection,
  selectedCollectionId
}: CollectionsPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('📦')
  const [color, setColor] = useState('#3B82F6')
  const [isPublic, setIsPublic] = useState(false)

  const resetForm = () => {
    setName('')
    setDescription('')
    setEmoji('📦')
    setColor('#3B82F6')
    setIsPublic(false)
    setEditingCollection(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCollection(collection)
    setName(collection.name)
    setDescription(collection.description)
    setEmoji(collection.emoji)
    setColor(collection.color)
    setIsPublic(collection.isPublic)
    setIsCreateOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter a collection name')
      return
    }

    if (editingCollection) {
      onUpdateCollection(editingCollection.id, {
        name: name.trim(),
        description: description.trim(),
        emoji,
        color,
        isPublic
      })
      toast.success('Collection updated!')
    } else {
      const newCollection: Collection = {
        id: generateId(),
        name: name.trim(),
        description: description.trim(),
        emoji,
        color,
        isPublic,
        sharedWith: [],
        itemCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      onCreateCollection(newCollection)
      toast.success('Collection created!')
    }

    setIsCreateOpen(false)
    resetForm()
  }

  const handleDelete = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete "${collection.name}"? Items won't be deleted.`)) {
      onDeleteCollection(collection.id)
      if (selectedCollectionId === collection.id) {
        onSelectCollection(null)
      }
      toast.success('Collection deleted')
    }
  }

  const getItemCount = (collectionId: string) => {
    return items.filter(item => item.collectionIds.includes(collectionId)).length
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder size={20} weight="duotone" />
              Collections
            </CardTitle>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus size={16} className="mr-1" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2">
              {/* All Items option */}
              <button
                onClick={() => onSelectCollection(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                  selectedCollectionId === null
                    ? 'bg-primary/10 border-primary border'
                    : 'bg-muted/50 hover:bg-muted border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white">
                  <Package size={20} weight="bold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">All Items</h4>
                  <p className="text-xs text-muted-foreground">{items.length} items</p>
                </div>
              </button>

              {/* Collections list */}
              {collections.map(collection => (
                <button
                  key={collection.id}
                  onClick={() => onSelectCollection(collection)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group ${
                    selectedCollectionId === collection.id
                      ? 'bg-primary/10 border-primary border'
                      : 'bg-muted/50 hover:bg-muted border border-transparent'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: collection.color + '20' }}
                  >
                    {collection.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{collection.name}</h4>
                      {collection.isPublic ? (
                        <Globe size={12} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Lock size={12} className="text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{getItemCount(collection.id)} items</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleOpenEdit(collection, e)}
                    >
                      <PencilSimple size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={(e) => handleDelete(collection, e)}
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                </button>
              ))}

              {collections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No collections yet</p>
                  <p className="text-xs">Create one to organize your items</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false)
          resetForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus size={24} weight="duotone" />
              {editingCollection ? 'Edit Collection' : 'Create Collection'}
            </DialogTitle>
            <DialogDescription>
              Organize your items into collections for easy access
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Collection Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Wishlist"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this collection for?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-1">
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-8 h-8 rounded text-lg hover:bg-muted transition-colors ${
                        emoji === e ? 'bg-primary/20 ring-2 ring-primary' : ''
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-1">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded transition-all ${
                        color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                <div>
                  <Label className="font-medium">Public Collection</Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublic ? 'Anyone with the link can view' : 'Only you can see this'}
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCollection ? 'Save Changes' : 'Create Collection'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
