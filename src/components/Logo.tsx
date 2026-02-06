import { motion } from 'framer-motion'

interface LogoProps {
  size?: number
  animated?: boolean
}

export function Logo({ size = 48, animated = true }: LogoProps) {
  const portalVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: { scale: 1.08, rotate: 3 },
    tap: { scale: 0.95 },
  }

  const shimmerVariants = {
    initial: { opacity: 0.3, scale: 0.9 },
    animate: {
      opacity: [0.3, 1, 0.3],
      scale: [0.9, 1.05, 0.9],
      transition: {
        repeat: Infinity,
        duration: 2.4,
        ease: 'easeInOut' as const,
      },
    },
  }

  const wormholeRingVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 12,
        ease: 'linear' as const,
      },
    },
  }

  const innerRingVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: -360,
      transition: {
        repeat: Infinity,
        duration: 8,
        ease: 'linear' as const,
      },
    },
  }

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      variants={portalVariants}
      initial="initial"
      whileHover={animated ? 'hover' : undefined}
      whileTap={animated ? 'tap' : undefined}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Wormhole gradient - vivid multi-color */}
          <linearGradient id="wormholeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5A0" />
            <stop offset="30%" stopColor="#00D1FF" />
            <stop offset="60%" stopColor="#B47EFF" />
            <stop offset="100%" stopColor="#FF6BF5" />
          </linearGradient>
          {/* Inner ring gradient */}
          <linearGradient id="innerRingGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5DFEA0" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
          {/* Ghost body gradient - brighter, more personality */}
          <linearGradient id="ghostBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0FDF4" />
            <stop offset="40%" stopColor="#D1FAE5" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
          {/* Ghost glow */}
          <radialGradient id="ghostGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#5DFEA0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#5DFEA0" stopOpacity="0" />
          </radialGradient>
          {/* Wormhole center glow */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F5A0" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#B47EFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Center glow background */}
        <circle cx="24" cy="24" r="22" fill="url(#centerGlow)" />

        {/* Outer wormhole ring */}
        <motion.g
          variants={animated ? wormholeRingVariants : undefined}
          initial="initial"
          animate={animated ? 'animate' : undefined}
          style={{ transformOrigin: '24px 24px' }}
        >
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="url(#wormholeGrad)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="6 4"
            opacity="0.7"
          />
        </motion.g>

        {/* Inner portal ring */}
        <motion.g
          variants={animated ? innerRingVariants : undefined}
          initial="initial"
          animate={animated ? 'animate' : undefined}
          style={{ transformOrigin: '24px 24px' }}
        >
          <circle
            cx="24"
            cy="24"
            r="19"
            stroke="url(#innerRingGrad)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="3 5"
            opacity="0.5"
          />
        </motion.g>

        {/* Solid subtle ring */}
        <motion.circle
          cx="24"
          cy="24"
          r="21"
          stroke="url(#wormholeGrad)"
          strokeWidth="2"
          fill="none"
          variants={animated ? shimmerVariants : undefined}
          initial="initial"
          animate={animated ? 'animate' : undefined}
        />

        {/* Ghost body - more personality with wavy bottom */}
        <g filter="url(#glow)">
          {/* Ghost glow behind body */}
          <circle cx="24" cy="24" r="12" fill="url(#ghostGlow)" />

          {/* Ghost body - cute rounded shape with wavy feet */}
          <path
            d="M15 22C15 16.5 19 12 24 12C29 12 33 16.5 33 22V32C33 32 32 34 30.5 34C29 34 28.5 32.5 27 32.5C25.5 32.5 25 34 23.5 34C22 34 21.5 32.5 20 32.5C18.5 32.5 18 34 16.5 34C15 34 15 32 15 32V22Z"
            fill="url(#ghostBodyGrad)"
            stroke="white"
            strokeWidth="0.6"
            strokeOpacity="0.8"
          />

          {/* Ghost eyes - expressive */}
          <ellipse cx="20.5" cy="22" rx="2.2" ry="2.5" fill="#0B1B1F" />
          <ellipse cx="27.5" cy="22" rx="2.2" ry="2.5" fill="#0B1B1F" />

          {/* Eye highlights - gives life */}
          <circle cx="21.3" cy="21" r="0.8" fill="white" opacity="0.9" />
          <circle cx="28.3" cy="21" r="0.8" fill="white" opacity="0.9" />

          {/* Small smile */}
          <path
            d="M22 26.5C22 26.5 23 27.5 24 27.5C25 27.5 26 26.5 26 26.5"
            stroke="#0B1B1F"
            strokeWidth="0.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />

          {/* Blush marks */}
          <ellipse cx="18.5" cy="24.5" rx="1.5" ry="0.8" fill="#FFB3C7" opacity="0.3" />
          <ellipse cx="29.5" cy="24.5" rx="1.5" ry="0.8" fill="#FFB3C7" opacity="0.3" />
        </g>

        {/* Sparkle particles around the ghost */}
        <motion.circle
          cx="40"
          cy="9"
          r="1.8"
          fill="#5DFEA0"
          variants={animated ? shimmerVariants : undefined}
          initial="initial"
          animate={animated ? 'animate' : undefined}
        />
        <motion.circle
          cx="8"
          cy="38"
          r="1.5"
          fill="#38BDF8"
          variants={animated ? shimmerVariants : undefined}
          initial="initial"
          animate={animated ? 'animate' : undefined}
          style={{ animationDelay: '0.6s' }}
        />
        <motion.circle
          cx="42"
          cy="34"
          r="1.2"
          fill="#B47EFF"
          variants={animated ? shimmerVariants : undefined}
          initial="initial"
          animate={animated ? 'animate' : undefined}
          style={{ animationDelay: '1.2s' }}
        />
        <motion.circle
          cx="6"
          cy="14"
          r="1"
          fill="#FF6BF5"
          variants={animated ? shimmerVariants : undefined}
          initial="initial"
          animate={animated ? 'animate' : undefined}
          style={{ animationDelay: '0.8s' }}
        />
      </svg>

      {/* Outer animated ring pulse */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid',
            borderImage: 'linear-gradient(135deg, #00F5A0, #00D1FF, #B47EFF, #FF6BF5) 1',
            borderRadius: '50%',
            borderColor: 'oklch(0.72 0.22 160 / 0.3)',
          }}
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            ease: 'easeInOut',
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
          className="font-extrabold tracking-tight"
          style={{
            fontSize: size * 0.5,
            background: 'linear-gradient(135deg, #00F5A0 0%, #00D1FF 40%, #B47EFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ghost
        </span>
        <span
          className="font-bold tracking-tight text-foreground -mt-1.5"
          style={{ fontSize: size * 0.38 }}
        >
          Writer
        </span>
      </div>
    </div>
  )
}
