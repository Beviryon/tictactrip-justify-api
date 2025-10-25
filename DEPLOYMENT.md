# Guide de Déploiement - API Tictactrip

Ce guide détaille comment déployer l'API sur différentes plateformes gratuites pour respecter l'exigence du test technique.

## Option 1 : Railway (Recommandé)

Railway est la solution la plus simple et rapide :

### Étapes de déploiement

1. **Créer un compte** sur https://railway.app
2. **Connecter GitHub** : Autoriser Railway à accéder à vos repositories
3. **Créer un nouveau projet** : 
   - Cliquer sur "Deploy from GitHub repo"
   - Sélectionner `tictactrip-justify-api`
4. **Configuration automatique** : Railway détecte automatiquement le projet Node.js
5. **Variables d'environnement** (optionnel) :
   ```
   NODE_ENV=production
   PORT=3000
   ```

### Après déploiement

- L'API sera accessible sur une URL comme : `https://votre-app.railway.app`
- Le health check sera disponible sur : `https://votre-app.railway.app/health`
- La documentation Swagger sur : `https://votre-app.railway.app/api-docs`

## Option 2 : Render

### Étapes

1. Créer un compte sur https://render.com
2. Créer un "Web Service"
3. Connecter le repository GitHub
4. Configuration :
   - **Build Command** : `npm run build`
   - **Start Command** : `npm start`
   - **Environment** : Node
   - **Plan** : Free (suffisant pour le test)

### Variables d'environnement

```
NODE_ENV=production
```

## Option 3 : Vercel

Bien que principalement orienté frontend, Vercel peut héberger notre API :

### Configuration

Créer un fichier `vercel.json` :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/server.js"
    }
  ]
}
```

### Déploiement

```bash
npm install -g vercel
npm run build
vercel --prod
```

## Option 4 : Heroku

### Préparation

Ajouter un `Procfile` :
```
web: npm start
```

### Déploiement

```bash
# Installer Heroku CLI
npm install -g heroku

# Se connecter
heroku login

# Créer l'application
heroku create votre-app-name

# Déployer
git push heroku main
```

## Test après déploiement

Une fois déployé, tester l'API avec :

```bash
# Health check
curl https://votre-url/health

# Génération de token
curl -X POST https://votre-url/api/token \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Justification (remplacer YOUR_TOKEN)
curl -X POST https://votre-url/api/justify \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
```

## Points de vigilance

### Limites des plateformes gratuites

- **Railway** : 500h/mois (largement suffisant)
- **Render** : L'app se met en veille après 15min d'inactivité
- **Vercel** : Timeout à 10 secondes max pour les fonctions
- **Heroku** : Plus gratuit depuis novembre 2022

### Recommandation

**Railway** est la meilleure option car :
- Configuration automatique
- Pas de mise en veille
- Interface simple
- Logs accessibles
- Support complet Node.js

## URL de démonstration

Une fois déployé, votre API sera accessible publiquement et vous pourrez fournir l'URL dans votre soumission du test technique.

Exemple d'URL finale : `https://tictactrip-justify-api.railway.app`