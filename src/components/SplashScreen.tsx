import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './Logo'

interface SplashScreenProps {
  onComplete: () => void
  minDuration?: number
}

const FADE_OUT_DURATION = 500

export function SplashScreen({ onComplete, minDuration = 2500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [showTagline, setShowTagline] = useState(false)

  useEffect(() => {
    // Show tagline after a short delay
    const taglineTimer = setTimeout(() => setShowTagline(true), 800)
    
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, FADE_OUT_DURATION)
    }, minDuration)

    return () => {
      clearTimeout(timer)
      clearTimeout(taglineTimer)
    }
  }, [onComplete, minDuration])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, oklch(0.12 0.02 280) 0%, oklch(0.16 0.03 290) 50%, oklch(0.14 0.04 300) 100%)'
          }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating orbs */}
            <motion.div
              className="absolute w-96 h-96 rounded-full blur-3xl"
              style={{ background: 'oklch(0.55 0.25 300 / 0.2)' }}
              animate={{
                x: ['-20%', '10%', '-20%'],
                y: ['-10%', '20%', '-10%'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute right-0 bottom-0 w-80 h-80 rounded-full blur-3xl"
              style={{ background: 'oklch(0.70 0.15 190 / 0.2)' }}
              animate={{
                x: ['20%', '-10%', '20%'],
                y: ['10%', '-20%', '10%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 w-64 h-64 rounded-full blur-3xl"
              style={{ background: 'oklch(0.65 0.22 330 / 0.15)' }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center space-y-8">
            {/* Animated Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 20,
                delay: 0.2
              }}
            >
              <Logo size={120} animated />
            </motion.div>
            
            {/* App Title */}
            <div className="text-center space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-5xl font-extrabold tracking-tight"
              >
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                  Universal
                </span>
                <span className="text-white ml-3">Cart</span>
              </motion.h1>
              
              <AnimatePresence>
                {showTagline && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-lg text-muted-foreground"
                  >
                    Shop anywhere. Save everything. Share with anyone.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="flex items-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <span>Any Store</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <span>Social</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <span>Secure</span>
              </div>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              className="flex space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, oklch(0.65 0.22 300), oklch(0.70 0.18 330))' }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Bottom gradient */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{
              background: 'linear-gradient(to top, oklch(0.10 0.02 280) 0%, transparent 100%)'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
