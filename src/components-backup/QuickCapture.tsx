import { useState, useRef, useEffect, useCallback } from 'react'
import { QuickCapture as QuickCaptureType, StoreType, STORE_METADATA } from '@/lib/types'
import { generateId } from '@/lib/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent } from './ui/card'
import {
  Camera,
  Barcode,
  MapPin,
  CurrencyDollar,
  Upload,
  SpinnerGap,
  X,
  ShoppingBag,
  Storefront,
  Lightning,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface QuickCaptureProps {
  open: boolean
  onClose: () => void
  onCapture: (capture: QuickCaptureType) => void
  onConvertToItem: (capture: QuickCaptureType) => void
  captures: QuickCaptureType[]
}

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === 'undefined') return null
  const BD = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  return BD ?? null
}

export function QuickCapture({
  open,
  onClose,
  onCapture,
  onConvertToItem,
  captures,
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const barcodeScanningRef = useRef(false)
  const [hasStream, setHasStream] = useState(false)
  const [barcodeScanning, setBarcodeScanning] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    barcodeScanningRef.current = false
    setBarcodeScanning(false)
    setHasStream(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    if (!open) {
      stopCamera()
    }
    return () => stopCamera()
  }, [open, stopCamera])

  useEffect(() => {
    stopCamera()
  }, [mode, stopCamera])

  const resetForm = () => {
    stopCamera()
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

  const startCameraStream = async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera is not supported in this browser. Use Upload instead.')
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
        setHasStream(true)
      }
      return true
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Could not access camera. Check permissions or use Upload.'
      )
      return false
    }
  }

  /** Opens camera preview; call again after preview to grab a still into imagePreview. */
  const handleOpenCamera = async () => {
    setIsCapturing(true)
    try {
      await startCameraStream()
    } finally {
      setIsCapturing(false)
    }
  }

  const handleCaptureStill = () => {
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream || video.videoWidth < 2) {
      toast.error('Start the camera first and wait for the preview.')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error('Could not read camera frame.')
      return
    }
    ctx.drawImage(video, 0, 0)
    stopCamera()
    setImagePreview(canvas.toDataURL('image/jpeg', 0.92))
    toast.success('Photo captured')
  }

  const handleBarcodeScan = async () => {
    const BD = getBarcodeDetector()
    if (!BD) {
      toast.error(
        'BarcodeDetector is not available here (try Chrome with HTTPS, or enter the code manually).'
      )
      return
    }
    setIsCapturing(true)
    const ok = await startCameraStream()
    if (!ok) {
      setIsCapturing(false)
      return
    }
    setBarcodeScanning(true)

    const detector = new BD({
      formats: [
        'qr_code',
        'code_128',
        'code_39',
        'ean_13',
        'ean_8',
        'upc_a',
        'upc_e',
        'itf',
        'codabar',
      ],
    })

    barcodeScanningRef.current = true

    const tick = async () => {
      const video = videoRef.current
      if (!barcodeScanningRef.current) {
        return
      }
      if (!video || video.readyState < 2) {
        requestAnimationFrame(() => void tick())
        return
      }
      try {
        const codes = await detector.detect(video)
        const first = codes.find(c => c.rawValue?.trim())
        if (first?.rawValue) {
          barcodeScanningRef.current = false
          setBarcodeScanning(false)
          setBarcode(first.rawValue)
          stopCamera()
          setIsCapturing(false)
          toast.success('Barcode read')
          return
        }
      } catch {
        /* frame may fail intermittently */
      }
      if (barcodeScanningRef.current) {
        requestAnimationFrame(() => void tick())
      }
    }

    void tick()
  }

  const handleStopBarcodeScan = () => {
    barcodeScanningRef.current = false
    setBarcodeScanning(false)
    stopCamera()
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
      capturedAt: Date.now(),
    }

    onCapture(capture)
    toast.success('Item captured! You can convert it to a cart item later.')
    resetForm()
  }

  const handleConvert = (capture: QuickCaptureType) => {
    onConvertToItem(capture)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) {
          stopCamera()
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightning size={24} weight="duotone" className="text-amber-500" />
            Quick Capture
          </DialogTitle>
          <DialogDescription>
            Camera and barcode use your device APIs when supported; otherwise use upload or manual
            entry.
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
          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Captured" className="w-full h-full object-cover" />
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
                  <div className="relative w-full h-full flex flex-col items-stretch justify-center min-h-[180px]">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover bg-black"
                      playsInline
                      muted
                      autoPlay
                    />
                    {!hasStream && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-muted/90 pointer-events-none">
                        <Camera size={48} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 justify-center">
                      {!hasStream ? (
                        <Button
                          type="button"
                          className="pointer-events-auto"
                          onClick={() => void handleOpenCamera()}
                          disabled={isCapturing}
                        >
                          {isCapturing ? (
                            <SpinnerGap size={18} className="animate-spin mr-2" />
                          ) : (
                            <Camera size={18} className="mr-2" />
                          )}
                          Open camera
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            className="pointer-events-auto"
                            onClick={handleCaptureStill}
                          >
                            Capture photo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="pointer-events-auto"
                            onClick={stopCamera}
                          >
                            Stop camera
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="pointer-events-auto"
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
                      capture="environment"
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
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex flex-col min-h-[180px]">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover bg-black"
                  playsInline
                  muted
                  autoPlay
                />
                {!hasStream && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-4 bg-muted/80">
                    <Barcode size={48} className="text-muted-foreground" />
                    <p className="text-xs text-center text-muted-foreground px-2">
                      Point the camera at a barcode. Requires BarcodeDetector (e.g. Chrome). Or type
                      the code below.
                    </p>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-wrap gap-2 justify-center">
                  {hasStream && barcodeScanning ? (
                    <Button type="button" variant="outline" onClick={handleStopBarcodeScan}>
                      Stop scanning
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => void handleBarcodeScan()}
                      disabled={isCapturing}
                    >
                      {isCapturing ? (
                        <SpinnerGap size={18} className="animate-spin mr-2" />
                      ) : (
                        <Barcode size={18} className="mr-2" />
                      )}
                      Scan with camera
                    </Button>
                  )}
                </div>
              </div>

              {barcode ? (
                <div className="text-center rounded-lg border p-3">
                  <p className="font-mono text-lg font-bold">{barcode}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    onClick={() => setBarcode('')}
                  >
                    Clear
                  </Button>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Or enter barcode manually</Label>
                <Input
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
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
              onChange={e => setProductName(e.target.value)}
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
                onChange={e => setStoreName(e.target.value)}
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
                onChange={e => setEstimatedPrice(e.target.value)}
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
                onChange={e => setLocation(e.target.value)}
                placeholder="Aisle 5, shelf 3..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
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
                        {capture.storeName} •{' '}
                        {capture.estimatedPrice
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
