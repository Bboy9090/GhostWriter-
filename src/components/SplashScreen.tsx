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
            background:
              'linear-gradient(135deg, oklch(0.07 0.04 260) 0%, oklch(0.09 0.05 280) 50%, oklch(0.08 0.04 300) 100%)',
          }}
        >
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-96 h-96 rounded-full blur-3xl"
              style={{ background: 'oklch(0.72 0.22 160 / 0.12)', top: '-10%', left: '-10%' }}
              animate={{
                x: ['-20%', '10%', '-20%'],
                y: ['-10%', '20%', '-10%'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute right-0 bottom-0 w-80 h-80 rounded-full blur-3xl"
              style={{ background: 'oklch(0.62 0.25 300 / 0.12)' }}
              animate={{
                x: ['20%', '-10%', '20%'],
                y: ['10%', '-20%', '10%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 w-64 h-64 rounded-full blur-3xl"
              style={{ background: 'oklch(0.75 0.18 195 / 0.10)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center space-y-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
                delay: 0.2,
              }}
            >
              <Logo size={120} animated />
            </motion.div>

            <div className="text-center space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-5xl font-extrabold tracking-tight"
              >
                <span
                  style={{
                    background: 'linear-gradient(135deg, #00F5A0 0%, #00D1FF 40%, #B47EFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Ghost
                </span>
                <span className="text-white ml-3">Writer</span>
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
                    Capture the thought. Leave no trace.
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
              {[
                { emoji: '👻', label: 'Portal' },
                { emoji: '🧠', label: 'Healer' },
                { emoji: '🗄️', label: 'Vault' },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className="w-1 h-1 bg-muted-foreground/30 rounded-full -ml-3 mr-1" />
                  )}
                  <span className="text-xl">{item.emoji}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              className="flex space-x-2"
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.72 0.22 ${160 + i * 40}), oklch(0.65 0.20 ${195 + i * 40}))`,
                  }}
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
              background: 'linear-gradient(to top, oklch(0.06 0.03 260) 0%, transparent 100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
