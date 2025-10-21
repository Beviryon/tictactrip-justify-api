// 🎯 Configuration globale avec style unique - Tictactrip Justify API
// ================================================================================

/**
 * 🌟 Configuration centrale de l'application avec patterns fonctionnels
 * Utilise une approche immutable et type-safe pour la gestion des configs
 */

import { z } from 'zod';

// 🔧 Schema de validation de l'environnement avec style defensif
const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  
  // 🛡️ Configs de sécurité personnalisées
  JWT_SECRET: z.string().min(32).optional(),
  API_VERSION: z.string().default('v1'),
  
  // 📊 Rate limiting configurables
  DAILY_WORD_LIMIT: z.coerce.number().positive().default(80000),
  RATE_LIMIT_WINDOW: z.coerce.number().positive().default(86400000), // 24h en ms
  
  // 🎨 Configs d'application uniques
  TEXT_JUSTIFICATION_LENGTH: z.coerce.number().positive().default(80),
  TOKEN_EXPIRY_HOURS: z.coerce.number().positive().default(24),
  
  // 🔍 Debug et logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_REQUEST_LOGGING: z.coerce.boolean().default(true),
  ENABLE_METRICS: z.coerce.boolean().default(false),
});

// 🌟 Type inféré automatiquement du schema
type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * 🚀 Factory pattern pour créer une configuration validée
 * Approche fonctionnelle pure sans effets de bord
 */
const createConfiguration = (): Environment => {
  const result = EnvironmentSchema.safeParse(process.env);
  
  if (!result.success) {
    const errorMessages = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    
    throw new Error(`❌ Configuration validation failed:\n${errorMessages}`);
  }
  
  return result.data;
};

// 🎯 Configuration singleton immutable
export const CONFIG = Object.freeze(createConfiguration());

// 🔧 Helpers fonctionnels pour accéder aux configs
export const getServerConfig = () => ({
  host: CONFIG.HOST,
  port: CONFIG.PORT,
  environment: CONFIG.NODE_ENV,
}) as const;

export const getSecurityConfig = () => ({
  jwtSecret: CONFIG.JWT_SECRET || generateDefaultSecret(),
  apiVersion: CONFIG.API_VERSION,
  tokenExpiryHours: CONFIG.TOKEN_EXPIRY_HOURS,
}) as const;

export const getRateLimitConfig = () => ({
  dailyWordLimit: CONFIG.DAILY_WORD_LIMIT,
  windowMs: CONFIG.RATE_LIMIT_WINDOW,
}) as const;

export const getJustificationConfig = () => ({
  lineLength: CONFIG.TEXT_JUSTIFICATION_LENGTH,
}) as const;

export const getLoggingConfig = () => ({
  level: CONFIG.LOG_LEVEL,
  enableRequestLogging: CONFIG.ENABLE_REQUEST_LOGGING,
  enableMetrics: CONFIG.ENABLE_METRICS,
}) as const;

/**
 * 🔐 Générateur de secret par défaut pour le développement
 * En production, JWT_SECRET doit être défini explicitement
 */
function generateDefaultSecret(): string {
  if (CONFIG.NODE_ENV === 'production') {
    throw new Error('🚨 JWT_SECRET must be defined in production environment');
  }
  
  console.warn('⚠️  Using default JWT secret for development. Set JWT_SECRET env var for production.');
  return 'dev-secret-tictactrip-justify-api-change-me-in-production';
}

// 🎨 Type exports pour la réutilisation
export type { Environment };
export { EnvironmentSchema };