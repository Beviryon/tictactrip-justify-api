# API de Justification de Texte - Tictactrip

Cette API REST permet de justifier du texte en respectant une largeur de 80 caractères par ligne. Développée dans le cadre du test technique Tictactrip, elle implémente un système d'authentification par token et un rate limiting intelligent.

## Présentation du projet

L'objectif était de créer une API capable de prendre n'importe quel texte et de le formater pour qu'il respecte exactement 80 caractères par ligne, avec une justification uniforme. L'API gère également l'authentification des utilisateurs et limite l'usage à 80 000 mots par jour et par token.

## Fonctionnalités principales

- **Justification de texte** : Algorithme personnalisé sans librairie externe
- **Authentification par token** : Génération de tokens uniques basés sur l'email
- **Rate limiting** : Limitation à 80 000 mots par jour avec gestion d'erreur HTTP 402
- **Documentation interactive** : Interface Swagger pour tester l'API
- **Architecture modulaire** : Code organisé en modules réutilisables

## Installation et démarrage

### Prérequis

- Node.js version 18 ou supérieure
- npm version 9 ou supérieure

### Installation

```bash
# Cloner le repository
git clone https://github.com/Beviryon/tictactrip-justify-api.git
cd tictactrip-justify-api

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev
```

L'API sera accessible sur `http://localhost:3003`

## Utilisation

### Documentation interactive

Une fois l'API démarrée, vous pouvez accéder à la documentation Swagger à l'adresse :
`http://localhost:3003/api-docs`

Cette interface permet de tester directement tous les endpoints avec des exemples.

### Endpoints disponibles

#### Génération de token

```
POST /api/token
Content-Type: application/json

{
  "email": "votre@email.com"
}
```

Retourne un token d'authentification valide pour 24 heures.

#### Justification de texte

```
POST /api/justify
Content-Type: text/plain
Authorization: Bearer VOTRE_TOKEN

Votre texte à justifier ici...
```

Retourne le texte justifié avec exactement 80 caractères par ligne.

#### Vérification de santé

```
GET /health
```

Retourne l'état de l'API et ses métriques.

## Architecture technique

### Structure du projet

```
src/
├── core/           # Modules fondamentaux réutilisables
│   ├── pipeline.ts # Système de traitement en chaîne
│   ├── validation.ts # Validation des données
│   ├── events.ts   # Bus d'événements
│   └── logger.ts   # Journalisation contextuelle
├── auth/           # Système d'authentification
│   ├── token-generator.ts # Génération de tokens
│   └── token-store.ts     # Stockage en mémoire
├── justify/        # Algorithme de justification
│   └── algorithm.ts
├── rate-limit/     # Limitation de débit
│   └── limiter.ts
├── modules/        # Endpoints et middleware
│   ├── auth-endpoints.ts
│   ├── justify-endpoints.ts
│   └── auth-middleware.ts
└── config/         # Configuration
    └── swagger.ts  # Documentation API
```

### Choix techniques

**TypeScript** : Configuration stricte pour la robustesse du code
**Express.js** : Framework web léger et flexible
**Biome** : Linting et formatage moderne, plus rapide qu'ESLint
**Vitest** : Framework de test performant pour TypeScript
**Swagger** : Documentation interactive standard OpenAPI 3.0

### Philosophie de code

Le projet adopte une approche fonctionnelle avec des patterns comme Pipeline et Result/Option types. Chaque module est indépendant et testable, favorisant la réutilisabilité et la maintenance.

## Algorithme de justification

L'algorithme développé fonctionne en trois étapes :

1. **Découpage** : Le texte est divisé en mots
2. **Regroupement** : Les mots sont regroupés par lignes de 80 caractères maximum
3. **Justification** : Les espaces sont distribués uniformément, sauf pour la dernière ligne

Le code évite les bibliothèques externes et gère les cas particuliers comme les mots trop longs ou les lignes d'un seul mot.

## Rate limiting

Le système limite chaque token à 80 000 mots par période de 24 heures glissantes. Le comptage se base sur le nombre de mots dans le texte soumis, et un dépassement génère une erreur HTTP 402 (Payment Required) comme spécifié dans les exigences.

## Scripts disponibles

```bash
npm run dev         # Développement avec rechargement automatique
npm run build       # Compilation TypeScript
npm run start       # Démarrage en production
npm run test        # Lancement des tests
npm run test:coverage # Tests avec couverture de code
npm run lint        # Vérification du code
npm run format      # Formatage automatique
```

## Déploiement

**Note importante** : Le sujet du test technique exige un déploiement sur une URL publique.

### Déploiement rapide sur Railway (recommandé)

Railway est gratuit et parfait pour ce type de projet :

1. Créer un compte sur [Railway.app](https://railway.app)
2. Connecter votre repository GitHub
3. L'application sera automatiquement déployée

Variables d'environnement à configurer :
```
PORT=3000
NODE_ENV=production
```

### Déploiement sur Render (alternative gratuite)

1. Créer un compte sur [Render.com](https://render.com)
2. Créer un nouveau "Web Service" 
3. Connecter votre repository GitHub
4. Configuration :
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

### Déploiement sur Vercel

```bash
npm install -g vercel
vercel --prod
```

### Avec Docker

```bash
# Construction de l'image
npm run docker:build

# Lancement du conteneur
npm run docker:run
```

### Déploiement manuel

```bash
# Construction de l'image
npm run docker:build

# Lancement du conteneur
npm run docker:run
```

### Déploiement manuel

```bash
# Compilation
npm run build

# Variables d'environnement
export PORT=3003

# Démarrage
npm start
```

## Développement

### Tests

Le projet utilise Vitest avec une configuration de couverture de code. Les tests couvrent l'algorithme de justification, le système d'authentification et les endpoints.

```bash
# Tests unitaires
npm test

# Tests avec interface graphique
npm run test:ui

# Couverture de code
npm run test:coverage
```

### Contribution

Le code suit les conventions TypeScript strictes avec Biome pour le formatage. Chaque module doit être accompagné de ses tests et la documentation Swagger doit être mise à jour.

## Limites et améliorations possibles

### Limites actuelles

- Stockage en mémoire (redémarrage = perte des données)
- Pas de persistance des tokens ou du rate limiting
- Algorithme optimisé pour l'anglais principalement

### Améliorations envisageables

- Base de données pour la persistance
- Cache distribué (Redis) pour la scalabilité
- Support multilingue avancé
- Authentification OAuth2
- Métriques et monitoring avancés

## Auteur

Développé par Beviryon ISSANGA NGOULOU dans le cadre du test technique Tictactrip.

Le code source complet est disponible sur GitHub avec l'historique des commits détaillant le processus de développement.
