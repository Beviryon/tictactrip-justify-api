// Configuration des tests
// ================================================================================

/**
 * Configuration des tests avec Vitest
 * Style personnel: setup minimal et performant
 */

import { beforeEach, afterEach, vi } from 'vitest'

// Configuration globale pour les tests
beforeEach(() => {
  // Reset avant chaque test
  vi.clearAllMocks()
})

afterEach(() => {
  // Nettoyage après chaque test
  vi.clearAllTimers()
})

// Matchers personnalisés pour nos types
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeValidResult(): any;
      toBeValidOption(): any;
      toBeValidToken(): any;
    }
  }
}

// Configuration des timeouts globaux
export const TEST_TIMEOUTS = {
  UNIT: 5000,
  INTEGRATION: 10000,
  E2E: 30000,
} as const;