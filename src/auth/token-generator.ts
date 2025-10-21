/**
 * Token Generator - Generateur de tokens securises et uniques
 * Style personnel: algorithme personnalise sans dependances externes
 */

import { createHash, randomBytes } from 'node:crypto'

interface TokenMetadata {
  email: string
  createdAt: Date
  lastUsed: Date
  issuedBy: string
}

export class TokenGenerator {
  private static readonly ALGORITHM = 'sha256'
  private static readonly TOKEN_LENGTH = 32
  private static readonly ISSUER = 'tictactrip-justify-api'

  static generateSecureToken(email: string): string {
    const timestamp = Date.now().toString()
    const randomData = randomBytes(this.TOKEN_LENGTH).toString('hex')
    const emailHash = createHash(this.ALGORITHM).update(email).digest('hex')
    
    // Combinaison unique: email hash + timestamp + random + signature
    const baseData = `${emailHash}:${timestamp}:${randomData}`
    const signature = createHash(this.ALGORITHM)
      .update(baseData + this.ISSUER)
      .digest('hex')
    
    return `${baseData}:${signature}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64)
  }

  static createMetadata(email: string): TokenMetadata {
    const now = new Date()
    return {
      email,
      createdAt: now,
      lastUsed: now,
      issuedBy: this.ISSUER
    }
  }

  static validateTokenFormat(token: string): boolean {
    return /^[a-zA-Z0-9]{64}$/.test(token)
  }

  // Genere un token avec sa metadata complete
  static createTokenWithMetadata(email: string): { token: string; metadata: TokenMetadata } {
    return {
      token: this.generateSecureToken(email),
      metadata: this.createMetadata(email)
    }
  }
}