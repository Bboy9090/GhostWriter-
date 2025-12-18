// Sound system using Web Audio API for UI feedback
class SoundSystem {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext()
    }
  }

  private createOscillator(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.enabled) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    // Envelope for smooth sound
    const now = this.audioContext.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

    oscillator.start(now)
    oscillator.stop(now + duration)
  }

  // Unlock success sound - ascending two-tone
  playUnlock() {
    if (!this.audioContext) return
    
    this.createOscillator(523.25, 0.1, 'sine') // C5
    setTimeout(() => this.createOscillator(659.25, 0.15, 'sine'), 50) // E5
  }

  // Lock sound - descending tone
  playLock() {
    if (!this.audioContext) return
    
    this.createOscillator(659.25, 0.1, 'sine') // E5
    setTimeout(() => this.createOscillator(523.25, 0.15, 'sine'), 50) // C5
  }

  // Success sound - pleasant ascending progression
  playSuccess() {
    if (!this.audioContext) return
    
    this.createOscillator(523.25, 0.08, 'sine') // C5
    setTimeout(() => this.createOscillator(659.25, 0.08, 'sine'), 40) // E5
    setTimeout(() => this.createOscillator(783.99, 0.12, 'sine'), 80) // G5
  }

  // Error sound - dissonant low tone
  playError() {
    if (!this.audioContext) return
    
    this.createOscillator(220, 0.15, 'square')
    setTimeout(() => this.createOscillator(208, 0.2, 'square'), 50)
  }

  // Click sound - subtle tick
  playClick() {
    if (!this.audioContext) return
    
    this.createOscillator(800, 0.03, 'sine')
  }

  // Delete sound - whoosh down
  playDelete() {
    if (!this.audioContext) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    const now = this.audioContext.currentTime
    oscillator.frequency.setValueAtTime(600, now)
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.15)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    oscillator.start(now)
    oscillator.stop(now + 0.15)
  }

  // Notification sound - gentle bell
  playNotification() {
    if (!this.audioContext) return
    
    this.createOscillator(880, 0.1, 'sine') // A5
    setTimeout(() => this.createOscillator(1046.5, 0.15, 'sine'), 30) // C6
  }

  // Toggle sound on/off
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', enabled.toString())
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  // Load sound preference from localStorage
  loadPreference() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled')
      this.enabled = saved === null ? true : saved === 'true'
    }
  }
}

export const soundSystem = new SoundSystem()
soundSystem.loadPreference()
