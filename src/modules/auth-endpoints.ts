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

interface TokenRequest {
  email: string
}

interface TokenResponse {
  token: string
}

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
    const { token, metadata } = TokenGenerator.createTokenWithMetadata(request.email)
    
    return {
      success: true,
      data: {
        email: request.email,
        token,
        metadata
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

// Health check pour le module auth
authRoutes.get('/auth/health', (req: Request, res: Response) => {
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