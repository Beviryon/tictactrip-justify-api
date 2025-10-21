# Dockerfile Tictactrip Justify API
# ================================================================================

# Stage 1: Build stage avec optimisations
FROM node:18-alpine AS builder

# Configuration de l'environnement de build
WORKDIR /app
ENV NODE_ENV=production
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Installation des dépendances avec cache optimisé
COPY package*.json ./
RUN npm ci --only=production --silent \
    && npm cache clean --force

# Copie du code source et build
COPY . .
RUN npm run build

# Stage 2: Production runtime optimisé
FROM node:18-alpine AS production

# Sécurité: utilisateur non-root
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Configuration de l'environnement de production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Installation des dépendances de production uniquement
COPY package*.json ./
RUN npm ci --only=production --silent \
    && npm cache clean --force \
    && rm -rf /tmp/*

# Copie des fichiers buildés depuis le stage précédent
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Changement vers l'utilisateur non-root
USER nextjs

# Exposition du port
EXPOSE 3000

# Health check personnalisé
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Commande de démarrage
CMD ["node", "dist/server.js"]