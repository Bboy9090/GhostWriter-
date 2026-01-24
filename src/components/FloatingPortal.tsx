import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './Logo'
import { toast } from 'sonner'
import { X, Minimize2, Maximize2, HelpCircle, Keyboard, Sparkles, Database } from 'lucide-react'
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
}

export function FloatingPortal({
  isActive,
  onToggle: _onToggle,
  onClose,
  position: initialPosition,
  onPositionChange,
  onOpenVault
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
    // Mobile: bottom-right corner with safe area
    if (typeof window !== 'undefined') {
      const isMobileDevice = window.innerWidth < 768
      return {
        x: isMobileDevice ? window.innerWidth - 80 : window.innerWidth - 100,
        y: isMobileDevice ? window.innerHeight - 100 : 100
      }
    }
    return { x: 0, y: 0 }
  })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const portalRef = useRef<HTMLDivElement>(null)
  const touchStartTime = useRef<number>(0)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if portal is focused or no input is focused
      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === 'INPUT' ||
                            activeElement?.tagName === 'TEXTAREA' ||
                            activeElement?.getAttribute('contenteditable') === 'true'

      if (isInputFocused) return

      // Space to toggle
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        handleToggle()
      }

      // Arrow keys to move (when portal is visible)
      if (!isMinimized && (e.code.startsWith('Arrow'))) {
        e.preventDefault()
        const step = e.shiftKey ? 20 : 10 // Shift for larger steps
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
        toast.info('Portal moved', { duration: 1000 })
      }

      // Escape to minimize
      if (e.code === 'Escape' && !isMinimized) {
        setIsMinimized(true)
        toast.info('Portal minimized', { duration: 1000 })
      }

      // H for help
      if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey) {
        setShowHelp((prev) => !prev)
      }

      // V for vault/storage
      if (e.code === 'KeyV' && !e.ctrlKey && !e.metaKey && onOpenVault) {
        e.preventDefault()
        onOpenVault()
        toast.success('📦 Opening vault...', { duration: 1500 })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isMinimized, onOpenVault])

  // Dismiss onboarding
  const dismissOnboarding = () => {
    setShowOnboarding(false)
    setHasSeenOnboarding(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ghostwriter-portal-onboarding-seen', 'true')
    }
  }

  // Save position to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ghostwriter-portal-position')
    if (saved && !initialPosition) {
      try {
        const pos = JSON.parse(saved)
        setPosition(pos)
      } catch {
        // Ignore parse errors
      }
    }
  }, [initialPosition])

  // Update parent on position change
  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(position)
    }
    localStorage.setItem('ghostwriter-portal-position', JSON.stringify(position))
  }, [position, onPositionChange])

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartTime.current = Date.now()

    // Don't start drag if touching directly on logo SVG or buttons
    const target = e.target as HTMLElement
    if (target.closest('svg') || target.closest('button')) {
      return
    }

    setIsDragging(true)
    const rect = portalRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      })
    }
    e.preventDefault()
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    // Keep within viewport bounds with safe area for mobile
    const safeArea = isMobile ? 20 : 0
    const maxX = window.innerWidth - (isMinimized ? 60 : 80) - safeArea
    const maxY = window.innerHeight - (isMinimized ? 60 : 80) - safeArea

    setPosition({
      x: Math.max(safeArea, Math.min(newX, maxX)),
      y: Math.max(safeArea, Math.min(newY, maxY))
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left mouse button

    // Don't start drag if clicking directly on logo SVG
    const target = e.target as HTMLElement
    if (target.closest('svg') || target.closest('button')) {
      return
    }

    setIsDragging(true)
    const rect = portalRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Keep within viewport bounds
    const maxX = window.innerWidth - (isMinimized ? 60 : 80)
    const maxY = window.innerHeight - (isMinimized ? 60 : 80)

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Mouse and touch drag handlers
  useEffect(() => {
    if (isDragging) {
      const handleMouseMoveWrapper = (e: MouseEvent) => handleMouseMove(e)
      const handleTouchMoveWrapper = (e: TouchEvent) => handleTouchMove(e)

      window.addEventListener('mousemove', handleMouseMoveWrapper)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMoveWrapper, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)

      return () => {
        window.removeEventListener('mousemove', handleMouseMoveWrapper)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMoveWrapper)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, dragStart, isMobile, isMinimized])


  const portalVariants = {
    inactive: {
      scale: 1,
      opacity: 0.7,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    active: {
      scale: 1.1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  } as const

  const pulseVariants = {
    inactive: {
      scale: [1, 1.05, 1],
      opacity: [0.3, 0.5, 0.3]
    },
    active: {
      scale: [1, 1.3, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut'
      }
    }
  }

  const portalRingVariants = {
    inactive: {
      rotate: 0,
      scale: 1
    },
    active: {
      rotate: 360,
      scale: [1, 1.1, 1],
      transition: {
        rotate: {
          repeat: Infinity,
          duration: 8,
          ease: 'linear'
        },
        scale: {
          repeat: Infinity,
          duration: 2,
          ease: 'easeInOut'
        }
      }
    }
  }

  // Mobile-optimized sizes
  const logoSize = isMobile
    ? (isMinimized ? 48 : 64)
    : (isMinimized ? 40 : 56)
  const portalSize = isMobile ? 'p-3' : 'p-2'
  const buttonSize = isMobile ? 'p-2' : 'p-1.5'
  const iconSize = isMobile ? 'h-4 w-4' : 'h-3 w-3'

  return (
    <motion.div
        ref={portalRef}
        className={cn(
          'fixed z-[9999] select-none',
          'flex flex-col items-center gap-2',
          isMobile ? 'cursor-grab active:cursor-grabbing' : 'cursor-move',
          // Safe area for iPhone notch/home indicator
          isMobile && 'pb-safe-area-inset-bottom'
        )}
        style={{
          left: position.x,
          top: position.y,
          touchAction: 'none',
          // Prevent text selection on mobile
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        drag={false} // We handle dragging manually for better control
        role="button"
        aria-label={isActive ? 'GhostWriter Portal - Active (Click to pause)' : 'GhostWriter Portal - Inactive (Click to activate)'}
        tabIndex={0}
        onFocus={() => !isMobile && setIsHovered(true)}
        onBlur={() => !isMobile && setIsHovered(false)}
      >
      {/* First-time onboarding hint */}
      <AnimatePresence>
        {showOnboarding && !isMinimized && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -top-24 w-64 z-[10000]"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-2xl border-2 border-emerald-500/50">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Welcome to GhostWriter Portal! 👻</h3>
                  <p className="text-xs text-primary-foreground/80 mb-3">
                    Click the logo to start capturing text. Drag to move. Hover for controls.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-primary-foreground/70 mb-2">
                    <Keyboard className="h-3 w-3" />
                    <span>Press <kbd className="px-1.5 py-0.5 bg-background/20 rounded text-xs">Space</kbd> to toggle, <kbd className="px-1.5 py-0.5 bg-background/20 rounded text-xs">←→↑↓</kbd> to move</span>
                  </div>
                  <button
                    onClick={dismissOnboarding}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Got it! →
                  </button>
                </div>
                <button
                  onClick={dismissOnboarding}
                  className="text-primary-foreground/50 hover:text-primary-foreground transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Arrow pointing to portal */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portal Container */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'relative rounded-full',
              portalSize,
              'bg-background/90 backdrop-blur-md',
              'border-2 shadow-2xl',
              isActive
                ? 'border-emerald-500/50 shadow-emerald-500/20 brightness-110'
                : 'border-muted shadow-muted/20 grayscale-[0.5] brightness-90',
              'transition-all duration-300',
              // Larger touch target on mobile
              isMobile && 'min-w-[64px] min-h-[64px] flex items-center justify-center',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'
            )}
            variants={portalVariants}
            animate={isActive ? 'active' : 'inactive'}
            whileHover={!isMobile ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => !isMobile && setIsHovered(false)}
            onClick={(e) => {
              // Only toggle if not dragging
              if (!isDragging) {
                handleToggle(e)
              }
            }}
            onTouchEnd={(e) => {
              // Handle tap (not drag) on mobile
              if (!isDragging) {
                handleToggle(e)
              }
            }}
            role="button"
            aria-label={isActive ? 'Click to pause capture' : 'Click to start capture'}
            tabIndex={0}
          >
        {/* Pulsing ring when active */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
              variants={pulseVariants}
              animate="active"
              initial="inactive"
              exit="inactive"
            />
          )}
        </AnimatePresence>

        {/* Rotating portal ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          variants={portalRingVariants}
          animate={isActive ? 'active' : 'inactive'}
        >
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/30" />
        </motion.div>

        {/* Logo */}
        <div className="relative z-10">
          <Logo size={logoSize} animated={isActive} />
        </div>

        {/* Status indicator */}
        <motion.div
          className={cn(
            'absolute -bottom-1 -right-1 rounded-full border-2 border-background',
            isMobile ? 'h-5 w-5' : 'h-4 w-4',
            isActive ? 'bg-emerald-500' : 'bg-muted'
          )}
          animate={{
            scale: isActive ? [1, 1.2, 1] : 1,
            boxShadow: isActive
              ? '0 0 8px rgba(16, 185, 129, 0.6)'
              : 'none'
          }}
          transition={{
            repeat: isActive ? Infinity : 0,
            duration: 1.5
          }}
          aria-label={isActive ? 'Active' : 'Inactive'}
        />
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-semibold text-xs">
              {isActive ? '🟢 Portal Active' : '⚪ Portal Inactive'}
            </p>
            <p className="text-xs text-primary-foreground/80">
              {isActive
                ? 'Click to pause text capture'
                : 'Click to start capturing text from your screen'}
            </p>
            {!isMobile && (
              <div className="pt-1.5 border-t border-primary-foreground/10 space-y-1">
                <p className="text-xs text-primary-foreground/60 flex items-center gap-1.5">
                  <Keyboard className="h-3 w-3" />
                  <span><kbd className="px-1 py-0.5 bg-primary-foreground/10 rounded text-[10px]">Space</kbd> to toggle</span>
                </p>
                {onOpenVault && (
                  <p className="text-xs text-primary-foreground/60 flex items-center gap-1.5">
                    <Database className="h-3 w-3" />
                    <span><kbd className="px-1 py-0.5 bg-primary-foreground/10 rounded text-[10px]">V</kbd> to open vault</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Control buttons - show on hover or always on mobile */}
      {!isMinimized && (isHovered || isMobile) && (
        <motion.div
            className={cn(
              "flex gap-1 rounded-lg bg-background/90 backdrop-blur-md border border-border/50 shadow-lg",
              isMobile ? "p-1.5 gap-1.5" : "p-1"
            )}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMinimized(true)
                  toast.info('Portal minimized', { duration: 1000 })
                }}
                className={cn(
                  "rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
                  buttonSize,
                  isMobile ? "active:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center" : "hover:bg-muted"
                )}
                aria-label="Minimize portal"
              >
                <Minimize2 className={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              <p className="text-xs">Minimize portal</p>
              {!isMobile && <p className="text-xs text-primary-foreground/60 mt-0.5">Press <kbd className="px-1 py-0.5 bg-primary-foreground/10 rounded text-[10px]">Esc</kbd></p>}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowHelp(!showHelp)
                }}
                className={cn(
                  "rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
                  buttonSize,
                  isMobile ? "active:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center" : "hover:bg-muted",
                  showHelp && "bg-emerald-500/20 text-emerald-400"
                )}
                aria-label="Show help"
              >
                <HelpCircle className={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              <p className="text-xs">Help & shortcuts</p>
              {!isMobile && <p className="text-xs text-primary-foreground/60 mt-0.5">Press <kbd className="px-1 py-0.5 bg-primary-foreground/10 rounded text-[10px]">H</kbd></p>}
            </TooltipContent>
          </Tooltip>

          {/* Open Vault/Storage Button */}
          {onOpenVault && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenVault()
                    toast.success('📦 Opening vault...', { duration: 1500 })
                  }}
                  className={cn(
                    "rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
                    buttonSize,
                    isMobile ? "active:bg-emerald-500/20 active:text-emerald-400 min-w-[44px] min-h-[44px] flex items-center justify-center" : "hover:bg-emerald-500/20 hover:text-emerald-400"
                  )}
                  aria-label="Open vault"
                >
                  <Database className={iconSize} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                <p className="text-xs">Open vault</p>
                <p className="text-xs text-primary-foreground/60 mt-0.5">View all captured text</p>
                {!isMobile && <p className="text-xs text-primary-foreground/60 mt-0.5">Press <kbd className="px-1 py-0.5 bg-primary-foreground/10 rounded text-[10px]">V</kbd></p>}
              </TooltipContent>
            </Tooltip>
          )}

          {onClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  className={cn(
                    "rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-1",
                    buttonSize,
                    isMobile
                      ? "active:bg-destructive/20 active:text-destructive min-w-[44px] min-h-[44px] flex items-center justify-center"
                      : "hover:bg-destructive/20 hover:text-destructive"
                  )}
                  aria-label="Close portal"
                >
                  <X className={iconSize} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                <p className="text-xs">Close portal</p>
              </TooltipContent>
            </Tooltip>
          )}
        </motion.div>
      )}

      {/* Help panel */}
      <AnimatePresence>
        {showHelp && !isMinimized && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -top-40 w-72 z-[10000]"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-2xl border-2 border-emerald-500/50">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Keyboard Shortcuts
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-primary-foreground/50 hover:text-primary-foreground transition-colors"
                  aria-label="Close help"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-primary-foreground/80">Toggle capture</span>
                  <kbd className="px-2 py-1 bg-primary-foreground/10 rounded text-[10px] font-mono">Space</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-foreground/80">Move portal</span>
                  <kbd className="px-2 py-1 bg-primary-foreground/10 rounded text-[10px] font-mono">← → ↑ ↓</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-foreground/80">Fast move</span>
                  <kbd className="px-2 py-1 bg-primary-foreground/10 rounded text-[10px] font-mono">Shift + Arrows</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-foreground/80">Minimize</span>
                  <kbd className="px-2 py-1 bg-primary-foreground/10 rounded text-[10px] font-mono">Esc</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-foreground/80">Show help</span>
                  <kbd className="px-2 py-1 bg-primary-foreground/10 rounded text-[10px] font-mono">H</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-foreground/80">Open vault</span>
                  <kbd className="px-2 py-1 bg-primary-foreground/10 rounded text-[10px] font-mono">V</kbd>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-primary-foreground/10">
                <p className="text-xs text-primary-foreground/60">
                  💡 <strong>Tip:</strong> Click and drag to move, or hover for controls
                </p>
              </div>
            </div>
            {/* Arrow pointing to portal */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized restore button */}
      {isMinimized && (
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                setIsMinimized(false)
                toast.info('Portal restored', { duration: 1000 })
              }}
              className={cn(
                "rounded-full bg-background/90 backdrop-blur-md border border-border/50 shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
                isMobile
                  ? "p-2 active:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
                  : "p-1 hover:bg-muted"
              )}
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
            <p className="text-xs">Restore portal</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Status text - show on hover or when active on mobile */}
      <AnimatePresence>
        {isActive && !isMinimized && (isHovered || isMobile) && (
          <motion.div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 whitespace-nowrap",
              isMobile ? "-bottom-10" : "-bottom-8"
            )}
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <span className={cn(
              "font-medium text-emerald-400 bg-background/90 backdrop-blur-md rounded border border-emerald-500/30 shadow-lg",
              isMobile ? "text-sm px-3 py-1.5" : "text-xs px-2 py-1"
            )}>
              ✨ Capturing text...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover hint - show when inactive and not hovered */}
      <AnimatePresence>
        {!isActive && !isHovered && !isMobile && !isMinimized && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -bottom-8 whitespace-nowrap"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.6, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ delay: 1 }}
          >
            <span className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded px-2 py-1 border border-border/30 shadow-sm">
              👆 Hover to expand • Click to activate
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
