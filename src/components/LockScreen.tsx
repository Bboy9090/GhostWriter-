import { useState, useEffect } from 'react'
import { Lock, LockOpen, Warning } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'
import { hashPin, storage, MAX_FAILED_ATTEMPTS } from '@/lib/storage'

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
      return
    }

    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers')
      return
    }

    if (pin !== confirmPin) {
      setError('PINs do not match')
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
      onUnlock()
    } else {
      const newFailedCount = settings.failedAttempts + 1
      await storage.saveFailedAttempts(newFailedCount)
      setFailedAttempts(newFailedCount)

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        setError('Too many failed attempts. Local data will now be wiped for security.')
        setTimeout(() => {
          onPanicWipe()
        }, 2000)
      } else {
        setError(`Incorrect PIN. ${MAX_FAILED_ATTEMPTS - newFailedCount} attempts remaining.`)
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
    <div className="fixed inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-2">
              {isSettingPin ? (
                <LockOpen size={40} className="text-accent" weight="duotone" />
              ) : (
                <Lock size={40} className="text-accent" weight="duotone" />
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isSettingPin ? 'Set Your PIN' : 'Card Command Center'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSettingPin
                ? 'Create a 4-8 digit PIN to secure your card metadata'
                : 'Enter your PIN to access your cards'}
            </p>
          </div>

          {error && (
            <Alert variant={failedAttempts >= MAX_FAILED_ATTEMPTS ? 'destructive' : 'default'} className={shake ? 'animate-shake' : ''}>
              <Warning size={18} weight="fill" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {failedAttempts > 0 && failedAttempts < MAX_FAILED_ATTEMPTS && !error && (
            <Alert>
              <Warning size={18} />
              <AlertDescription>
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
                className={`text-center text-2xl tracking-widest font-mono ${shake ? 'animate-shake' : ''}`}
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
                  className="text-center text-2xl tracking-widest font-mono"
                  disabled={isLoading}
                />
              </div>
            )}

            <Button
              onClick={isSettingPin ? handleSetPin : handleUnlock}
              className="w-full text-base font-semibold"
              size="lg"
              disabled={isLoading || (!isSettingPin && !pin) || (isSettingPin && (!pin || !confirmPin))}
            >
              {isLoading ? 'Processing...' : isSettingPin ? 'Set PIN & Unlock' : 'Unlock'}
            </Button>
          </div>

          {isSettingPin && (
            <Alert>
              <Warning size={18} />
              <AlertDescription className="text-xs">
                <strong>Important:</strong> Your PIN cannot be recovered. If you forget it, you'll need to perform a panic wipe to reset the app.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            Local-only security • No sensitive data stored
          </div>
        </div>
      </div>
    </div>
  )
}
