# 🚀 Guia de Deploy - Juli WhatsApp Bot

## 📋 Pré-requisitos

### 1. Credenciais WhatsApp Cloud API
- [ ] Meta for Developers account
- [ ] WhatsApp Business App criado
- [ ] Número de telefone verificado
- [ ] Access Token gerado
- [ ] App Secret configurado
- [ ] Webhook URL configurada

### 2. Credenciais OpenAI
- [ ] Conta OpenAI ativa
- [ ] API Key com créditos suficientes
- [ ] Rate limits adequados para produção

## 🌐 Deploy em Produção

### Opção 1: Railway/Render (Recomendado)
```bash
# 1. Deploy no Railway
railway login
railway new
railway link

# 2. Configurar variáveis de ambiente
railway variables set WHATSAPP_TOKEN=seu_token
railway variables set PHONE_NUMBER_ID=seu_id
railway variables set VERIFY_TOKEN=seu_verify_token
railway variables set APP_SECRET=seu_app_secret
railway variables set OPENAI_API_KEY=sua_chave
railway variables set NODE_ENV=production

# 3. Deploy
git push origin main
```

### Opção 2: Docker + VPS
```bash
# 1. Build da imagem
docker build -t juli-bot .

# 2. Run com env file
docker run -d \
  --name juli-bot \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  juli-bot
```

### Opção 3: PM2 (VPS tradicional)
```bash
# 1. Instalar PM2
npm install -g pm2

# 2. Configurar ecosystem
# Arquivo: ecosystem.config.js
module.exports = {
  apps: [{
    name: 'juli-bot',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

# 3. Deploy
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## ⚙️ Configuração WhatsApp Cloud API

### 1. Webhook Configuration
```
URL: https://seudominio.com/webhook
Verify Token: [mesmo do .env]
Subscribe to: messages
```

### 2. Permissões Necessárias
- `whatsapp_business_messaging`
- `whatsapp_business_management`

### 3. Rate Limits WhatsApp
- Tier 1: 250 usuários únicos/24h
- Tier 2: 1K usuários únicos/24h
- Tier 3: 10K usuários únicos/24h

## 🔒 Checklist de Segurança

### Antes do Deploy
- [ ] `.env` não commitado no git
- [ ] Todas as variáveis de ambiente configuradas
- [ ] APP_SECRET forte e único
- [ ] VERIFY_TOKEN aleatório e seguro
- [ ] CORS configurado corretamente
- [ ] Rate limits configurados
- [ ] Logs não expõem dados sensíveis

### Após Deploy
- [ ] Webhook validando assinaturas
- [ ] Health check funcionando
- [ ] Logs sendo coletados
- [ ] Métricas configuradas
- [ ] Backup de estado implementado

## 📊 Monitoramento

### Métricas Importantes
- Latência das respostas
- Taxa de erro das APIs
- Rate limit atingido
- Mensagens processadas/hora
- Uptime do serviço

### Alertas Críticos
- API WhatsApp retornando erro 5xx
- OpenAI quota excedida
- Rate limit muito alto
- Webhook signature inválida

## 🔧 Troubleshooting

### Erro 401 - Unauthorized
```bash
# Verificar WHATSAPP_TOKEN
curl -H "Authorization: Bearer $WHATSAPP_TOKEN" \
  "https://graph.facebook.com/v20.0/me"
```

### Erro 403 - Forbidden
```bash
# Verificar PHONE_NUMBER_ID
# Verificar permissões do app
```

### Rate Limit Atingido
```bash
# Implementar backoff exponencial
# Aumentar intervalos entre mensagens
# Considerar upgrade de tier
```

### OpenAI Timeout
```bash
# Verificar créditos
# Implementar retry logic
# Considerar modelo mais rápido
```

## 📈 Otimizações

### Performance
- Implementar cache Redis
- Connection pooling
- Compressão gzip
- CDN para assets

### Escalabilidade
- Load balancer
- Cluster mode
- Database externa
- Queue system (Bull/Agenda)

### Observabilidade
- APM (New Relic/DataDog)
- Structured logging
- Distributed tracing
- Error tracking (Sentry)
