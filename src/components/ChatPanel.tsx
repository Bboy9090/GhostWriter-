import { useState, useRef, useEffect } from 'react'
import { Friend, Message, Conversation, CartItem } from '@/lib/types'
import { generateId } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import {
  Chat, PaperPlaneTilt, ArrowLeft, Image, Link,
  Smiley, DotsThree, Package, Heart
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ChatPanelProps {
  friends: Friend[]
  conversations: Conversation[]
  messages: Message[]
  currentUserId: string
  currentUserName: string
  items: CartItem[]
  onSendMessage: (message: Message) => void
  onStartConversation: (friendId: string) => void
  selectedFriend?: Friend | null
  onBack?: () => void
}

export function ChatPanel({
  friends,
  conversations,
  messages,
  currentUserId,
  currentUserName,
  items,
  onSendMessage,
  onStartConversation,
  selectedFriend,
  onBack
}: ChatPanelProps) {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [showItemPicker, setShowItemPicker] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedFriend) {
      const existing = conversations.find(c => 
        c.participants.includes(selectedFriend.id) && !c.isGroup
      )
      if (existing) {
        setActiveConversation(existing)
      } else {
        // Create new conversation
        const newConv: Conversation = {
          id: generateId(),
          participants: [currentUserId, selectedFriend.id],
          participantNames: {
            [currentUserId]: currentUserName,
            [selectedFriend.id]: selectedFriend.displayName
          },
          participantAvatars: {
            [selectedFriend.id]: selectedFriend.avatarUrl || ''
          },
          unreadCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isGroup: false
        }
        setActiveConversation(newConv)
        onStartConversation(selectedFriend.id)
      }
    }
  }, [selectedFriend])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, activeConversation])

  const activeMessages = activeConversation 
    ? messages.filter(m => m.conversationId === activeConversation.id)
    : []

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !activeConversation) return

    const message: Message = {
      id: generateId(),
      conversationId: activeConversation.id,
      senderId: currentUserId,
      senderName: currentUserName,
      content: messageInput.trim(),
      timestamp: Date.now(),
      type: 'text',
      isRead: false
    }

    onSendMessage(message)
    setMessageInput('')
  }

  const handleShareItem = (item: CartItem) => {
    if (!activeConversation) return

    const message: Message = {
      id: generateId(),
      conversationId: activeConversation.id,
      senderId: currentUserId,
      senderName: currentUserName,
      content: `Check out this item: ${item.name}`,
      // eslint-disable-next-line react-hooks/purity -- event handler, not render
      timestamp: Date.now(),
      type: 'item_share',
      attachedItemId: item.id,
      isRead: false
    }

    onSendMessage(message)
    setShowItemPicker(false)
    toast.success('Item shared!')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: 'short' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const getOtherParticipant = (conv: Conversation) => {
    const otherId = conv.participants.find(p => p !== currentUserId) || ''
    return {
      name: conv.participantNames[otherId] || 'Unknown',
      avatar: conv.participantAvatars[otherId]
    }
  }

  // Conversation list view
  if (!activeConversation) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Chat size={20} weight="duotone" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="divide-y">
              {conversations.map(conv => {
                const other = getOtherParticipant(conv)
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={other.avatar} />
                      <AvatarFallback>{getInitials(other.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{other.name}</h4>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conv.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage?.content || 'Start a conversation'}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-primary">{conv.unreadCount}</Badge>
                    )}
                  </button>
                )
              })}

              {conversations.length === 0 && (
                <div className="text-center py-12 px-4 text-muted-foreground">
                  <Chat size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm">Start a conversation with a friend!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  // Active conversation view
  const otherParticipant = getOtherParticipant(activeConversation)

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3 border-b flex-row items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setActiveConversation(null)
            onBack?.()
          }}
        >
          <ArrowLeft size={20} />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherParticipant.avatar} />
          <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-medium">{otherParticipant.name}</h4>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>
        <Button variant="ghost" size="icon">
          <DotsThree size={20} weight="bold" />
        </Button>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {activeMessages.map(message => {
            const isOwn = message.senderId === currentUserId
            const sharedItem = message.attachedItemId 
              ? items.find(i => i.id === message.attachedItemId)
              : null

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                  {!isOwn && (
                    <Avatar className="h-6 w-6 mb-1">
                      <AvatarImage src={message.senderAvatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(message.senderName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    {message.type === 'item_share' && sharedItem ? (
                      <div className="space-y-2">
                        <p className="text-sm">{message.content}</p>
                        <div className="bg-background/20 rounded-lg p-2 flex items-center gap-2">
                          {sharedItem.imageUrl ? (
                            <img 
                              src={sharedItem.imageUrl} 
                              alt="" 
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <Package size={20} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{sharedItem.name}</p>
                            <p className="text-xs opacity-75">${sharedItem.price}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                  
                  <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}

          {activeMessages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Say hello! 👋</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Item picker */}
      {showItemPicker && (
        <div className="border-t p-3 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Share an item</span>
            <Button variant="ghost" size="sm" onClick={() => setShowItemPicker(false)}>
              Cancel
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {items.slice(0, 6).map(item => (
              <button
                key={item.id}
                onClick={() => handleShareItem(item)}
                className="aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 ring-primary transition-all"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={24} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowItemPicker(!showItemPicker)}
        >
          <Package size={20} />
        </Button>
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!messageInput.trim()}>
          <PaperPlaneTilt size={20} weight="fill" />
        </Button>
      </form>
    </Card>
  )
}
