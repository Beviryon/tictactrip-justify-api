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

/**
 * @swagger
 * /api/justify:
 *   post:
 *     tags: [Text Processing]
 *     summary: Justifie un texte à 80 caractères par ligne
 *     description: |
 *       Justifie un texte en distribuant uniformément les espaces entre les mots 
 *       pour atteindre exactement 80 caractères par ligne. La dernière ligne reste alignée à gauche.
 *       
 *       **Rate Limiting**: 80 000 mots maximum par jour par token.
 *       
 *       **Algorithme**: Distribution intelligente des espaces sans bibliothèque externe.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             $ref: '#/components/schemas/JustifyRequest'
 *           examples:
 *             court:
 *               summary: Texte court
 *               value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
 *             long:
 *               summary: Texte long
 *               value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
 *     responses:
 *       200:
 *         description: Texte justifié avec succès
 *         headers:
 *           X-Words-Used:
 *             description: Nombre de mots utilisés dans cette requête
 *             schema:
 *               type: integer
 *           X-Remaining-Words:
 *             description: Nombre de mots restants pour aujourd'hui
 *             schema:
 *               type: integer
 *           X-Reset-At:
 *             description: Date de reset du quota quotidien
 *             schema:
 *               type: string
 *               format: date-time
 *         content:
 *           text/plain:
 *             schema:
 *               $ref: '#/components/schemas/JustifyResponse'
 *             examples:
 *               justified:
 *                 summary: Texte justifié
 *                 value: |
 *                   Lorem  ipsum  dolor  sit  amet,  consectetur  adipiscing  elit,  sed  do  eiusmod
 *                   tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
 *                   quis  nostrud  exercitation  ullamco  laboris nisi ut aliquip ex ea commodo
 *                   consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
 *                   cillum dolore eu fugiat nulla pariatur.
 *       400:
 *         description: Erreur de validation du texte
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               empty_text:
 *                 summary: Texte vide
 *                 value:
 *                   error: "Text cannot be empty"
 *               text_too_long:
 *                 summary: Texte trop long
 *                 value:
 *                   error: "Text too long (max 100k characters)"
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_token:
 *                 summary: Token manquant
 *                 value:
 *                   error: "Missing or invalid authorization header"
 *               invalid_token:
 *                 summary: Token invalide
 *                 value:
 *                   error: "Invalid or expired token"
 *       402:
 *         description: Quota de mots dépassé (Payment Required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               rate_limit:
 *                 summary: Limite dépassée
 *                 value:
 *                   error: "Rate limit exceeded. Daily limit: 80000 words. Current usage: 79500. Requested: 600. Reset at: 2025-10-26T00:00:00.000Z"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

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