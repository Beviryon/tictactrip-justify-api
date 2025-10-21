/**
 * Rate Limiter - Limitation intelligente avec fenetre glissante
 * Style personnel: algorithme optimise pour 80k mots/jour
 */

import type { Result } from '../types/index.js'
import { logger } from '../core/logger.js'

interface UsageRecord {
  wordCount: number
  timestamp: Date
  resetAt: Date
}

interface RateLimitResult {
  allowed: boolean
  remainingWords: number
  resetAt: Date
  currentUsage: number
}

export class RateLimiter {
  private usage = new Map<string, UsageRecord[]>()
  
  constructor(
    private readonly dailyLimit = 80000, // 80k mots par jour
    private readonly windowSizeMs = 24 * 60 * 60 * 1000 // 24h
  ) {
    // Nettoyage automatique toutes les 4 heures
    setInterval(() => this.cleanupOldRecords(), 4 * 60 * 60 * 1000)
  }

  checkLimit(token: string, wordCount: number): Result<RateLimitResult, string> {
    try {
      const now = new Date()
      const records = this.getValidRecords(token, now)
      
      // Calculer l'usage actuel dans la fenetre
      const currentUsage = records.reduce((sum, record) => sum + record.wordCount, 0)
      const remainingWords = Math.max(0, this.dailyLimit - currentUsage)
      
      // Determiner la prochaine fenetre de reset
      const resetAt = this.getNextResetTime(records, now)
      
      const result: RateLimitResult = {
        allowed: currentUsage + wordCount <= this.dailyLimit,
        remainingWords,
        resetAt,
        currentUsage
      }

      if (!result.allowed) {
        logger.warn(`Rate limit exceeded for token ${token.slice(0, 8)}... (${currentUsage + wordCount}/${this.dailyLimit} words)`)
        return { 
          success: false, 
          error: `Rate limit exceeded. Daily limit: ${this.dailyLimit} words. Current usage: ${currentUsage}. Requested: ${wordCount}. Reset at: ${resetAt.toISOString()}` 
        }
      }

      return { success: true, data: result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rate limit check failed'
      logger.error('Rate limit check error', error as Error)
      return { success: false, error: message }
    }
  }

  recordUsage(token: string, wordCount: number): Result<void, string> {
    try {
      const now = new Date()
      const resetAt = new Date(now.getTime() + this.windowSizeMs)
      
      const record: UsageRecord = {
        wordCount,
        timestamp: now,
        resetAt
      }

      if (!this.usage.has(token)) {
        this.usage.set(token, [])
      }
      
      this.usage.get(token)!.push(record)
      
      logger.debug(`Recorded ${wordCount} words usage for token ${token.slice(0, 8)}...`)
      return { success: true, data: undefined }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record usage'
      logger.error('Usage recording error', error as Error)
      return { success: false, error: message }
    }
  }

  // Methode combinee: verifier ET enregistrer l'usage
  consumeWords(token: string, wordCount: number): Result<RateLimitResult, string> {
    const checkResult = this.checkLimit(token, wordCount)
    
    if (!checkResult.success) {
      return checkResult
    }

    if (!checkResult.data.allowed) {
      return { success: false, error: 'Rate limit would be exceeded' }
    }

    // Enregistrer l'usage
    const recordResult = this.recordUsage(token, wordCount)
    if (!recordResult.success) {
      return { success: false, error: recordResult.error }
    }

    // Recalculer les stats apres enregistrement
    const updatedCheck = this.checkLimit(token, 0)
    if (!updatedCheck.success) {
      return updatedCheck
    }

    return { success: true, data: updatedCheck.data }
  }

  getUsageStats(token: string): { totalWords: number; recordCount: number; oldestRecord?: Date | undefined } {
    const records = this.getValidRecords(token, new Date())
    const totalWords = records.reduce((sum, record) => sum + record.wordCount, 0)
    const oldestRecord = records.length > 0 
      ? records.reduce((oldest, record) => 
          record.timestamp < oldest ? record.timestamp : oldest, 
          records[0]!.timestamp
        )
      : undefined

    return {
      totalWords,
      recordCount: records.length,
      oldestRecord
    }
  }

  resetUsage(token: string): boolean {
    const deleted = this.usage.delete(token)
    if (deleted) {
      logger.info(`Usage reset for token ${token.slice(0, 8)}...`)
    }
    return deleted
  }

  private getValidRecords(token: string, now: Date): UsageRecord[] {
    const records = this.usage.get(token) || []
    const cutoffTime = new Date(now.getTime() - this.windowSizeMs)
    
    // Filtrer les enregistrements dans la fenetre temporelle
    return records.filter(record => record.timestamp > cutoffTime)
  }

  private getNextResetTime(records: UsageRecord[], now: Date): Date {
    if (records.length === 0) {
      return new Date(now.getTime() + this.windowSizeMs)
    }
    
    // Trouver le plus ancien enregistrement et calculer son reset
    const oldestRecord = records.reduce((oldest, record) => 
      record.timestamp < oldest.timestamp ? record : oldest
    )
    
    return new Date(oldestRecord.timestamp.getTime() + this.windowSizeMs)
  }

  private cleanupOldRecords(): void {
    let cleanedTokens = 0
    let cleanedRecords = 0
    const now = new Date()

    for (const [token, records] of this.usage.entries()) {
      const validRecords = this.getValidRecords(token, now)
      
      if (validRecords.length === 0) {
        this.usage.delete(token)
        cleanedTokens++
        cleanedRecords += records.length
      } else if (validRecords.length < records.length) {
        this.usage.set(token, validRecords)
        cleanedRecords += records.length - validRecords.length
      }
    }

    if (cleanedTokens > 0 || cleanedRecords > 0) {
      logger.debug(`Rate limiter cleanup: ${cleanedTokens} tokens, ${cleanedRecords} records`)
    }
  }

  // Debug et monitoring
  getGlobalStats() {
    const now = new Date()
    let totalTokens = 0
    let totalRecords = 0
    let totalWords = 0

    for (const [token] of this.usage.entries()) {
      const validRecords = this.getValidRecords(token, now)
      if (validRecords.length > 0) {
        totalTokens++
        totalRecords += validRecords.length
        totalWords += validRecords.reduce((sum, r) => sum + r.wordCount, 0)
      }
    }

    return {
      activeTokens: totalTokens,
      totalRecords,
      totalWords,
      dailyLimit: this.dailyLimit
    }
  }
}