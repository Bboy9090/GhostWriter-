import { createRoot } from 'react-dom/client'
import "@github/spark/spark"

import App from './App.tsx'

import "./main.css"
import "./styles/theme.css"
import "./styles/mobile-safe-areas.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <App />
)
