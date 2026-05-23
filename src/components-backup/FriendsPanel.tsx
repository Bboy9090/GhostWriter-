import { useState } from 'react'
import { Friend } from '@/lib/types'
import { generateId } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Users,
  UserPlus,
  UserCircle,
  Chat,
  Share,
  Check,
  X,
  DotsThree,
  Clock,
  MagnifyingGlass,
  Bell,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface FriendsPanelProps {
  friends: Friend[]
  onAddFriend: (friend: Friend) => void
  onUpdateFriend: (id: string, updates: Partial<Friend>) => void
  onRemoveFriend: (id: string) => void
  onStartChat: (friend: Friend) => void
  onViewWishlist: (friend: Friend) => void
}

export function FriendsPanel({
  friends,
  onAddFriend,
  onUpdateFriend,
  onRemoveFriend,
  onStartChat,
  onViewWishlist,
}: FriendsPanelProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const pendingFriends = friends.filter(f => f.status === 'pending')

  const filteredFriends = (list: Friend[]) => {
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      f => f.displayName.toLowerCase().includes(q) || f.username.toLowerCase().includes(q)
    )
  }

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error('Please enter a username')
      return
    }

    setIsLoading(true)

    const newFriend: Friend = {
      id: generateId(),
      username: username.trim().toLowerCase(),
      displayName: username.trim(),
      status: 'pending',
      addedAt: Date.now(),
      sharedCollections: [],
    }

    onAddFriend(newFriend)
    toast.success(`Friend request sent to @${username}!`)
    setUsername('')
    setIsAddOpen(false)
    setIsLoading(false)
  }

  const handleAcceptRequest = (friend: Friend) => {
    onUpdateFriend(friend.id, { status: 'accepted' })
    toast.success(`You're now friends with ${friend.displayName}!`)
  }

  const handleDeclineRequest = (friend: Friend) => {
    onRemoveFriend(friend.id)
    toast.info('Friend request declined')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getLastActiveText = (lastActive?: number) => {
    if (!lastActive) return 'Never'
    // eslint-disable-next-line react-hooks/purity -- time-ago display
    const diff = Date.now() - lastActive
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users size={20} weight="duotone" />
              Friends
              {pendingFriends.length > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                >
                  {pendingFriends.length}
                </Badge>
              )}
            </CardTitle>
            <Button size="sm" onClick={() => setIsAddOpen(true)}>
              <UserPlus size={16} className="mr-1" />
              Add
            </Button>
          </div>

          <div className="relative mt-2">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-3">
              <TabsTrigger value="friends" className="gap-1">
                <Users size={14} />
                Friends ({acceptedFriends.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1">
                <Bell size={14} />
                Pending ({pendingFriends.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="mt-0">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-2">
                  {filteredFriends(acceptedFriends).map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(friend.displayName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{friend.displayName}</h4>
                          <span className="text-xs text-muted-foreground">@{friend.username}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              // eslint-disable-next-line react-hooks/purity -- last-active indicator needs current time
                              friend.lastActive && Date.now() - friend.lastActive < 300000
                                ? 'bg-green-500'
                                : 'bg-gray-400'
                            }`}
                          />
                          {getLastActiveText(friend.lastActive)}
                          {friend.mutualFriends && (
                            <>
                              <span>•</span>
                              <span>{friend.mutualFriends} mutual</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onStartChat(friend)}
                        >
                          <Chat size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onViewWishlist(friend)}
                        >
                          <Share size={16} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <DotsThree size={16} weight="bold" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewWishlist(friend)}>
                              View Wishlist
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStartChat(friend)}>
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onRemoveFriend(friend.id)}
                              className="text-destructive"
                            >
                              Remove Friend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}

                  {filteredFriends(acceptedFriends).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCircle size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {searchQuery ? 'No friends found' : 'No friends yet'}
                      </p>
                      <p className="text-xs">Add friends to share wishlists</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pending" className="mt-0">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-2">
                  {filteredFriends(pendingFriends).map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatarUrl} />
                        <AvatarFallback className="bg-amber-500/20 text-amber-600">
                          {getInitials(friend.displayName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{friend.displayName}</h4>
                          <Badge variant="outline" className="text-xs">
                            <Clock size={10} className="mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">@{friend.username}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 bg-green-500 hover:bg-green-600"
                          onClick={() => handleAcceptRequest(friend)}
                        >
                          <Check size={14} className="mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => handleDeclineRequest(friend)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {filteredFriends(pendingFriends).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pending requests</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Friend Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={24} weight="duotone" />
              Add Friend
            </DialogTitle>
            <DialogDescription>Send a friend request to share wishlists and chat</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFriend} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="username"
                  className="pl-8"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
