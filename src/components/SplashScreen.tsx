import { useEffect, useState } from 'react'
import { Logo } from './Logo'

interface SplashScreenProps {
  onComplete: () => void
  minDuration?: number
}

const FADE_OUT_DURATION = 500 // ms

export function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, FADE_OUT_DURATION) // Allow fade-out animation to complete
    }, minDuration)

    return () => clearTimeout(timer)
  }, [onComplete, minDuration])

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        {/* Animated Logo */}
        <div className="animate-pulse-slow">
          <Logo size={96} className="animate-scale-in" />
        </div>
        
        {/* App Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in-up">
            Card Command Center
          </h1>
          <p className="text-muted-foreground text-sm animate-fade-in-up animation-delay-200">
            Secure metadata management
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex space-x-2 animate-fade-in-up animation-delay-400">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce animation-delay-0" />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce animation-delay-150" />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce animation-delay-300" />
        </div>
      </div>
    </div>
  )
}
