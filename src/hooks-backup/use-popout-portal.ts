import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement } from 'react'
import {
  isDocumentPipSupported,
  sendPortalMessage,
  onPortalMessage,
  getPortalUrl,
  type PortalState,
  type PortalMessage,
} from '@/lib/portal-channel'
import { PortalStandalone } from '@/components/PortalStandalone'

/**
 * Document Picture-in-Picture API types
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
  const pipReactRootRef = useRef<Root | null>(null)

  // Listen for messages from popout window (popup fallback only)
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

  const cleanupPip = useCallback(() => {
    if (pipReactRootRef.current) {
      try {
        pipReactRootRef.current.unmount()
      } catch {
        // ignore
      }
      pipReactRootRef.current = null
    }
    pipWindowRef.current = null
    setIsPoppedOut(false)
  }, [])

  // Check if the popup/PiP is still open
  useEffect(() => {
    if (!isPoppedOut) return undefined

    const interval = setInterval(() => {
      const popup = popupRef.current
      if (popup && popup.closed) {
        setIsPoppedOut(false)
        popupRef.current = null
      }
      // Check PiP window too
      const pipWin = pipWindowRef.current
      if (pipWin) {
        try {
          if (pipWin.closed || !pipWin.document) {
            cleanupPip()
          }
        } catch {
          cleanupPip()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPoppedOut, cleanupPip])

  /**
   * Pop the portal out using Document Picture-in-Picture API.
   * This creates a TRUE always-on-top OS-level window.
   * Content is rendered directly into the PiP window's DOM.
   */
  const popOutViaPip = useCallback(async (): Promise<boolean> => {
    if (!isDocumentPipSupported() || !window.documentPictureInPicture) {
      return false
    }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 340,
        height: 460,
      })

      pipWindowRef.current = pipWindow

      // --- Build the PiP document ---

      // 1. Copy all stylesheets from the main window
      const allStyles = document.querySelectorAll('link[rel="stylesheet"], style')
      allStyles.forEach(node => {
        pipWindow.document.head.appendChild(node.cloneNode(true))
      })

      // 2. Add critical base styles
      const baseStyle = pipWindow.document.createElement('style')
      baseStyle.textContent = `
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body, #pip-root {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: oklch(0.08 0.03 260);
          color: oklch(0.95 0.01 200);
        }
      `
      pipWindow.document.head.appendChild(baseStyle)

      // 3. Load fonts
      const fontLink = pipWindow.document.createElement('link')
      fontLink.rel = 'stylesheet'
      fontLink.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
      pipWindow.document.head.appendChild(fontLink)

      // 4. Set title
      pipWindow.document.title = 'GhostWriter Portal'

      // 5. Create root container
      const rootEl = pipWindow.document.createElement('div')
      rootEl.id = 'pip-root'
      pipWindow.document.body.appendChild(rootEl)

      // 6. Mount React into the PiP window's DOM
      const reactRoot = createRoot(rootEl)
      pipReactRootRef.current = reactRoot
      reactRoot.render(createElement(PortalStandalone))

      // 7. Handle PiP window closing
      pipWindow.addEventListener('pagehide', () => {
        cleanupPip()
      })

      setIsPoppedOut(true)
      return true
    } catch (err) {
      console.warn('Document PiP failed:', err)
      return false
    }
  }, [cleanupPip])

  /**
   * Pop the portal out via a popup window (fallback).
   * This opens a separate browser window that users can manually
   * position over other apps.
   */
  const popOutViaPopup = useCallback(() => {
    const portalUrl = getPortalUrl()
    const width = 340
    const height = 500
    const left = window.screen.availWidth - width - 30
    const top = 50

    const popup = window.open(
      portalUrl,
      'ghostwriter-portal',
      [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        'menubar=no',
        'toolbar=no',
        'location=no',
        'status=no',
        'resizable=yes',
        'scrollbars=no',
      ].join(',')
    )

    if (popup) {
      popupRef.current = popup
      setIsPoppedOut(true)
      // Do not focus the popup so the user can stay in their target window and scroll/click there

      // Listen for the popup closing
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          setIsPoppedOut(false)
          popupRef.current = null
        }
      }, 500)
    }
  }, [])

  /**
   * Main popOut function: tries PiP first, falls back to popup.
   */
  const popOut = useCallback(async () => {
    // If already popped out, nothing to do (don't steal focus from the user's target window)
    if (isPoppedOut) return

    // Try Document PiP first (true always-on-top)
    const pipSuccess = await popOutViaPip()
    if (pipSuccess) return

    // Fallback: regular popup window
    popOutViaPopup()
  }, [isPoppedOut, popOutViaPip, popOutViaPopup])

  /**
   * Close the popped-out portal and bring it back inline.
   */
  const popIn = useCallback(() => {
    // Close PiP
    if (pipReactRootRef.current) {
      try {
        pipReactRootRef.current.unmount()
      } catch {
        // ignore
      }
      pipReactRootRef.current = null
    }
    if (pipWindowRef.current) {
      try {
        pipWindowRef.current.close()
      } catch {
        // ignore
      }
      pipWindowRef.current = null
    }

    // Close popup
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    popupRef.current = null

    setIsPoppedOut(false)
  }, [])

  return {
    isPoppedOut,
    popOut,
    popIn,
    supportsDocumentPip: isDocumentPipSupported(),
  }
}
