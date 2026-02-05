import { motion } from 'framer-motion'

interface LogoProps {
  size?: number
  animated?: boolean
}

export function Logo({ size = 48, animated = true }: LogoProps) {
  const portalVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: { scale: 1.05, rotate: 2 },
    tap: { scale: 0.97 }
  }

  const shimmerVariants = {
    initial: { opacity: 0.2, scale: 0.9 },
    animate: {
      opacity: [0.2, 0.9, 0.2],
      scale: [0.9, 1.02, 0.9],
      transition: {
        repeat: Infinity,
        duration: 2.4,
        ease: 'easeInOut'
      }
    }
  }

  return (
    <motion.div 
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      variants={portalVariants}
      initial="initial"
      whileHover={animated ? "hover" : undefined}
      whileTap={animated ? "tap" : undefined}
    >
      {/* Main logo container */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="portalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5A0" />
            <stop offset="50%" stopColor="#00D1FF" />
            <stop offset="100%" stopColor="#3CFF9B" />
          </linearGradient>
          <linearGradient id="ghostGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Portal ring */}
        <motion.circle
          cx="24"
          cy="24"
          r="21"
          stroke="url(#portalGradient)"
          strokeWidth="2"
          fill="none"
          variants={animated ? shimmerVariants : undefined}
          initial="initial"
          animate={animated ? "animate" : undefined}
        />

        {/* Ghost icon */}
        <g filter="url(#glow)">
          <path
            d="M14 22C14 16.5 18.5 12 24 12C29.5 12 34 16.5 34 22V33.5C34 35.4 32.4 37 30.5 37C29.2 37 28.2 36.4 27.3 35.6C26.5 34.9 25.5 34.5 24.4 34.5C23.3 34.5 22.3 34.9 21.5 35.6C20.6 36.4 19.6 37 18.3 37C16.4 37 14.8 35.4 14.8 33.5V22H14Z"
            fill="url(#ghostGradient)"
            stroke="white"
            strokeWidth="0.8"
          />
          <circle cx="20" cy="23" r="2" fill="#0B1B1F" />
          <circle cx="28" cy="23" r="2" fill="#0B1B1F" />
        </g>

        <motion.circle
          cx="40"
          cy="10"
          r="1.8"
          fill="#5DFEA0"
          variants={animated ? shimmerVariants : undefined}
          initial="initial"
          animate={animated ? "animate" : undefined}
        />
        <motion.circle
          cx="10"
          cy="36"
          r="1.5"
          fill="#38BDF8"
          variants={animated ? shimmerVariants : undefined}
          initial="initial"
          animate={animated ? "animate" : undefined}
          style={{ animationDelay: '0.6s' }}
        />
      </svg>

      {/* Animated ring */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.div>
  )
}

// Wordmark logo variant
export function LogoWithText({ size = 48 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={size} />
      <div className="flex flex-col">
        <span 
          className="font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-lime-300 bg-clip-text text-transparent"
          style={{ fontSize: size * 0.5 }}
        >
          Ghost
        </span>
        <span 
          className="font-bold tracking-tight text-foreground -mt-1"
          style={{ fontSize: size * 0.4 }}
        >
          Writer
        </span>
      </div>
    </div>
  )
}
