import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Add more API routes here as needed
// app.use("/api/cards", cardRoutes);
// app.use("/api/transactions", transactionRoutes);

// Serve static files from dist
app.use(express.static('dist'))

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' })
  }
  res.sendFile(path.resolve('dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📦 Serving static files from dist/`)
  console.log(`🔌 API available at /api/*`)
})
