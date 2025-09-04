# Dockerfile seguro para Juli WhatsApp Bot
FROM node:18-alpine

# Instalar dependências de segurança
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S juli -u 1001

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY --chown=juli:nodejs src/ ./src/
COPY --chown=juli:nodejs scripts/ ./scripts/

# Mudar para usuário não-root
USER juli

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Usar dumb-init para signal handling
ENTRYPOINT ["dumb-init", "--"]

# Comando de início
CMD ["node", "src/app.js"]
