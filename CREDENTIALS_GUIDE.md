# 🔑 Guia Completo de Credenciais - Juli WhatsApp Bot

## 📱 WhatsApp Cloud API (Meta for Developers)

### Passo 1: Criar Conta Meta for Developers
1. Acesse: https://developers.facebook.com/
2. Faça login com sua conta Facebook/Meta
3. Clique em "Meus Apps" → "Criar App"
4. Escolha "Empresa" → "Avançar"
5. Nome do app: "Juli Bot Lavô"
6. Email de contato: seu email
7. Clique em "Criar App"

### Passo 2: Adicionar WhatsApp ao App
1. No painel do app, clique em "Adicionar Produto"
2. Encontre "WhatsApp" → "Configurar"
3. Clique em "WhatsApp" no menu lateral

### Passo 3: Configurar Número de Telefone
1. Na seção "Introdução", você verá:
   - **Número de telefone de teste** (já configurado)
   - **Para:** campo para adicionar seu número pessoal
2. Adicione seu número pessoal no formato: +5577999999999
3. Clique em "Enviar código" e confirme o WhatsApp

### Passo 4: Obter Token Temporário
1. Em "Introdução" → "1. Enviar mensagens"
2. Copie o **Token de Acesso** (começa com `EAAx...`)
3. ⚠️ **IMPORTANTE**: Este token expira em 24h, vamos gerar um permanente depois

### Passo 5: Obter Phone Number ID
1. Na mesma seção, você verá:
   - **De:** Número de telefone (123-456-7890)
   - **ID do número de telefone:** (números longos)
2. Copie o **ID do número de telefone**

### Passo 6: Obter App Secret
1. Configurações → Básico
2. Copie o **Chave Secreta do App**
3. Se não estiver visível, clique em "Mostrar"

### Passo 7: Criar Verify Token
1. Crie uma string aleatória, ex: `juli_verify_2025_secreto`
2. Guarde para usar no webhook

---

## 🤖 OpenAI API

### Passo 1: Criar Conta OpenAI
1. Acesse: https://platform.openai.com/
2. Faça login ou crie conta
3. Vá em "Settings" → "Billing"
4. Adicione créditos (mínimo $5)

### Passo 2: Gerar API Key
1. Vá em "API Keys"
2. Clique em "Create new secret key"
3. Nome: "Juli WhatsApp Bot"
4. Copie a chave (começa com `sk-...`)
5. ⚠️ **IMPORTANTE**: Guarde bem, não será mostrada novamente

---

## 📝 Template .env Completo

Copie e cole no seu arquivo `.env`:

```bash
# ===== WhatsApp Cloud API =====
WHATSAPP_TOKEN=EAAx...sua_token_aqui
PHONE_NUMBER_ID=123456789012345
VERIFY_TOKEN=juli_verify_2025_secreto
APP_SECRET=abc123def456...

# ===== OpenAI =====
OPENAI_API_KEY=sk-...sua_chave_aqui

# ===== Segurança & Admin =====
ADMIN_PHONE=5577999999999
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60000

# ===== Aplicação =====
PORT=3000
LOG_LEVEL=info
NODE_ENV=development
```

---

## ✅ Checklist de Validação

- [ ] Meta for Developers app criado
- [ ] WhatsApp produto adicionado
- [ ] Número pessoal adicionado e verificado
- [ ] Token de acesso copiado
- [ ] Phone Number ID copiado
- [ ] App Secret copiado
- [ ] Verify Token criado
- [ ] OpenAI account criada
- [ ] Créditos OpenAI adicionados
- [ ] API Key OpenAI gerada
- [ ] Arquivo .env preenchido

**Próximo passo**: Testar localmente
