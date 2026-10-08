import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import "./main.css"
import "./styles/theme.css"
import "./styles/mobile-safe-areas.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <App />
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('GhostWriter offline worker could not start', error)
    })
  })
}
