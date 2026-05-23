import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Browser, Globe, CursorClick, ArrowSquareOut,
  Check, Copy, Code, Lightning, ShoppingCart, Sparkle,
  GoogleChromeLogo, AppleLogo, Globe as FirefoxIcon
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface BrowserExtensionProps {
  open: boolean
  onClose: () => void
}

export function BrowserExtension({ open, onClose }: BrowserExtensionProps) {
  const [copied, setCopied] = useState(false)

  const extensionCode = `// Universal Cart - Right-Click Extension
// Paste this in your browser console or use as bookmarklet

(function() {
  const selection = window.getSelection()?.toString() || '';
  const pageTitle = document.title;
  const pageUrl = window.location.href;
  
  // Try to get product info
  const price = document.querySelector('[class*="price"], [data-price]')?.textContent;
  const image = document.querySelector('meta[property="og:image"]')?.content 
    || document.querySelector('img[class*="product"]')?.src;
  
  const item = {
    name: selection || pageTitle,
    url: pageUrl,
    price: price,
    image: image,
    timestamp: Date.now()
  };
  
  // Open Universal Cart with item data
  const cartUrl = 'YOUR_UNIVERSAL_CART_URL?add=' + encodeURIComponent(JSON.stringify(item));
  window.open(cartUrl, '_blank');
})();`

  const bookmarklet = `javascript:(function(){const s=window.getSelection()?.toString()||'';const t=document.title;const u=window.location.href;const p=document.querySelector('[class*="price"]')?.textContent;const i=document.querySelector('meta[property="og:image"]')?.content;alert('Universal Cart\\n\\nItem: '+(s||t)+'\\nPrice: '+(p||'N/A')+'\\nURL: '+u);})();`

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Browser size={28} weight="duotone" className="text-primary" />
            Right-Click Anywhere
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-2">
              <Sparkle size={12} className="mr-1" />
              God Mode
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Add items to your Universal Cart from any website with a single right-click
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="extension" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="extension" className="gap-1">
              <Browser size={16} />
              Extension
            </TabsTrigger>
            <TabsTrigger value="bookmarklet" className="gap-1">
              <Lightning size={16} />
              Bookmarklet
            </TabsTrigger>
            <TabsTrigger value="howto" className="gap-1">
              <CursorClick size={16} />
              How It Works
            </TabsTrigger>
          </TabsList>

          <TabsContent value="extension" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card className="text-center p-4 hover:border-primary transition-colors cursor-pointer">
                <GoogleChromeLogo size={40} className="mx-auto mb-2 text-blue-500" weight="duotone" />
                <p className="font-medium text-sm">Chrome</p>
                <Badge variant="outline" className="mt-1 text-xs">Coming Soon</Badge>
              </Card>
              <Card className="text-center p-4 hover:border-primary transition-colors cursor-pointer">
                <FirefoxIcon size={40} className="mx-auto mb-2 text-orange-500" weight="duotone" />
                <p className="font-medium text-sm">Firefox</p>
                <Badge variant="outline" className="mt-1 text-xs">Coming Soon</Badge>
              </Card>
              <Card className="text-center p-4 hover:border-primary transition-colors cursor-pointer">
                <AppleLogo size={40} className="mx-auto mb-2" weight="duotone" />
                <p className="font-medium text-sm">Safari</p>
                <Badge variant="outline" className="mt-1 text-xs">Coming Soon</Badge>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Browser Extension Features</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-green-500" />
                        Right-click any product to add to cart
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-green-500" />
                        Auto-detect product name, price, and image
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-green-500" />
                        Works on Amazon, Walmart, Target, and 1000+ stores
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-green-500" />
                        Price drop notifications
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-green-500" />
                        Quick share to friends
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Get notified when the extension launches
              </p>
              <Button variant="outline">
                <Sparkle size={16} className="mr-2" />
                Join Waitlist
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bookmarklet" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Lightning size={18} className="text-amber-500" />
                  Quick Bookmarklet
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag this button to your bookmarks bar. Click it on any product page to capture the item!
                </p>
                
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-dashed border-primary/30">
                  <Button 
                    className="bg-gradient-to-r from-primary to-purple-600 text-white cursor-grab"
                    draggable
                  >
                    <ShoppingCart size={18} className="mr-2" />
                    + Universal Cart
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    ← Drag this to your bookmarks bar
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Code size={18} />
                    Manual Installation
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(bookmarklet)}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-3 font-mono text-xs overflow-x-auto">
                  <code className="break-all">{bookmarklet}</code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  1. Copy the code above<br/>
                  2. Create a new bookmark<br/>
                  3. Paste the code as the URL
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Code size={18} />
                    Developer Console Code
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(extensionCode)}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3 font-mono text-xs text-green-400 overflow-x-auto max-h-48">
                  <pre>{extensionCode}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="howto" className="space-y-4">
            <div className="grid gap-4">
              {[
                {
                  step: 1,
                  title: 'Browse Any Store',
                  description: 'Visit any online store - Amazon, Target, Nike, local boutiques, anywhere!',
                  icon: Globe
                },
                {
                  step: 2,
                  title: 'Right-Click the Product',
                  description: 'Right-click on any product image or title. Select "Add to Universal Cart"',
                  icon: CursorClick
                },
                {
                  step: 3,
                  title: 'Auto-Detect Details',
                  description: 'We automatically capture the product name, price, image, and store info',
                  icon: Sparkle
                },
                {
                  step: 4,
                  title: 'Organize & Share',
                  description: 'Add to collections, set priorities, share with friends, track prices!',
                  icon: ShoppingCart
                }
              ].map(item => (
                <Card key={item.step}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        <item.icon size={18} className="text-primary" />
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
              <CardContent className="p-4 text-center">
                <Sparkle size={32} className="mx-auto mb-2 text-primary" weight="duotone" />
                <h4 className="font-medium">Works With 1000+ Stores</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Amazon, Walmart, Target, Best Buy, Nike, Adidas, Etsy, eBay, and any store on the web!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
