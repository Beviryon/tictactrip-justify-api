/**
 * Middleware d'authentification personnalise
 * Style personnel: verification de token avec gestion d'erreurs elegante
 */

import type { Request, Response, NextFunction } from 'express'
import { tokenStore } from './auth-endpoints.js'
import { TokenGenerator } from '../auth/token-generator.js'
import { logger } from '../core/logger.js'

export interface AuthenticatedRequest extends Request {
  token?: string
  userEmail?: string
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  // Valider le format du token
  if (!TokenGenerator.validateTokenFormat(token)) {
    res.status(401).json({ error: 'Invalid token format' })
    return
  }

  // Verifier l'existence et validite du token
  const tokenResult = tokenStore.retrieve(token)
  if (!tokenResult.success) {
    logger.warn(`Token validation failed: ${tokenResult.error}`)
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  // Ajouter les infos d'auth a la requete
  req.token = token
  req.userEmail = tokenResult.data.email
  
  next()
}