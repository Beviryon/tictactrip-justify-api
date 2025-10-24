/**
 * Auth Endpoints - Gestion des tokens d'authentification
 * Style personnel: validation rigoureuse avec patterns fonctionnels
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { Pipeline } from '../core/pipeline.js'
import { Validator } from '../core/validation.js'
import { logger } from '../core/logger.js'
import { TokenGenerator } from '../auth/token-generator.js'
import { TokenStore } from '../auth/token-store.js'
import type { Result } from '../types/index.js'

// Instance globale du store de tokens
const tokenStore = new TokenStore()

// Validation des donnees d'entree
const emailValidator = Validator.create<string>()
  .required('Email is required')
  .email('Invalid email format')
  .maxLength(100, 'Email too long')
  .maxLength(100, 'Email too long')

interface TokenRequest {
  email: string
}

/**
 * @swagger
 * /api/token:
 *   post:
 *     tags: [Authentication]
 *     summary: Génère un token d'authentification
 *     description: |
 *       Génère un token unique et sécurisé pour l'authentification.
 *       Le token est valide pendant 24h et permet d'accéder à l'endpoint /api/justify.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenRequest'
 *           examples:
 *             exemple_basic:
 *               summary: Exemple de base
 *               value:
 *                 email: "user@example.com"
 *             exemple_tictactrip:
 *               summary: Exemple Tictactrip
 *               value:
 *                 email: "test@tictactrip.eu"
 *     responses:
 *       200:
 *         description: Token généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *             examples:
 *               success:
 *                 summary: Token généré
 *                 value:
 *                   token: "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_email:
 *                 summary: Email invalide
 *                 value:
 *                   error: "Invalid email format"
 *               missing_email:
 *                 summary: Email manquant
 *                 value:
 *                   error: "Email is required"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Endpoint POST /api/token
async function generateToken(req: Request, res: Response): Promise<void> {
  const requestId = `req-${Date.now()}`
  const contextLogger = logger.withRequestId(requestId)

  try {
    const result = await Pipeline.from(req.body as TokenRequest)
      .pipe(validateTokenRequest)
      .pipe(generateSecureToken)
      .pipeAsync(storeTokenSecurely)
      .then(pipeline => pipeline.unwrap())

    if (!result.success) {
      contextLogger.warn(`Token generation failed: ${result.error}`)
      res.status(400).json({ error: result.error })
      return
    }

    contextLogger.info(`Token generated successfully for email: ${result.data.email}`)
    res.status(200).json({ token: result.data.token })

  } catch (error) {
    contextLogger.error('Token generation error', error as Error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Pipeline transformations
function validateTokenRequest(request: TokenRequest): Result<TokenRequest, string> {
  if (!request || typeof request !== 'object') {
    return { success: false, error: 'Request body must be a JSON object' }
  }

  const emailResult = emailValidator.validateFast(request.email)
  if (!emailResult.success) {
    return { success: false, error: emailResult.error }
  }

  return { success: true, data: request }
}

function generateSecureToken(request: TokenRequest): Result<{ email: string; token: string }, string> {
  try {
    const { token } = TokenGenerator.createTokenWithMetadata(request.email)
    
    return {
      success: true,
      data: {
        email: request.email,
        token
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token generation failed'
    }
  }
}

async function storeTokenSecurely(data: { email: string; token: string }): Promise<Result<{ email: string; token: string }, string>> {
  const storeResult = tokenStore.store(data.token, data.email)
  
  if (!storeResult.success) {
    return { success: false, error: storeResult.error }
  }

  return { success: true, data }
}

// Route configuration
export const authRoutes = Router()

authRoutes.post('/token', generateToken)

/**
 * @swagger
 * /api/auth/health:
 *   get:
 *     tags: [Monitoring]
 *     summary: Santé du module d'authentification
 *     description: Retourne les statistiques et l'état du système d'authentification
 *     responses:
 *       200:
 *         description: État du module d'authentification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 module:
 *                   type: string
 *                   example: "auth"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalTokens:
 *                       type: number
 *                       example: 25
 *                     uniqueEmails:
 *                       type: number
 *                       example: 15
 *                     validTokens:
 *                       type: number
 *                       example: 23
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Health check pour le module auth
authRoutes.get('/auth/health', (_req: Request, res: Response) => {
  const stats = tokenStore.getStats()
  res.json({
    status: 'healthy',
    module: 'auth',
    stats,
    timestamp: new Date().toISOString()
  })
})

// Export du store pour les autres modules
export { tokenStore }