/**
 * Token Store - Stockage des tokens en memoire avec TTL
 * Style personnel: structure optimisee pour les performances
 */

import type { Result } from '../types/index.js'
import { logger } from '../core/logger.js'

interface StoredToken {
  email: string
  createdAt: Date
  lastUsed: Date
  isValid: boolean
}

export class TokenStore {
  private tokens = new Map<string, StoredToken>()
  private emailToTokens = new Map<string, Set<string>>()
  
  // Configuration avec TTL de 24h par defaut
  constructor(
    private readonly tokenTTL = 24 * 60 * 60 * 1000, // 24h en ms
    private readonly maxTokensPerEmail = 5
  ) {
    // Nettoyage automatique toutes les heures
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000)
  }

  store(token: string, email: string): Result<void, string> {
    try {
      // Verifier le nombre de tokens par email
      const existingTokens = this.emailToTokens.get(email) || new Set()
      if (existingTokens.size >= this.maxTokensPerEmail) {
        // Supprimer le plus ancien token
        const oldestToken = this.findOldestTokenForEmail(email)
        if (oldestToken) {
          this.revoke(oldestToken)
        }
      }

      const now = new Date()
      const storedToken: StoredToken = {
        email,
        createdAt: now,
        lastUsed: now,
        isValid: true
      }

      this.tokens.set(token, storedToken)
      
      if (!this.emailToTokens.has(email)) {
        this.emailToTokens.set(email, new Set())
      }
      this.emailToTokens.get(email)!.add(token)

      logger.debug(`Token stored for email: ${email}`)
      return { success: true, data: undefined }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to store token'
      logger.error('Token storage failed', error as Error)
      return { success: false, error: message }
    }
  }

  retrieve(token: string): Result<StoredToken, string> {
    const stored = this.tokens.get(token)
    
    if (!stored) {
      return { success: false, error: 'Token not found' }
    }

    if (!stored.isValid) {
      return { success: false, error: 'Token is invalid' }
    }

    if (this.isExpired(stored)) {
      this.revoke(token)
      return { success: false, error: 'Token has expired' }
    }

    // Mettre a jour la derniere utilisation
    stored.lastUsed = new Date()
    
    return { success: true, data: stored }
  }

  revoke(token: string): boolean {
    const stored = this.tokens.get(token)
    if (!stored) return false

    // Marquer comme invalide au lieu de supprimer (pour audit)
    stored.isValid = false
    
    // Retirer de l'index email
    const emailTokens = this.emailToTokens.get(stored.email)
    if (emailTokens) {
      emailTokens.delete(token)
      if (emailTokens.size === 0) {
        this.emailToTokens.delete(stored.email)
      }
    }

    logger.debug(`Token revoked for email: ${stored.email}`)
    return true
  }

  revokeAllForEmail(email: string): number {
    const tokens = this.emailToTokens.get(email)
    if (!tokens) return 0

    let revokedCount = 0
    for (const token of tokens) {
      if (this.revoke(token)) {
        revokedCount++
      }
    }

    return revokedCount
  }

  private isExpired(stored: StoredToken): boolean {
    const now = Date.now()
    const tokenAge = now - stored.createdAt.getTime()
    return tokenAge > this.tokenTTL
  }

  private findOldestTokenForEmail(email: string): string | null {
    const tokens = this.emailToTokens.get(email)
    if (!tokens || tokens.size === 0) return null

    let oldestToken: string | null = null
    let oldestDate = new Date()

    for (const token of tokens) {
      const stored = this.tokens.get(token)
      if (stored && stored.createdAt < oldestDate) {
        oldestDate = stored.createdAt
        oldestToken = token
      }
    }

    return oldestToken
  }

  private cleanupExpiredTokens(): void {
    let cleanedCount = 0

    for (const [token, stored] of this.tokens.entries()) {
      if (!stored.isValid || this.isExpired(stored)) {
        this.tokens.delete(token)
        
        const emailTokens = this.emailToTokens.get(stored.email)
        if (emailTokens) {
          emailTokens.delete(token)
          if (emailTokens.size === 0) {
            this.emailToTokens.delete(stored.email)
          }
        }
        
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired tokens`)
    }
  }

  // Methodes utilitaires pour debug et monitoring
  getStats() {
    return {
      totalTokens: this.tokens.size,
      uniqueEmails: this.emailToTokens.size,
      validTokens: Array.from(this.tokens.values()).filter(t => t.isValid).length
    }
  }
}