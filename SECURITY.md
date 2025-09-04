# Juli WhatsApp Bot - Documentação Técnica

## 🔒 Segurança Implementada

### Autenticação WhatsApp
- ✅ Validação de assinatura webhook com `crypto.timingSafeEqual`
- ✅ Verificação rigorosa de App Secret
- ✅ Rate limiting por usuário (5 msgs/min)
- ✅ Rate limiting global via @fastify/rate-limit

### Proteções de Segurança
- ✅ Helmet.js para headers de segurança
- ✅ CORS configurável
- ✅ Logs de auditoria com privacy (últimos 4 dígitos)
- ✅ Timeout nas requisições (10s WhatsApp, 15s OpenAI)
- ✅ Retry com backoff exponencial
- ✅ Graceful shutdown

### Conformidade WhatsApp
- ✅ Opt-out/Opt-in implementado
- ✅ Cache de mensagens para evitar duplicatas
- ✅ Limite de 4096 caracteres por mensagem
- ✅ User-Agent personalizado
- ✅ Estado de usuário persistente

## 🚀 Como Usar

### 1. Configuração Inicial
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais
```

### 2. Desenvolvimento
```bash
# Modo desenvolvimento (auto-reload)
npm run dev

# Modo produção
npm start
```

### 3. Webhooks WhatsApp
- URL do webhook: `https://seudominio.com/webhook`
- Token de verificação: configurar no `.env`

## 📝 Comandos Administrativos

### Para o Time Humano
- `#humano_on` - Ativa atendimento humano
- `#humano_off` - Volta para IA

### Para Usuários
- `SAIR` ou `STOP` - Opt-out de mensagens
- `VOLTA` - Opt-in novamente

## 🔧 Monitoramento

### Health Check
- GET `/health` - Status do servidor
- GET `/` - Informações básicas

### Logs Estruturados
- Todos os eventos são logados com contexto
- Privacy-first: apenas últimos 4 dígitos do WhatsApp ID
- Diferentes níveis: info, warn, error

## ⚠️ Importante para Produção

1. **Banco de Dados**: Substituir `Map()` por Redis/PostgreSQL
2. **SSL/TLS**: Usar HTTPS obrigatório
3. **Monitoramento**: Implementar APM (New Relic, DataDog)
4. **Backup**: State e logs críticos
5. **Load Balancer**: Para alta disponibilidade

## 🧪 Testes de Conformidade

### Rate Limiting
```bash
# Testar 6+ mensagens em 1 minuto
# Deve bloquear após a 5ª mensagem
```

### Webhook Security
```bash
# Tentar POST sem assinatura válida
# Deve retornar 401 Unauthorized
```

### OpenAI Fallback
```bash
# Simular erro na API OpenAI
# Deve retornar mensagem de fallback
```
