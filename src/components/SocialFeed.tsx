import { useState } from 'react'
import { FeedPost, FeedComment, CartItem, Collection } from '@/lib/types'
import { generateId, formatPrice } from '@/lib/storage'
import { Card, CardContent, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import {
  Heart, ChatCircle, Share, DotsThree, ShoppingBag,
  TrendDown, Package, Folder, ArrowSquareOut, Sparkle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface SocialFeedProps {
  posts: FeedPost[]
  items: CartItem[]
  collections: Collection[]
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  onLikePost: (postId: string) => void
  onCommentPost: (postId: string, comment: FeedComment) => void
  onSharePost: (post: FeedPost) => void
  onAddToCart: (item: CartItem) => void
}

const POST_TYPE_CONFIG = {
  wishlist_add: { icon: ShoppingBag, color: 'text-blue-500', label: 'added to wishlist' },
  price_drop: { icon: TrendDown, color: 'text-green-500', label: 'found a price drop' },
  purchased: { icon: Package, color: 'text-purple-500', label: 'purchased' },
  collection_created: { icon: Folder, color: 'text-amber-500', label: 'created a collection' },
  item_shared: { icon: Share, color: 'text-pink-500', label: 'shared an item' }
}

export function SocialFeed({
  posts,
  items,
  collections,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onLikePost,
  onCommentPost,
  onSharePost,
  onAddToCart
}: SocialFeedProps) {
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  const handleLike = (postId: string) => {
    onLikePost(postId)
  }

  const handleComment = (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return

    const comment: FeedComment = {
      id: generateId(),
      userId: currentUserId,
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      content,
      timestamp: Date.now(),
      likes: []
    }

    onCommentPost(postId, comment)
    setCommentInputs({ ...commentInputs, [postId]: '' })
    toast.success('Comment added!')
  }

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedComments(newExpanded)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (timestamp: number) => {
    // eslint-disable-next-line react-hooks/purity -- time-ago display
    const diff = Date.now() - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`
    return new Date(timestamp).toLocaleDateString()
  }

  const getItemForPost = (post: FeedPost) => {
    if (post.item) return post.item
    if (post.itemId) return items.find(i => i.id === post.itemId)
    return null
  }

  const getCollectionForPost = (post: FeedPost) => {
    if (post.collection) return post.collection
    if (post.collectionId) return collections.find(c => c.id === post.collectionId)
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkle size={24} weight="duotone" className="text-primary" />
          Activity Feed
        </h2>
        <Badge variant="outline" className="gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-4 pr-4">
          {posts.map(post => {
            const typeConfig = POST_TYPE_CONFIG[post.type]
            const TypeIcon = typeConfig.icon
            const postItem = getItemForPost(post)
            const postCollection = getCollectionForPost(post)
            const isLiked = post.likes.includes(currentUserId)
            const showComments = expandedComments.has(post.id)

            return (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.userAvatar} />
                      <AvatarFallback>{getInitials(post.userName)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{post.userName}</span>
                        <span className="text-muted-foreground text-sm">{typeConfig.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatTime(post.timestamp)}</p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <DotsThree size={18} weight="bold" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSharePost(post)}>
                          Share Post
                        </DropdownMenuItem>
                        <DropdownMenuItem>Hide Post</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Post content */}
                  {post.content && (
                    <p className="text-sm">{post.content}</p>
                  )}

                  {/* Item card */}
                  {postItem && (
                    <div className="rounded-xl overflow-hidden border bg-muted/30">
                      <div className="flex gap-3 p-3">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {postItem.imageUrl ? (
                            <img 
                              src={postItem.imageUrl} 
                              alt={postItem.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={32} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{postItem.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{postItem.storeName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-lg">
                              {formatPrice(postItem.price, postItem.currency)}
                            </span>
                            {post.type === 'price_drop' && postItem.originalPrice && (
                              <Badge className="bg-green-500 text-white">
                                {Math.round((1 - postItem.price / postItem.originalPrice) * 100)}% off
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t px-3 py-2 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="flex-1"
                          onClick={() => onAddToCart(postItem)}
                        >
                          <ShoppingBag size={14} className="mr-1" />
                          Add to Cart
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(postItem.productUrl, '_blank')}
                        >
                          <ArrowSquareOut size={14} />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Collection card */}
                  {postCollection && (
                    <div 
                      className="rounded-xl p-4 border flex items-center gap-3"
                      style={{ backgroundColor: postCollection.color + '10' }}
                    >
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: postCollection.color + '30' }}
                      >
                        {postCollection.emoji}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{postCollection.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {postCollection.itemCount} items
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                      }`}
                    >
                      <Heart size={20} weight={isLiked ? 'fill' : 'regular'} />
                      <span>{post.likes.length || ''}</span>
                    </button>
                    
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ChatCircle size={20} />
                      <span>{post.comments.length || ''}</span>
                    </button>
                    
                    <button
                      onClick={() => onSharePost(post)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Share size={20} />
                    </button>
                  </div>

                  {/* Comments section */}
                  {showComments && (
                    <div className="space-y-3 pt-3 border-t">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="flex gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(comment.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{comment.userName}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(comment.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm mt-0.5">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Comment input */}
                      <div className="flex gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={currentUserAvatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(currentUserName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({
                              ...commentInputs,
                              [post.id]: e.target.value
                            })}
                            placeholder="Write a comment..."
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleComment(post.id)
                              }
                            }}
                          />
                          <Button 
                            size="sm" 
                            className="h-8"
                            onClick={() => handleComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                          >
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {posts.length === 0 && (
            <Card className="py-12 text-center text-muted-foreground">
              <Sparkle size={48} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No activity yet</p>
              <p className="text-sm">Add items and connect with friends to see activity here!</p>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
