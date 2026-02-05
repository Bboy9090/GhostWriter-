import { useState, useEffect } from 'react'
import { Lock, LockOpen, Warning, ShoppingCart, Sparkle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'
import { Logo } from './Logo'
import { hashPin, storage, MAX_FAILED_ATTEMPTS } from '@/lib/storage'
import { soundSystem } from '@/lib/sounds'

interface LockScreenProps {
  onUnlock: () => void
  onPanicWipe: () => void
}

export function LockScreen({ onUnlock, onPanicWipe }: LockScreenProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isSettingPin, setIsSettingPin] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await storage.loadSettings()
      setFailedAttempts(settings.failedAttempts)
      
      if (!settings.pinHash) {
        setIsSettingPin(true)
      }
    }
    
    loadSettings()
  }, [])

  const handleSetPin = async () => {
    if (pin.length < 4 || pin.length > 8) {
      setError('PIN must be between 4-8 digits')
      soundSystem.playError()
      return
    }

    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers')
      soundSystem.playError()
      return
    }

    if (pin !== confirmPin) {
      setError('PINs do not match')
      soundSystem.playError()
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    setIsLoading(true)
    const hash = await hashPin(pin)
    await storage.savePinHash(hash)
    await storage.saveFailedAttempts(0)
    await storage.saveLastActivity(Date.now())
    setIsLoading(false)
    soundSystem.playUnlock()
    onUnlock()
  }

  const handleUnlock = async () => {
    if (!pin) {
      setError('Please enter your PIN')
      return
    }

    setIsLoading(true)
    const hash = await hashPin(pin)
    const settings = await storage.loadSettings()

    if (hash === settings.pinHash) {
      await storage.saveFailedAttempts(0)
      await storage.saveLastActivity(Date.now())
      setIsLoading(false)
      soundSystem.playUnlock()
      onUnlock()
    } else {
      const newFailedCount = settings.failedAttempts + 1
      await storage.saveFailedAttempts(newFailedCount)
      setFailedAttempts(newFailedCount)

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        setError('Too many failed attempts. Local data will now be wiped for security.')
        soundSystem.playError()
        setTimeout(() => {
          onPanicWipe()
        }, 2000)
      } else {
        setError(`Incorrect PIN. ${MAX_FAILED_ATTEMPTS - newFailedCount} attempts remaining.`)
        soundSystem.playError()
        setShake(true)
        setTimeout(() => setShake(false), 400)
      }
      
      setPin('')
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isSettingPin) {
        handleSetPin()
      } else {
        handleUnlock()
      }
    }
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, oklch(0.12 0.02 280) 0%, oklch(0.18 0.04 300) 50%, oklch(0.14 0.03 290) 100%)'
      }}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'oklch(0.55 0.25 300)', top: '-10%', left: '-10%' }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'oklch(0.70 0.15 190)', bottom: '-10%', right: '-10%' }}
          animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 space-y-6">
          <div className="text-center space-y-4">
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {isSettingPin ? (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <LockOpen size={40} className="text-purple-400" weight="duotone" />
                </div>
              ) : (
                <Logo size={80} />
              )}
            </motion.div>
            
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isSettingPin ? (
                  'Create Your PIN'
                ) : (
                  <span>
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">Universal</span>
                    {' '}
                    <span className="text-foreground">Cart</span>
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                {isSettingPin
                  ? 'Create a 4-8 digit PIN to secure your cart'
                  : 'Enter your PIN to access your cart'}
              </p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert 
                variant={failedAttempts >= MAX_FAILED_ATTEMPTS ? 'destructive' : 'default'} 
                className={shake ? 'animate-shake' : ''}
              >
                <Warning size={18} weight="fill" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {failedAttempts > 0 && failedAttempts < MAX_FAILED_ATTEMPTS && !error && (
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <Warning size={18} className="text-amber-500" />
              <AlertDescription className="text-amber-200">
                Warning: {failedAttempts} failed attempt{failedAttempts > 1 ? 's' : ''}. {MAX_FAILED_ATTEMPTS - failedAttempts} remaining before data wipe.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium">
                {isSettingPin ? 'Enter PIN (4-8 digits)' : 'PIN'}
              </label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
                onKeyPress={handleKeyPress}
                placeholder="••••"
                className={`text-center text-2xl tracking-widest font-mono h-14 bg-background/50 border-white/10 ${shake ? 'animate-shake' : ''}`}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {isSettingPin && (
              <div className="space-y-2">
                <label htmlFor="confirmPin" className="text-sm font-medium">
                  Confirm PIN
                </label>
                <Input
                  id="confirmPin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, ''))
                    setError('')
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest font-mono h-14 bg-background/50 border-white/10"
                  disabled={isLoading}
                />
              </div>
            )}

            <Button
              onClick={isSettingPin ? handleSetPin : handleUnlock}
              className="w-full text-base font-semibold h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              size="lg"
              disabled={isLoading || (!isSettingPin && !pin) || (isSettingPin && (!pin || !confirmPin))}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <ShoppingCart size={20} />
                </motion.div>
              ) : isSettingPin ? (
                <>
                  <Sparkle size={20} className="mr-2" weight="fill" />
                  Set PIN & Start Shopping
                </>
              ) : (
                <>
                  <Lock size={20} className="mr-2" weight="fill" />
                  Unlock Cart
                </>
              )}
            </Button>
          </div>

          {isSettingPin && (
            <Alert className="border-purple-500/30 bg-purple-500/10">
              <Warning size={18} className="text-purple-400" />
              <AlertDescription className="text-xs text-purple-200">
                <strong>Important:</strong> Your PIN cannot be recovered. If you forget it, you'll need to perform a panic wipe to reset the app.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-4">
              <span>🔒 PIN Protected</span>
              <span>☁️ Cloud Synced</span>
              <span>🌍 Universal</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
