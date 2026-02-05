import { useState, useRef } from 'react'
import { QuickCapture as QuickCaptureType, CartItem, StoreType, STORE_METADATA } from '@/lib/types'
import { generateId } from '@/lib/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent } from './ui/card'
import {
  Camera, Barcode, MapPin, CurrencyDollar, 
  Image, Upload, SpinnerGap, X, ShoppingBag,
  Storefront, Lightning
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface QuickCaptureProps {
  open: boolean
  onClose: () => void
  onCapture: (capture: QuickCaptureType) => void
  onConvertToItem: (capture: QuickCaptureType) => void
  captures: QuickCaptureType[]
}

export function QuickCapture({ 
  open, 
  onClose, 
  onCapture, 
  onConvertToItem,
  captures 
}: QuickCaptureProps) {
  const [mode, setMode] = useState<'camera' | 'barcode' | 'manual'>('manual')
  const [isCapturing, setIsCapturing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [productName, setProductName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeType, setStoreType] = useState<StoreType>('local')
  const [location, setLocation] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [barcode, setBarcode] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setImagePreview(null)
    setProductName('')
    setStoreName('')
    setStoreType('local')
    setLocation('')
    setEstimatedPrice('')
    setNotes('')
    setBarcode('')
    setIsCapturing(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCapture = async () => {
    setIsCapturing(true)
    
    // Simulate camera capture
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In a real app, this would use the device camera
    toast.info('Camera capture simulated')
    setIsCapturing(false)
  }

  const handleBarcodeScан = async () => {
    setIsCapturing(true)
    
    // Simulate barcode scan
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock barcode
    const mockBarcode = Math.random().toString().slice(2, 14)
    setBarcode(mockBarcode)
    toast.success(`Barcode scanned: ${mockBarcode}`)
    setIsCapturing(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!productName.trim() && !barcode) {
      toast.error('Please enter a product name or scan a barcode')
      return
    }

    const capture: QuickCaptureType = {
      id: generateId(),
      imageUrl: imagePreview || undefined,
      barcode: barcode || undefined,
      productName: productName.trim(),
      storeName: storeName.trim() || STORE_METADATA[storeType].name,
      location: location.trim() || undefined,
      estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
      notes: notes.trim(),
      capturedAt: Date.now()
    }

    onCapture(capture)
    toast.success('Item captured! You can convert it to a cart item later.')
    resetForm()
  }

  const handleConvert = (capture: QuickCaptureType) => {
    onConvertToItem(capture)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightning size={24} weight="duotone" className="text-amber-500" />
            Quick Capture
          </DialogTitle>
          <DialogDescription>
            Snap photos or scan barcodes of items you find in real life
          </DialogDescription>
        </DialogHeader>

        {/* Mode selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => setMode('manual')}
            className="flex-col h-auto py-3"
          >
            <ShoppingBag size={24} />
            <span className="text-xs mt-1">Manual</span>
          </Button>
          <Button
            variant={mode === 'camera' ? 'default' : 'outline'}
            onClick={() => setMode('camera')}
            className="flex-col h-auto py-3"
          >
            <Camera size={24} />
            <span className="text-xs mt-1">Photo</span>
          </Button>
          <Button
            variant={mode === 'barcode' ? 'default' : 'outline'}
            onClick={() => setMode('barcode')}
            className="flex-col h-auto py-3"
          >
            <Barcode size={24} />
            <span className="text-xs mt-1">Scan</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Camera/Barcode section */}
          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="Captured" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setImagePreview(null)}
                    >
                      <X size={16} />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                    <Camera size={48} className="text-muted-foreground" />
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleCapture} disabled={isCapturing}>
                        {isCapturing ? (
                          <SpinnerGap size={18} className="animate-spin mr-2" />
                        ) : (
                          <Camera size={18} className="mr-2" />
                        )}
                        Take Photo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={18} className="mr-2" />
                        Upload
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'barcode' && (
            <div className="space-y-3">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden relative flex flex-col items-center justify-center gap-3">
                <Barcode size={64} className="text-muted-foreground" />
                {barcode ? (
                  <div className="text-center">
                    <p className="font-mono text-lg font-bold">{barcode}</p>
                    <p className="text-sm text-muted-foreground">Barcode scanned!</p>
                  </div>
                ) : (
                  <Button type="button" onClick={handleBarcodeScан} disabled={isCapturing}>
                    {isCapturing ? (
                      <SpinnerGap size={18} className="animate-spin mr-2" />
                    ) : (
                      <Barcode size={18} className="mr-2" />
                    )}
                    Scan Barcode
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Or enter barcode manually</Label>
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Enter barcode number..."
                />
              </div>
            </div>
          )}

          {/* Product details */}
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="What did you find?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Storefront size={14} />
                Store Type
              </Label>
              <Select value={storeType} onValueChange={(v: StoreType) => setStoreType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">📍 Local Store</SelectItem>
                  <SelectItem value="grocery">🛒 Grocery</SelectItem>
                  <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                  <SelectItem value="walmart">🏪 Walmart</SelectItem>
                  <SelectItem value="target">🎯 Target</SelectItem>
                  <SelectItem value="costco">🏬 Costco</SelectItem>
                  <SelectItem value="other">🛍️ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Store name..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <CurrencyDollar size={14} />
                Estimated Price
              </Label>
              <Input
                type="number"
                step="0.01"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin size={14} />
                Location
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Aisle 5, shelf 3..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Lightning size={18} className="mr-2" weight="fill" />
              Capture Item
            </Button>
          </div>
        </form>

        {/* Recent captures */}
        {captures.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Camera size={16} />
              Recent Captures ({captures.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {captures.slice(0, 5).map(capture => (
                <Card key={capture.id} className="overflow-hidden">
                  <CardContent className="p-3 flex items-center gap-3">
                    {capture.imageUrl ? (
                      <img 
                        src={capture.imageUrl} 
                        alt="" 
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {capture.productName || 'Unnamed item'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {capture.storeName} • {capture.estimatedPrice 
                          ? `~$${capture.estimatedPrice.toFixed(2)}` 
                          : 'No price'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConvert(capture)}
                      disabled={!!capture.convertedToItemId}
                    >
                      {capture.convertedToItemId ? 'Added' : 'Add to Cart'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
