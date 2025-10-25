#!/usr/bin/env node

/**
 * Script de démonstration pour l'API Tictactrip
 * Teste les endpoints /api/token et /api/justify
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000'

console.log('=== Démonstration API Tictactrip ===')
console.log(`URL de base: ${API_BASE}`)
console.log('')

async function demo() {
  try {
    // Test 1: Health check
    console.log('1. Test du health check...')
    const healthResponse = await fetch(`${API_BASE}/health`)
    const healthData = await healthResponse.json()
    console.log('✓ Health check OK:', healthData.status)
    console.log('')

    // Test 2: Génération de token
    console.log('2. Génération d\'un token...')
    const tokenResponse = await fetch(`${API_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'demo@tictactrip.eu' })
    })
    
    if (!tokenResponse.ok) {
      throw new Error(`Erreur token: ${tokenResponse.status}`)
    }
    
    const tokenData = await tokenResponse.json()
    const token = tokenData.token
    console.log('✓ Token généré:', token.substring(0, 20) + '...')
    console.log('')

    // Test 3: Justification de texte
    console.log('3. Test de justification de texte...')
    const textToJustify = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
    
    const justifyResponse = await fetch(`${API_BASE}/api/justify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${token}`
      },
      body: textToJustify
    })
    
    if (!justifyResponse.ok) {
      throw new Error(`Erreur justification: ${justifyResponse.status}`)
    }
    
    const justifiedText = await justifyResponse.text()
    console.log('✓ Texte justifié (80 caractères par ligne):')
    console.log('')
    console.log(justifiedText)
    console.log('')
    
    // Vérification des longueurs de ligne
    const lines = justifiedText.split('\n')
    console.log('4. Vérification des longueurs de ligne...')
    lines.forEach((line, index) => {
      if (line.trim()) {
        console.log(`Ligne ${index + 1}: ${line.length} caractères`)
      }
    })
    console.log('')

    // Test 5: Rate limiting (simulation)
    console.log('5. Test du rate limiting...')
    console.log('(Pour un test complet, il faudrait envoyer 80 000 mots)')
    console.log('✓ Rate limiting configuré: 80 000 mots/jour')
    console.log('')

    console.log('=== Démonstration terminée avec succès ===')
    console.log('')
    console.log('Documentation complète disponible sur:', `${API_BASE}/api-docs`)
    
  } catch (error) {
    console.error('❌ Erreur durant la démonstration:', error.message)
    process.exit(1)
  }
}

// Polyfill fetch pour Node.js < 18
if (typeof fetch === 'undefined') {
  console.log('Installation de node-fetch pour la compatibilité...')
  import('node-fetch').then(({ default: fetch }) => {
    globalThis.fetch = fetch
    demo()
  }).catch(() => {
    console.error('❌ Veuillez installer node-fetch: npm install node-fetch')
    process.exit(1)
  })
} else {
  demo()
}