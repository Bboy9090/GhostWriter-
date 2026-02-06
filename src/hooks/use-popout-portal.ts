import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isDocumentPipSupported,
  sendPortalMessage,
  onPortalMessage,
  getPortalUrl,
  type PortalState,
  type PortalMessage,
} from '@/lib/portal-channel'

/**
 * Declares the Document Picture-in-Picture API types
 * (not yet in TypeScript's built-in lib).
 */
interface DocumentPictureInPicture {
  requestWindow(options?: {
    width?: number
    height?: number
    disallowReturnToOpener?: boolean
  }): Promise<Window>
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture
  }
}

interface UsePopoutPortalOptions {
  /** Current portal state to sync to the popout */
  state: PortalState
  /** Called when the popout requests a portal toggle */
  onToggle: () => void
  /** Called when the popout requests opening the vault */
  onOpenVault: () => void
  /** Called when the popout requests vault lock/unlock toggle */
  onToggleVault: () => void
}

export function usePopoutPortal({
  state,
  onToggle,
  onOpenVault,
  onToggleVault,
}: UsePopoutPortalOptions) {
  const [isPoppedOut, setIsPoppedOut] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const pipWindowRef = useRef<Window | null>(null)

  // Listen for messages from popout window
  useEffect(() => {
    const unsubscribe = onPortalMessage((msg: PortalMessage) => {
      switch (msg.type) {
        case 'TOGGLE_PORTAL':
          onToggle()
          break
        case 'OPEN_VAULT':
          onOpenVault()
          break
        case 'TOGGLE_VAULT':
          onToggleVault()
          break
        case 'PORTAL_READY':
          // Send current state to the newly opened portal
          sendPortalMessage({ type: 'STATE_UPDATE', payload: state })
          break
        case 'PORTAL_CLOSED':
          setIsPoppedOut(false)
          popupRef.current = null
          pipWindowRef.current = null
          break
        case 'REQUEST_STATE':
          sendPortalMessage({ type: 'STATE_UPDATE', payload: state })
          break
      }
    })
    return unsubscribe
  }, [onToggle, onOpenVault, onToggleVault, state])

  // Sync state to popout whenever it changes
  useEffect(() => {
    if (isPoppedOut) {
      sendPortalMessage({ type: 'STATE_UPDATE', payload: state })
    }
  }, [state, isPoppedOut])

  // Check if the popup is still open
  useEffect(() => {
    if (!isPoppedOut) return undefined

    const interval = setInterval(() => {
      const popup = popupRef.current
      if (popup && popup.closed) {
        setIsPoppedOut(false)
        popupRef.current = null
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPoppedOut])

  /**
   * Pop the portal out into a Document Picture-in-Picture window
   * (always-on-top, stays above other apps on desktop).
   * Falls back to a regular popup window.
   */
  const popOut = useCallback(async () => {
    // If already popped out, focus the existing window
    if (isPoppedOut) {
      popupRef.current?.focus()
      pipWindowRef.current?.focus()
      return
    }

    // Strategy 1: Document Picture-in-Picture API (always-on-top)
    if (isDocumentPipSupported() && window.documentPictureInPicture) {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 320,
          height: 400,
          disallowReturnToOpener: false,
        })

        pipWindowRef.current = pipWindow

        // Copy stylesheets into the PiP window
        const allStyles = document.querySelectorAll('link[rel="stylesheet"], style')
        allStyles.forEach(styleEl => {
          pipWindow.document.head.appendChild(styleEl.cloneNode(true))
        })

        // Add base styles
        const baseStyle = pipWindow.document.createElement('style')
        baseStyle.textContent = `
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; overflow: hidden; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: oklch(0.08 0.03 260);
            color: oklch(0.95 0.01 200);
          }
        `
        pipWindow.document.head.appendChild(baseStyle)

        // Load fonts
        const fontLink = pipWindow.document.createElement('link')
        fontLink.rel = 'stylesheet'
        fontLink.href =
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
        pipWindow.document.head.appendChild(fontLink)

        // Create the root div
        const root = pipWindow.document.createElement('div')
        root.id = 'pip-portal-root'
        pipWindow.document.body.appendChild(root)

        // Load the standalone portal script
        const script = pipWindow.document.createElement('script')
        script.type = 'module'
        script.textContent = `
          import { createRoot } from 'react-dom/client';

          // Signal that the PiP portal is ready
          const channel = new BroadcastChannel('ghostwriter-portal');
          channel.postMessage({ type: 'PORTAL_READY' });

          // When the PiP window closes, notify the main window
          window.addEventListener('pagehide', () => {
            channel.postMessage({ type: 'PORTAL_CLOSED' });
            channel.close();
          });
        `
        pipWindow.document.body.appendChild(script)

        // Navigate to the standalone portal page instead
        // (cleaner approach - load it as a full page in the PiP window)
        pipWindow.location.href = getPortalUrl()

        pipWindow.addEventListener('pagehide', () => {
          setIsPoppedOut(false)
          pipWindowRef.current = null
        })

        setIsPoppedOut(true)
        return
      } catch (err) {
        console.warn('Document PiP failed, falling back to popup:', err)
      }
    }

    // Strategy 2: Regular popup window (works everywhere)
    const portalUrl = getPortalUrl()
    const width = 340
    const height = 500
    const left = window.screen.width - width - 40
    const top = 60

    const popup = window.open(
      portalUrl,
      'ghostwriter-portal',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`
    )

    if (popup) {
      popupRef.current = popup
      setIsPoppedOut(true)

      // Listen for the popup closing
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          setIsPoppedOut(false)
          popupRef.current = null
          sendPortalMessage({ type: 'PORTAL_CLOSED' })
        }
      }, 500)
    }
  }, [isPoppedOut])

  /**
   * Close the popped-out portal and bring it back inline.
   */
  const popIn = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    if (pipWindowRef.current) {
      try {
        // Document PiP windows can be closed via the document
        pipWindowRef.current.close()
      } catch {
        // Ignore
      }
    }
    popupRef.current = null
    pipWindowRef.current = null
    setIsPoppedOut(false)
  }, [])

  return {
    isPoppedOut,
    popOut,
    popIn,
    supportsDocumentPip: isDocumentPipSupported(),
  }
}
