import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './Logo'
import { toast } from 'sonner'
import {
  X,
  Minimize2,
  Maximize2,
  HelpCircle,
  Keyboard,
  Sparkles,
  Database,
  ExternalLink,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface FloatingPortalProps {
  isActive: boolean
  onToggle: (active: boolean) => void
  onClose?: () => void
  position?: { x: number; y: number }
  onPositionChange?: (position: { x: number; y: number }) => void
  onOpenVault?: () => void
  /** Whether the portal is currently popped out into a separate window */
  isPoppedOut?: boolean
  /** Pop the portal out into a separate always-on-top window */
  onPopOut?: () => void
  /** Bring the portal back from the separate window */
  onPopIn?: () => void
}

export function FloatingPortal({
  isActive,
  onToggle,
  onClose,
  position: initialPosition,
  onPositionChange,
  onOpenVault,
  isPoppedOut = false,
  onPopOut,
  onPopIn,
}: FloatingPortalProps) {
  const isMobile = useIsMobile()
  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ghostwriter-portal-onboarding-seen') === 'true'
    }
    return false
  })
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding)
  const [position, setPosition] = useState(() => {
    if (initialPosition) return initialPosition
    // Try to load saved position from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ghostwriter-portal-position')
      if (saved) {
        try {
          return JSON.parse(saved) as { x: number; y: number }
        } catch {
          // Fall through to default
        }
      }
      const isMobileDevice = window.innerWidth < 768
      return {
        x: isMobileDevice ? window.innerWidth - 80 : window.innerWidth - 100,
        y: isMobileDevice ? window.innerHeight - 160 : 100,
      }
    }
    return { x: 0, y: 0 }
  })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const portalRef = useRef<HTMLDivElement>(null)
  const touchStartTime = useRef<number>(0)

  const handleToggle = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      if (e) {
        e.stopPropagation()
      }
      const next = !isActive
      onToggle(next)
      toast.success(
        next ? '👻 Portal opened — streaming live frames' : 'Portal closed — capture paused',
        { duration: 1500 }
      )
    },
    [isActive, onToggle]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true'

      if (isInputFocused) return

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        handleToggle()
      }

      if (!isMinimized && e.code.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 20 : 10
        const newPos = { ...position }

        switch (e.code) {
          case 'ArrowUp':
            newPos.y = Math.max(0, newPos.y - step)
            break
          case 'ArrowDown':
            newPos.y = Math.min(window.innerHeight - 80, newPos.y + step)
            break
          case 'ArrowLeft':
            newPos.x = Math.max(0, newPos.x - step)
            break
          case 'ArrowRight':
            newPos.x = Math.min(window.innerWidth - 80, newPos.x + step)
            break
        }

        setPosition(newPos)
      }

      if (e.code === 'Escape' && !isMinimized) {
        setIsMinimized(true)
        toast.info('Portal minimized', { duration: 1000 })
      }

      if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey) {
        setShowHelp(prev => !prev)
      }

      if (e.code === 'KeyV' && !e.ctrlKey && !e.metaKey && onOpenVault) {
        e.preventDefault()
        onOpenVault()
        toast.success('Opening vault...', { duration: 1500 })
      }

      // P for pop out
      if (e.code === 'KeyP' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        if (isPoppedOut && onPopIn) {
          onPopIn()
          toast.info('Portal returned', { duration: 1500 })
        } else if (onPopOut) {
          onPopOut()
          toast.success('Portal popped out!', { duration: 2000 })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isMinimized, onOpenVault, handleToggle, position, isPoppedOut, onPopIn, onPopOut])

  const dismissOnboarding = () => {
    setShowOnboarding(false)
    setHasSeenOnboarding(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ghostwriter-portal-onboarding-seen', 'true')
    }
  }

  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(position)
    }
    localStorage.setItem('ghostwriter-portal-position', JSON.stringify(position))
  }, [position, onPositionChange])

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    touchStartTime.current = Date.now()

    const target = e.target as HTMLElement
    if (target.closest('button')) return

    setIsDragging(true)
    const rect = portalRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
    }
    e.preventDefault()
  }

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const touch = e.touches[0]
      if (!touch) return
      const newX = touch.clientX - dragStart.x
      const newY = touch.clientY - dragStart.y

      const safeArea = isMobile ? 20 : 0
      const maxX = window.innerWidth - (isMinimized ? 60 : 80) - safeArea
      const maxY = window.innerHeight - (isMinimized ? 60 : 80) - safeArea

      setPosition({
        x: Math.max(safeArea, Math.min(newX, maxX)),
        y: Math.max(safeArea, Math.min(newY, maxY)),
      })
    },
    [isDragging, dragStart, isMobile, isMinimized]
  )

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.closest('button')) return

    setIsDragging(true)
    const rect = portalRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      const maxX = window.innerWidth - (isMinimized ? 60 : 80)
      const maxY = window.innerHeight - (isMinimized ? 60 : 80)

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    },
    [isDragging, dragStart, isMinimized]
  )

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (!isDragging) return undefined

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, handleMouseMove, handleTouchMove])

  const portalVariants = {
    inactive: {
      scale: 1,
      opacity: 0.7,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
    active: {
      scale: 1.05,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  } as const

  const pulseVariants = {
    inactive: {
      scale: [1, 1.05, 1],
      opacity: [0.3, 0.5, 0.3],
    },
    active: {
      scale: [1, 1.4, 1],
      opacity: [0.4, 0, 0.4],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut' as const,
      },
    },
  }

  // Wormhole ring animation
  const wormholeVariants = {
    inactive: { rotate: 0, scale: 1 },
    active: {
      rotate: 360,
      scale: [1, 1.08, 1],
      transition: {
        rotate: { repeat: Infinity, duration: 10, ease: 'linear' as const },
        scale: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' as const },
      },
    },
  }

  const logoSize = isMobile ? (isMinimized ? 48 : 56) : isMinimized ? 40 : 52
  const portalSize = isMobile ? 'p-3' : 'p-2'
  const buttonSize = isMobile ? 'p-2' : 'p-1.5'
  const iconSize = isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'

  return (
    <motion.div
      ref={portalRef}
      className={cn(
        'fixed z-[9999] select-none pointer-events-none',
        'flex flex-col items-center gap-2',
        isMobile ? 'cursor-grab active:cursor-grabbing' : 'cursor-move',
        isMobile && 'pb-safe-area-inset-bottom'
      )}
      style={{
        left: position.x,
        top: position.y,
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      drag={false}
      role="button"
      aria-label={isActive ? 'GhostWriter Portal - Active' : 'GhostWriter Portal - Inactive'}
      tabIndex={0}
      onFocus={() => !isMobile && setIsHovered(true)}
      onBlur={() => !isMobile && setIsHovered(false)}
    >
      {/* First-time onboarding */}
      <AnimatePresence>
        {showOnboarding && !isMinimized && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -top-28 w-64 z-[10000] pointer-events-auto"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="glass-strong rounded-xl p-4 shadow-2xl border border-emerald-500/30">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Welcome to the Wormhole!</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Click the ghost to toggle capture. Drag to move. Use &quot;Pop out&quot; (↗) to
                    float over other windows.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Keyboard className="h-3 w-3" />
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Space</kbd>{' '}
                      toggle,{' '}
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Arrows</kbd> move
                    </span>
                  </div>
                  <button
                    onClick={dismissOnboarding}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Got it!
                  </button>
                </div>
                <button
                  onClick={dismissOnboarding}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-border/30" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wormhole Portal Container */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'relative rounded-full pointer-events-auto',
              portalSize,
              'backdrop-blur-xl',
              isActive ? 'shadow-2xl brightness-110' : 'grayscale-[0.3] brightness-90',
              'transition-all duration-500',
              isMobile && 'min-w-[64px] min-h-[64px] flex items-center justify-center',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'
            )}
            style={{
              touchAction: 'none',
              background: isActive
                ? 'radial-gradient(circle at 50% 50%, oklch(0.15 0.04 260 / 0.95), oklch(0.08 0.03 260 / 0.9))'
                : 'oklch(0.12 0.02 260 / 0.85)',
              border: isActive
                ? '2px solid oklch(0.72 0.22 160 / 0.4)'
                : '2px solid oklch(0.30 0.02 260 / 0.5)',
              boxShadow: isActive
                ? '0 0 30px oklch(0.72 0.22 160 / 0.15), 0 0 60px oklch(0.62 0.25 300 / 0.08), inset 0 0 15px oklch(0.72 0.22 160 / 0.05)'
                : 'none',
            }}
            variants={portalVariants}
            animate={isActive ? 'active' : 'inactive'}
            whileHover={!isMobile ? { scale: 1.08 } : {}}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => !isMobile && setIsHovered(false)}
            onClick={e => {
              if (!isDragging) handleToggle(e)
            }}
            onTouchEnd={e => {
              if (!isDragging) handleToggle(e)
            }}
            role="button"
            aria-label={isActive ? 'Click to pause capture' : 'Click to start capture'}
            tabIndex={0}
          >
            {/* Wormhole pulsing ring */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute inset-[-4px] rounded-full"
                  style={{
                    border: '2px solid oklch(0.72 0.22 160 / 0.3)',
                  }}
                  variants={pulseVariants}
                  animate="active"
                  initial="inactive"
                  exit="inactive"
                />
              )}
            </AnimatePresence>

            {/* Secondary pulse ring */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute inset-[-8px] rounded-full"
                  style={{
                    border: '1px solid oklch(0.62 0.25 300 / 0.2)',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Rotating wormhole ring */}
            <motion.div
              className="absolute inset-[-2px] rounded-full"
              variants={wormholeVariants}
              animate={isActive ? 'active' : 'inactive'}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: '1.5px dashed oklch(0.72 0.22 160 / 0.25)',
                }}
              />
            </motion.div>

            {/* Logo */}
            <div className="relative z-10">
              <Logo size={logoSize} animated={isActive} />
            </div>

            {/* Status indicator */}
            <motion.div
              className={cn(
                'absolute -bottom-1 -right-1 rounded-full border-2',
                isMobile ? 'h-5 w-5' : 'h-4 w-4'
              )}
              style={{
                borderColor: 'oklch(0.08 0.03 260)',
                backgroundColor: isActive ? 'oklch(0.72 0.22 160)' : 'oklch(0.35 0.02 260)',
              }}
              animate={{
                scale: isActive ? [1, 1.2, 1] : 1,
                boxShadow: isActive ? '0 0 12px oklch(0.72 0.22 160 / 0.6)' : 'none',
              }}
              transition={{
                repeat: isActive ? Infinity : 0,
                duration: 1.5,
              }}
              aria-label={isActive ? 'Active' : 'Inactive'}
            />
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-semibold text-xs">
              {isActive ? 'Portal Active' : 'Portal Inactive'}
            </p>
            <p className="text-xs text-primary-foreground/80">
              {isActive ? 'Click to pause text capture' : 'Click to start capturing text'}
            </p>
            {!isMobile && (
              <div className="pt-1.5 border-t border-primary-foreground/10 space-y-1">
                <p className="text-xs text-primary-foreground/60 flex items-center gap-1.5">
                  <Keyboard className="h-3 w-3" />
                  <kbd className="px-1 py-0.5 bg-primary-foreground/10 rounded text-[10px]">
                    Space
                  </kbd>{' '}
                  to toggle
                </p>
                {onOpenVault && (
                  <p className="text-xs text-primary-foreground/60 flex items-center gap-1.5">
                    <Database className="h-3 w-3" />
                    <kbd className="px-1 py-0.5 bg-primary-foreground/10 rounded text-[10px]">
                      V
                    </kbd>{' '}
                    to open vault
                  </p>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Control buttons */}
      {!isMinimized && (isHovered || isMobile) && (
        <motion.div
          className={cn(
            'flex gap-1 rounded-xl backdrop-blur-xl border border-border/30 shadow-lg pointer-events-auto',
            isMobile ? 'p-1.5 gap-1.5' : 'p-1'
          )}
          style={{
            background: 'oklch(0.10 0.03 265 / 0.85)',
          }}
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={e => {
                  e.stopPropagation()
                  setIsMinimized(true)
                  toast.info('Portal minimized', { duration: 1000 })
                }}
                className={cn(
                  'rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                  buttonSize,
                  isMobile
                    ? 'active:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center'
                    : 'hover:bg-muted/50'
                )}
                aria-label="Minimize portal"
              >
                <Minimize2 className={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              <p className="text-xs">Minimize</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={e => {
                  e.stopPropagation()
                  setShowHelp(!showHelp)
                }}
                className={cn(
                  'rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                  buttonSize,
                  isMobile
                    ? 'active:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center'
                    : 'hover:bg-muted/50',
                  showHelp && 'bg-emerald-500/20 text-emerald-400'
                )}
                aria-label="Show help"
              >
                <HelpCircle className={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              <p className="text-xs">Help</p>
            </TooltipContent>
          </Tooltip>

          {onOpenVault && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onOpenVault()
                    toast.success('Opening vault...', { duration: 1500 })
                  }}
                  className={cn(
                    'rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                    buttonSize,
                    isMobile
                      ? 'active:bg-emerald-500/20 active:text-emerald-400 min-w-[44px] min-h-[44px] flex items-center justify-center'
                      : 'hover:bg-emerald-500/20 hover:text-emerald-400'
                  )}
                  aria-label="Open vault"
                >
                  <Database className={iconSize} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                <p className="text-xs">Open vault</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Pop Out / Pop In button */}
          {(onPopOut || onPopIn) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    if (isPoppedOut && onPopIn) {
                      onPopIn()
                      toast.info('Portal returned', { duration: 1500 })
                    } else if (onPopOut) {
                      onPopOut()
                      toast.success('Portal popped out — place it on any window!', {
                        duration: 2500,
                      })
                    }
                  }}
                  className={cn(
                    'rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
                    buttonSize,
                    isMobile
                      ? 'active:bg-purple-500/20 active:text-purple-400 min-w-[44px] min-h-[44px] flex items-center justify-center'
                      : 'hover:bg-purple-500/20 hover:text-purple-400',
                    isPoppedOut && 'bg-purple-500/20 text-purple-400'
                  )}
                  aria-label={
                    isPoppedOut ? 'Return portal to app' : 'Pop out portal onto other windows'
                  }
                >
                  {isPoppedOut ? (
                    <Undo2 className={iconSize} />
                  ) : (
                    <ExternalLink className={iconSize} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                <p className="text-xs">
                  {isPoppedOut ? 'Return to app' : 'Pop out (always on top)'}
                </p>
                {!isMobile && !isPoppedOut && (
                  <p className="text-xs text-primary-foreground/60 mt-0.5">
                    Place on top of other apps
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          )}

          {onClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onClose()
                  }}
                  className={cn(
                    'rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
                    buttonSize,
                    isMobile
                      ? 'active:bg-destructive/20 active:text-destructive min-w-[44px] min-h-[44px] flex items-center justify-center'
                      : 'hover:bg-destructive/20 hover:text-destructive'
                  )}
                  aria-label="Close portal"
                >
                  <X className={iconSize} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                <p className="text-xs">Close</p>
              </TooltipContent>
            </Tooltip>
          )}
        </motion.div>
      )}

      {/* Help panel */}
      <AnimatePresence>
        {showHelp && !isMinimized && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -top-44 w-72 z-[10000] pointer-events-auto"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="glass-strong rounded-xl p-4 shadow-2xl border border-emerald-500/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-emerald-400" />
                  Shortcuts
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close help"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Toggle capture', key: 'Space' },
                  { label: 'Move portal', key: '← → ↑ ↓' },
                  { label: 'Fast move', key: 'Shift + Arrows' },
                  { label: 'Minimize', key: 'Esc' },
                  { label: 'Show help', key: 'H' },
                  { label: 'Open vault', key: 'V' },
                  { label: 'Pop out / in', key: 'P' },
                ].map(shortcut => (
                  <div key={shortcut.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{shortcut.label}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-[10px] font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-border/30" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized restore button */}
      {isMinimized && (
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={e => {
                e.stopPropagation()
                setIsMinimized(false)
                toast.info('Portal restored', { duration: 1000 })
              }}
              className={cn(
                'rounded-full backdrop-blur-xl border border-border/30 shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isMobile
                  ? 'p-2 active:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center'
                  : 'p-1.5 hover:bg-muted/50'
              )}
              style={{ background: 'oklch(0.10 0.03 265 / 0.85)' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Restore portal"
            >
              <Maximize2 className={iconSize} />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={4}>
            <p className="text-xs">Restore</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Active status text */}
      <AnimatePresence>
        {isActive && !isMinimized && (isHovered || isMobile) && (
          <motion.div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 whitespace-nowrap',
              isMobile ? '-bottom-10' : '-bottom-8'
            )}
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <span
              className={cn(
                'font-medium rounded-lg border shadow-lg',
                isMobile ? 'text-xs px-3 py-1.5' : 'text-[10px] px-2 py-1'
              )}
              style={{
                color: 'oklch(0.72 0.22 160)',
                background: 'oklch(0.10 0.03 265 / 0.9)',
                borderColor: 'oklch(0.72 0.22 160 / 0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              Capturing text...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover hint when inactive */}
      <AnimatePresence>
        {!isActive && !isHovered && !isMobile && !isMinimized && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -bottom-8 whitespace-nowrap"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.5, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ delay: 1 }}
          >
            <span
              className="text-[10px] rounded-lg px-2 py-1 border shadow-sm"
              style={{
                color: 'oklch(0.50 0.02 260)',
                background: 'oklch(0.10 0.03 265 / 0.8)',
                borderColor: 'oklch(0.22 0.03 270 / 0.3)',
              }}
            >
              Hover to expand
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
