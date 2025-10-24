/**
 * Serveur Express principal - API de justification de texte
 * Style personnel: architecture modulaire avec middleware compose
 */

import express from 'express'
import { logger } from './core/logger.js'
import { authRoutes } from './modules/auth-endpoints.js'
import { justifyRoutes } from './modules/justify-endpoints.js'

const app = express()
const port = process.env.PORT || 6000

// Middleware global
app.use(express.json({ limit: '10mb' }))
app.use(express.text({ 
  type: 'text/plain', 
  limit: '10mb' 
}))

// Logging middleware
app.use((req, res, next) => {
  const requestId = `req-${Date.now()}`
  const contextLogger = logger
    .withRequestId(requestId)
    .withContext({ 
      method: req.method, 
      path: req.path,
      userAgent: req.get('User-Agent') || 'unknown'
    })
  
  contextLogger.info(`${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api', authRoutes)
app.use('/api', justifyRoutes)

// Health check global
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tictactrip-justify-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Route 404
app.use((_req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /api/token',
      'POST /api/justify',
      'GET /health'
    ]
  })
})

// Gestion d'erreurs globale
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', error)
  res.status(500).json({ error: 'Internal server error' })
})

// Démarrage du serveur
app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
  logger.info('Available endpoints:')
  logger.info('  POST /api/token - Generate authentication token')
  logger.info('  POST /api/justify - Justify text (requires auth)')
  logger.info('  GET /health - Service health check')
})