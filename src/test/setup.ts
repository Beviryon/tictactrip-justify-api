// 🧪 Configuration des tests avec style personnalisé
// ================================================================================

/**
 * 🌟 Setup global des tests avec patterns modernes
 * Configuration centralisée pour Vitest
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// 🚀 Configuration globale des tests
beforeAll(async () => {
  // Configuration initiale des tests
  console.log('🧪 Initializing test environment...');
});

afterAll(async () => {
  // Nettoyage final
  console.log('🧹 Cleaning up test environment...');
});

beforeEach(() => {
  // Reset avant chaque test
  jest.clearAllMocks?.();
});

afterEach(() => {
  // Nettoyage après chaque test
  jest.clearAllTimers?.();
});

// 🎯 Matchers personnalisés pour nos types
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeValidResult(): any;
      toBeValidOption(): any;
      toBeValidToken(): any;
    }
  }
}

// 🔧 Configuration des timeouts globaux
export const TEST_TIMEOUTS = {
  UNIT: 5000,
  INTEGRATION: 10000,
  E2E: 30000,
} as const;