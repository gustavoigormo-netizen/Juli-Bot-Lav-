# 🚀 Deploy Rápido - Juli WhatsApp Bot

## 🌐 Opção 1: Railway (Recomendado - Grátis)

### Passo 1: Preparar para Deploy
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login
```

### Passo 2: Criar Projeto
```bash
# Criar novo projeto
railway new

# Conectar ao projeto local
railway link
```

### Passo 3: Configurar Variáveis de Ambiente
```bash
# Configurar todas as variáveis
railway variables set WHATSAPP_TOKEN="EAAx...seu_token_aqui"
railway variables set PHONE_NUMBER_ID="123456789012345"
railway variables set VERIFY_TOKEN="juli_verify_2025_secreto"
railway variables set APP_SECRET="abc123def456..."
railway variables set OPENAI_API_KEY="sk-...sua_chave_aqui"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
railway variables set LOG_LEVEL="info"
railway variables set ADMIN_PHONE="5577999999999"
railway variables set RATE_LIMIT_MAX="10"
railway variables set RATE_LIMIT_WINDOW="60000"
```

### Passo 4: Deploy
```bash
# Deploy
railway up

# Ver logs
railway logs
```

### Passo 5: Obter URL de Produção
```bash
# Ver domínio
railway domain
```

---

## 🌟 Opção 2: Render (Alternativa)

### Passo 1: Conectar GitHub
1. Acesse https://render.com/
2. Conecte sua conta GitHub
3. Crie novo "Web Service"
4. Conecte este repositório

### Passo 2: Configurar Serviço
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node.js

### Passo 3: Variáveis de Ambiente
Adicione todas as variáveis do .env na interface do Render

---

## 🐳 Opção 3: Docker (VPS)

### Build e Run
```bash
# Build
docker build -t juli-bot .

# Run com env file
docker run -d \
  --name juli-bot \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  juli-bot
```

---

## ⚙️ Configurar Webhook de Produção

Após deploy, no Meta for Developers:

1. **Produtos** → **WhatsApp** → **Configuração**
2. **Callback URL**: `https://seu-dominio.railway.app/webhook`
3. **Verify token**: o mesmo do .env
4. **Webhook fields**: Marcar `messages`
5. **Verificar e salvar**

---

## 🔍 Verificar Deploy

### Health Check
```bash
curl https://seu-dominio.railway.app/health
```

### Testar Webhook
Envie mensagem WhatsApp → Deve responder automaticamente

### Ver Logs
```bash
# Railway
railway logs

# Render
# Ver na interface web

# Docker
docker logs juli-bot -f
```

---

## 🚨 Troubleshooting

### Erro 503/504
- Verificar se PORT está configurado
- Ver logs de erro
- Verificar health check

### Webhook não funciona
- Verificar URL no Meta
- Testar: `curl -X GET https://seu-dominio.com/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=teste`

### Erro OpenAI
- Verificar créditos
- Verificar API key válida

### Rate Limit
- Verificar configuração
- Monitorar logs de rate limit

---

## 📊 Monitoramento

### Métricas Importantes
- Uptime > 99%
- Response time < 2s
- Error rate < 1%
- Memory usage < 500MB

### Alertas Configurar
- Health check failed
- High error rate
- OpenAI quota exceeded
- Webhook signature invalid
