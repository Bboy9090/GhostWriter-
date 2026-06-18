/**
 * Entry point for the standalone portal page (portal.html).
 * This runs in a popout window (Document PiP, popup, or standalone PWA)
 * and communicates with the main GhostWriter app via BroadcastChannel.
 */

import { createRoot } from 'react-dom/client'
import { PortalStandalone } from './components/PortalStandalone'

import './main.css'
import './styles/theme.css'
import './styles/mobile-safe-areas.css'
import './index.css'

const rootElement = document.getElementById('portal-root')

if (rootElement) {
  createRoot(rootElement).render(<PortalStandalone />)
}
