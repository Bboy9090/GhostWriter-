import { motion } from 'framer-motion'

interface LogoProps {
  size?: number
  animated?: boolean
  variant?: 'full' | 'icon'
}

export function Logo({ size = 48, animated = true, variant = 'icon' }: LogoProps) {
  const cartVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: -5 },
    tap: { scale: 0.95 }
  }

  const sparkleVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: { 
      opacity: [0, 1, 0], 
      scale: [0, 1, 0],
      transition: { 
        repeat: Infinity, 
        duration: 2,
        repeatDelay: 1
      }
    }
  }

  const globeVariants = {
    animate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 20,
        ease: 'linear'
      }
    }
  }

  return (
    <motion.div 
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      variants={cartVariants}
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
          <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Globe background */}
        <motion.g variants={animated ? globeVariants : undefined} animate={animated ? "animate" : undefined}>
          <circle cx="24" cy="24" r="22" stroke="url(#globeGradient)" strokeWidth="1.5" fill="none" opacity="0.3" />
          <ellipse cx="24" cy="24" rx="12" ry="22" stroke="url(#globeGradient)" strokeWidth="1" fill="none" opacity="0.2" />
          <ellipse cx="24" cy="24" rx="22" ry="12" stroke="url(#globeGradient)" strokeWidth="1" fill="none" opacity="0.2" />
        </motion.g>

        {/* Shopping cart icon */}
        <g filter="url(#glow)">
          {/* Cart body */}
          <path
            d="M12 16H38L35 28H15L12 16Z"
            fill="url(#cartGradient)"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          
          {/* Cart handle */}
          <path
            d="M12 16L10 12H6"
            stroke="url(#cartGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Cart wheels */}
          <circle cx="18" cy="34" r="3" fill="url(#cartGradient)" stroke="white" strokeWidth="1" />
          <circle cx="32" cy="34" r="3" fill="url(#cartGradient)" stroke="white" strokeWidth="1" />
          
          {/* Plus symbol in cart */}
          <path
            d="M25 19V25M22 22H28"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Sparkles */}
        <motion.circle 
          cx="8" cy="8" r="2" 
          fill="#F59E0B"
          variants={animated ? sparkleVariants : undefined}
          initial="initial"
          animate={animated ? "animate" : undefined}
        />
        <motion.circle 
          cx="40" cy="10" r="1.5" 
          fill="#EC4899"
          variants={animated ? sparkleVariants : undefined}
          initial="initial"
          animate={animated ? "animate" : undefined}
          style={{ animationDelay: '0.5s' }}
        />
        <motion.circle 
          cx="42" cy="38" r="1.5" 
          fill="#8B5CF6"
          variants={animated ? sparkleVariants : undefined}
          initial="initial"
          animate={animated ? "animate" : undefined}
          style={{ animationDelay: '1s' }}
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
          className="font-bold tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent"
          style={{ fontSize: size * 0.5 }}
        >
          Universal
        </span>
        <span 
          className="font-bold tracking-tight text-foreground -mt-1"
          style={{ fontSize: size * 0.4 }}
        >
          Cart
        </span>
      </div>
    </div>
  )
}
