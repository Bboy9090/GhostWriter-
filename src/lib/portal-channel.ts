/**
 * BroadcastChannel-based communication between main app window
 * and the popped-out portal window (Document PiP, popup, or PWA).
 *
 * Messages flow both ways:
 *  - Main -> Portal: state updates (isActive, mode, etc.)
 *  - Portal -> Main: user actions (toggle, open vault, etc.)
 */

export type PortalMessage =
  | { type: 'STATE_UPDATE'; payload: PortalState }
  | { type: 'TOGGLE_PORTAL' }
  | { type: 'OPEN_VAULT' }
  | { type: 'TOGGLE_VAULT' }
  | { type: 'PORTAL_READY' }
  | { type: 'PORTAL_CLOSED' }
  | { type: 'REQUEST_STATE' }

export interface PortalState {
  isActive: boolean
  vaultUnlocked: boolean
}

const CHANNEL_NAME = 'ghostwriter-portal'

let channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
  return channel
}

export function sendPortalMessage(msg: PortalMessage): void {
  try {
    getChannel().postMessage(msg)
  } catch {
    // BroadcastChannel may not be available in all environments
  }
}

export function onPortalMessage(callback: (msg: PortalMessage) => void): () => void {
  const ch = getChannel()
  const handler = (event: MessageEvent<PortalMessage>) => {
    callback(event.data)
  }
  ch.addEventListener('message', handler)
  return () => {
    ch.removeEventListener('message', handler)
  }
}

export function closePortalChannel(): void {
  if (channel) {
    channel.close()
    channel = null
  }
}

/**
 * Check if the Document Picture-in-Picture API is available.
 * This gives us an always-on-top window natively.
 */
export function isDocumentPipSupported(): boolean {
  return 'documentPictureInPicture' in window
}

/**
 * Check if we're running inside a popout window
 * (either Document PiP or a regular popup).
 */
export function isPopoutWindow(): boolean {
  // Document PiP windows have this property
  if (window.location.pathname.includes('/portal')) return true
  // Popup windows opened by us get a name
  if (window.name === 'ghostwriter-portal') return true
  // Check if opened by another window
  if (window.opener) return true
  return false
}

/**
 * Build the standalone portal URL.
 */
export function getPortalUrl(): string {
  const base = window.location.origin
  return `${base}/portal.html`
}
