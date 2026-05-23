import { CartItem, STORE_METADATA, PRIORITY_CONFIG } from '@/lib/types'
import { formatPrice, calculateSavings } from '@/lib/storage'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Heart, Trash, Link, ShoppingCart, Share, Eye, 
  TrendDown, Tag, Plus, Minus, DotsThreeVertical,
  ArrowSquareOut, CheckCircle, Package
} from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface CartItemCardProps {
  item: CartItem
  onEdit: (item: CartItem) => void
  onDelete: (id: string) => void
  onShare: (item: CartItem) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onMarkPurchased: (id: string) => void
  onAddToCollection: (item: CartItem) => void
  compact?: boolean
}

export function CartItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  onShare, 
  onUpdateQuantity,
  onMarkPurchased,
  onAddToCollection,
  compact = false 
}: CartItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const storeMeta = STORE_METADATA[item.store]
  const priorityConfig = PRIORITY_CONFIG[item.priority]
  
  const hasPriceDrop = item.originalPrice && item.price < item.originalPrice
  const savings = hasPriceDrop ? calculateSavings(item.originalPrice!, item.price) : 0
  
  const handleOpenUrl = () => {
    window.open(item.productUrl, '_blank')
  }
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(item.productUrl)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:shadow-md transition-all">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {item.imageUrl && !imageError ? (
            <img 
              src={item.imageUrl} 
              alt={item.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {storeMeta.logo}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{item.name}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{storeMeta.logo} {item.storeName}</span>
            <span>•</span>
            <span className="font-semibold text-foreground">{formatPrice(item.price, item.currency)}</span>
          </div>
        </div>
        
        <Badge className={`${priorityConfig.color} text-white text-xs`}>
          {priorityConfig.emoji}
        </Badge>
      </div>
    )
  }

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        item.status === 'purchased' ? 'opacity-70' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Store color accent */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300"
        style={{ backgroundColor: storeMeta.color }}
      />
      
      {/* Price drop badge */}
      {hasPriceDrop && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-green-500 text-white animate-pulse">
            <TrendDown size={14} className="mr-1" />
            {savings}% OFF
          </Badge>
        </div>
      )}
      
      {/* Purchased overlay */}
      {item.status === 'purchased' && (
        <div className="absolute inset-0 bg-green-500/10 z-10 flex items-center justify-center">
          <Badge className="bg-green-500 text-white text-lg px-4 py-2">
            <CheckCircle size={20} className="mr-2" />
            Purchased!
          </Badge>
        </div>
      )}
      
      <CardContent className="p-0">
        {/* Image section */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
          {item.imageUrl && !imageError ? (
            <img 
              src={item.imageUrl} 
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">{storeMeta.logo}</span>
            </div>
          )}
          
          {/* Hover actions */}
          <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button size="sm" variant="secondary" onClick={handleOpenUrl}>
              <ArrowSquareOut size={16} className="mr-1" />
              View
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onShare(item)}>
              <Share size={16} className="mr-1" />
              Share
            </Button>
          </div>
          
          {/* Store badge */}
          <div className="absolute bottom-2 left-2">
            <Badge 
              className="bg-white/90 text-black border-0 shadow-md"
              style={{ borderLeft: `3px solid ${storeMeta.color}` }}
            >
              <span className="mr-1">{storeMeta.logo}</span>
              {item.storeName}
            </Badge>
          </div>
        </div>
        
        {/* Content section */}
        <div className="p-4 pl-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {item.description || item.category}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <DotsThreeVertical size={18} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Tag size={16} className="mr-2" />
                  Edit Item
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenUrl}>
                  <ArrowSquareOut size={16} className="mr-2" />
                  Open in Store
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link size={16} className="mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddToCollection(item)}>
                  <Package size={16} className="mr-2" />
                  Add to Collection
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onMarkPurchased(item.id)}>
                  <CheckCircle size={16} className="mr-2" />
                  Mark as Purchased
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(item)}>
                  <Share size={16} className="mr-2" />
                  Share with Friends
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(item.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash size={16} className="mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Price section */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatPrice(item.price, item.currency)}
              </span>
              {hasPriceDrop && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(item.originalPrice!, item.currency)}
                </span>
              )}
            </div>
            
            <Badge className={`${priorityConfig.color} text-white`}>
              {priorityConfig.emoji} {priorityConfig.label}
            </Badge>
          </div>
          
          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs capitalize">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {/* Notes */}
          {item.notes && (
            <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2 line-clamp-2">
              {item.notes}
            </p>
          )}
          
          {/* Quantity controls */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Qty:</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} />
                </Button>
                <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
            
            <span className="text-xs text-muted-foreground">
              Added {new Date(item.addedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
