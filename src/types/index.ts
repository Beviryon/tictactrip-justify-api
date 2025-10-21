// 🎯 Types globaux avec style personnalisé - Tictactrip Justify API
// ================================================================================

/**
 * 🌟 Système de types avancé avec patterns fonctionnels
 * Approche type-safe et expressive pour l'ensemble de l'API
 */

// 🔧 Types de base ultra-expressifs
export type Timestamp = number & { readonly __brand: 'Timestamp' };
export type WordCount = number & { readonly __brand: 'WordCount' };
export type LineLength = number & { readonly __brand: 'LineLength' };
export type TokenId = string & { readonly __brand: 'TokenId' };
export type UserId = string & { readonly __brand: 'UserId' };

/**
 * 🎨 Result pattern personnalisé pour la gestion d'erreurs fonctionnelle
 * Inspiré de Rust/Haskell mais adapté à TypeScript
 */
export type Result<T, E = Error> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * 🚀 Option pattern pour les valeurs potentiellement nulles
 * Alternative type-safe à null/undefined
 */
export type Option<T> = 
  | { readonly some: true; readonly value: T }
  | { readonly some: false };

/**
 * 🎭 Union types expressifs pour les états métier
 */
export type AuthenticationStatus = 
  | 'authenticated'
  | 'unauthenticated'
  | 'expired'
  | 'invalid';

export type RateLimitStatus = 
  | 'within-limit'
  | 'exceeded'
  | 'reset-required';

export type JustificationStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * 🌟 Interfaces métier avec composition fonctionnelle
 */
export interface AuthToken {
  readonly id: TokenId;
  readonly userId: UserId;
  readonly createdAt: Timestamp;
  readonly expiresAt: Timestamp;
  readonly isActive: boolean;
}

export interface RateLimitEntry {
  readonly tokenId: TokenId;
  readonly wordCount: WordCount;
  readonly resetTime: Timestamp;
  readonly dailyLimit: WordCount;
}

export interface JustificationRequest {
  readonly text: string;
  readonly targetLength: LineLength;
  readonly preserveFormatting: boolean;
}

export interface JustificationResult {
  readonly originalText: string;
  readonly justifiedText: string;
  readonly lineCount: number;
  readonly wordCount: WordCount;
  readonly processingTime: number;
}

/**
 * 🔧 Types utilitaires avec style fonctionnel
 */
export type Immutable<T> = {
  readonly [K in keyof T]: T[K] extends object 
    ? Immutable<T[K]> 
    : T[K];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object 
    ? DeepPartial<T[P]> 
    : T[P];
};

/**
 * 🎯 Types pour les réponses API standardisées
 */
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly meta?: {
    readonly timestamp: Timestamp;
    readonly requestId: string;
    readonly version: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  readonly pagination?: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasNext: boolean;
    readonly hasPrev: boolean;
  };
}

/**
 * 🎨 Factory helpers pour créer des types brandés
 */
export const createTimestamp = (value: number): Timestamp => 
  value as Timestamp;

export const createWordCount = (value: number): WordCount => 
  value as WordCount;

export const createLineLength = (value: number): LineLength => 
  value as LineLength;

export const createTokenId = (value: string): TokenId => 
  value as TokenId;

export const createUserId = (value: string): UserId => 
  value as UserId;

/**
 * 🚀 Helpers pour Result pattern
 */
export const Success = <T>(data: T): Result<T, never> => 
  ({ success: true, data } as const);

export const Failure = <E>(error: E): Result<never, E> => 
  ({ success: false, error } as const);

/**
 * 🎭 Helpers pour Option pattern
 */
export const Some = <T>(value: T): Option<T> => 
  ({ some: true, value } as const);

export const None: Option<never> = 
  { some: false } as const;