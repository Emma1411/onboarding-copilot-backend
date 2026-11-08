FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

# Dépendances d'abord : cette couche est mise en cache tant que package*.json ne change pas
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Code et corpus de documentation (config.js lit /app/docs)
COPY src ./src
COPY docs ./docs

# Ne pas tourner en root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# `node` directement (pas `npm start`) : le conteneur reçoit proprement SIGTERM à l'arrêt
CMD ["node", "src/server.js"]