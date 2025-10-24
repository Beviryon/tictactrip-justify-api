/**
 * Justify Endpoints - Justification de texte avec rate limiting
 * Style personnel: architecture composable avec gestion d'erreurs
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { Pipeline } from '../core/pipeline.js'
import { Validator } from '../core/validation.js'
import { logger } from '../core/logger.js'
import { justifyText } from '../justify/algorithm.js'
import { RateLimiter } from '../rate-limit/limiter.js'
import { authenticateToken, type AuthenticatedRequest } from './auth-middleware.js'
import type { Result } from '../types/index.js'

// Instance globale du rate limiter
const rateLimiter = new RateLimiter(80000) // 80k mots par jour

// Validation du texte d'entree
const textValidator = Validator.create<string>()
  .required('Text is required')
  .minLength(1, 'Text cannot be empty')
  .maxLength(100000, 'Text too long (max 100k characters)')

interface JustifyRequest {
  text: string
  token: string
  userEmail: string
}

interface JustifyResponse {
  justifiedText: string
  wordsUsed: number
  remainingWords: number
  resetAt: string
}

// Endpoint POST /api/justify
async function justifyTextEndpoint(req: AuthenticatedRequest, res: Response): Promise<void> {
  const requestId = `req-${Date.now()}`
  const contextLogger = logger
    .withRequestId(requestId)
    .withContext({ email: req.userEmail, endpoint: 'justify' })

  try {
    const requestData: JustifyRequest = {
      text: req.body as string,
      token: req.token!,
      userEmail: req.userEmail!
    }

    const result = await Pipeline.from(requestData)
      .pipe(validateJustifyRequest)
      .pipe(countWords)
      .pipeAsync(checkRateLimit)
      .then(async pipeline => {
        const checkResult = pipeline.unwrap()
        if (!checkResult.success) return checkResult
        
        const justifyResult = performJustification(checkResult.data)
        if (!justifyResult.success) return justifyResult
        
        return await recordUsage(justifyResult.data)
      })

    if (!result.success) {
      // Gerer l'erreur 402 pour rate limit
      if (result.error.includes('Rate limit exceeded')) {
        contextLogger.warn(`Rate limit exceeded for user: ${req.userEmail}`)
        res.status(402).json({ error: result.error })
        return
      }

      contextLogger.warn(`Justify request failed: ${result.error}`)
      res.status(400).json({ error: result.error })
      return
    }

    contextLogger.info(`Text justified successfully - ${result.data.wordsUsed} words used`)
    res.status(200).send(result.data.justifiedText)

  } catch (error) {
    contextLogger.error('Text justification error', error as Error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Pipeline transformations
function validateJustifyRequest(request: JustifyRequest): Result<JustifyRequest, string> {
  if (typeof request.text !== 'string') {
    return { success: false, error: 'Request body must be plain text' }
  }

  const textResult = textValidator.validateFast(request.text)
  if (!textResult.success) {
    return { success: false, error: textResult.error }
  }

  return { success: true, data: request }
}

function countWords(request: JustifyRequest): Result<JustifyRequest & { wordCount: number }, string> {
  try {
    // Compter les mots (separation par espaces/newlines)
    const wordCount = request.text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length

    return {
      success: true,
      data: { ...request, wordCount }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to count words'
    }
  }
}

async function checkRateLimit(
  data: JustifyRequest & { wordCount: number }
): Promise<Result<JustifyRequest & { wordCount: number }, string>> {
  const limitResult = rateLimiter.checkLimit(data.token, data.wordCount)
  
  if (!limitResult.success) {
    return { success: false, error: limitResult.error }
  }

  if (!limitResult.data.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Daily limit: 80000 words. Reset at: ${limitResult.data.resetAt.toISOString()}`
    }
  }

  return { success: true, data }
}

function performJustification(
  data: JustifyRequest & { wordCount: number }
): Result<JustifyRequest & { wordCount: number; justifiedText: string }, string> {
  try {
    const justifiedText = justifyText(data.text, 80)
    
    return {
      success: true,
      data: { ...data, justifiedText }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Text justification failed'
    }
  }
}

async function recordUsage(
  data: JustifyRequest & { wordCount: number; justifiedText: string }
): Promise<Result<JustifyResponse, string>> {
  // Enregistrer l'usage dans le rate limiter
  const recordResult = rateLimiter.recordUsage(data.token, data.wordCount)
  if (!recordResult.success) {
    return { success: false, error: recordResult.error }
  }

  // Obtenir les stats mises a jour
  const statsResult = rateLimiter.checkLimit(data.token, 0)
  if (!statsResult.success) {
    return { success: false, error: statsResult.error }
  }

  const response: JustifyResponse = {
    justifiedText: data.justifiedText,
    wordsUsed: data.wordCount,
    remainingWords: statsResult.data.remainingWords,
    resetAt: statsResult.data.resetAt.toISOString()
  }

  return { success: true, data: response }
}

// Route configuration
export const justifyRoutes = Router()

// L'endpoint principal avec authentification
justifyRoutes.post('/justify', authenticateToken, justifyTextEndpoint)

// Health check pour le module justify
justifyRoutes.get('/justify/health', (_req: Request, res: Response) => {
  const stats = rateLimiter.getGlobalStats()
  res.json({
    status: 'healthy',
    module: 'justify',
    stats,
    timestamp: new Date().toISOString()
  })
})

// Stats detaillees (avec auth)
justifyRoutes.get('/justify/stats', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userStats = rateLimiter.getUsageStats(req.token!)
  const globalStats = rateLimiter.getGlobalStats()
  
  res.json({
    user: {
      email: req.userEmail,
      usage: userStats,
      dailyLimit: 80000
    },
    global: globalStats,
    timestamp: new Date().toISOString()
  })
})