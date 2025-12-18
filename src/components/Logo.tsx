import { ShieldCheck } from '@phosphor-icons/react'

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 48, className = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Background gradient circle */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-accent via-primary to-secondary opacity-20 blur-xl"
          style={{ width: size * 1.5, height: size * 1.5, transform: 'translate(-25%, -25%)' }}
        />
        {/* Logo icon */}
        <div 
          className="relative rounded-xl bg-gradient-to-br from-accent to-primary text-primary-foreground shadow-lg flex items-center justify-center"
          style={{ width: size, height: size, padding: size * 0.15 }}
        >
          <ShieldCheck size={size * 0.7} weight="duotone" />
        </div>
      </div>
    </div>
  )
}
