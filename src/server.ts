/**
 * Serveur Express principal - API de justification de texte
 * Style personnel: architecture modulaire avec middleware compose
 */

import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { logger } from './core/logger.js'
import { authRoutes } from './modules/auth-endpoints.js'
import { justifyRoutes } from './modules/justify-endpoints.js'
import { specs as swaggerSpecs } from './config/swagger.js'

const app = express()
const port = process.env.PORT || 3003

// Middleware global
app.use(express.json({ limit: '10mb' }))
app.use(express.text({ 
  type: 'text/plain', 
  limit: '10mb' 
}))

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Tictactrip Justify API - Documentation',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true
  }
}))

// Logging middleware
app.use((req, _res, next) => {
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

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Monitoring]
 *     summary: Santé globale du service
 *     description: Retourne l'état général de l'API et ses métriques de performance
 *     responses:
 *       200:
 *         description: Service en bonne santé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
// Health check global
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'tictactrip-justify-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Redirection vers la documentation
app.get('/', (_req, res) => {
  res.redirect('/api-docs')
})

// Route 404
app.use((_req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api-docs - Documentation Swagger',
      'POST /api/token - Generate authentication token',
      'POST /api/justify - Justify text (requires auth)',
      'GET /health - Service health check'
    ]
  })
})

// Gestion d'erreurs globale
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', error)
  res.status(500).json({ error: 'Internal server error' })
})

// Démarrage du serveur
app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
  logger.info('Available endpoints:')
  logger.info('  GET  /api-docs - Swagger documentation')
  logger.info('  POST /api/token - Generate authentication token')
  logger.info('  POST /api/justify - Justify text (requires auth)')
  logger.info('  GET  /health - Service health check')
  logger.info(`Access the API documentation at: http://localhost:${port}/api-docs`)
})