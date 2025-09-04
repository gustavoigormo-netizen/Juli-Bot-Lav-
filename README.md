# Juli – WhatsApp Bot (Lavô Praça do Feijão)

# 🤖 Juli - Assistente Virtual da Lavô Praça do Feijão

<div align="center">
  <strong>Bot WhatsApp inteligente e seguro para atendimento 24/7</strong>
  <br><br>
  <img src="https://img.shields.io/badge/WhatsApp-Business%20API-25D366?style=for-the-badge&logo=whatsapp" alt="WhatsApp Business API">
  <img src="https://img.shields.io/badge/OpenAI-GPT--3.5-412991?style=for-the-badge&logo=openai" alt="OpenAI GPT-3.5">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Security-Enterprise%20Grade-red?style=for-the-badge&logo=shield" alt="Enterprise Security">
</div>

## 🎯 Sobre a Juli

Juli é a assistente virtual oficial da **Lavô Praça do Feijão** (Guanambi-BA), uma lavanderia self-service que oferece atendimento automatizado 24/7 via WhatsApp.

### ✨ Principais Funcionalidades

- 🧠 **IA Conversacional**: Powered by OpenAI GPT-3.5
- 📱 **WhatsApp Cloud API**: Integração oficial e confiável
- 🔒 **Segurança Enterprise**: Rate limiting, validação de assinatura, logs auditáveis
- 🎭 **PNL para Vendas**: Técnicas de persuasão e conversão integradas
- 🔄 **Handoff Humano**: Transição suave para atendimento humano
- ⚡ **Alta Performance**: Fastify + otimizações de produção

## 🚀 Quick Start

### 1. Clonagem e Instalação
```bash
git clone https://github.com/seu-usuario/juli-whatsapp-bot.git
cd juli-whatsapp-bot
npm install
```

### 2. Configuração
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
```

### 3. Execução
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `WHATSAPP_TOKEN` | Token de acesso WhatsApp Cloud API | `EAAx...` |
| `PHONE_NUMBER_ID` | ID do número de telefone | `123456789` |
| `VERIFY_TOKEN` | Token para verificação webhook | `meu_token_secreto` |
| `APP_SECRET` | Secret do Facebook App | `abc123...` |
| `OPENAI_API_KEY` | Chave da API OpenAI | `sk-...` |

### Configuração WhatsApp Cloud API

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie um WhatsApp Business App
3. Configure o webhook: `https://seudominio.com/webhook`
4. Copie as credenciais para o `.env`

## 🛡️ Segurança

### Implementado
- ✅ Validação de assinatura webhook com `crypto.timingSafeEqual`
- ✅ Rate limiting por usuário (5 msgs/min)
- ✅ Rate limiting global configurável
- ✅ Headers de segurança (Helmet)
- ✅ CORS configurável
- ✅ Logs auditáveis com privacy
- ✅ Graceful shutdown
- ✅ Retry com backoff exponencial
- ✅ Timeout nas requisições

### Conformidade WhatsApp
- ✅ Opt-out/Opt-in obrigatório
- ✅ Cache de mensagens (anti-duplicação)
- ✅ Limite de caracteres respeitado
- ✅ User-Agent personalizado

## 📋 Comandos

### Para Usuários
- `SAIR` ou `STOP` - Opt-out de mensagens
- `VOLTA` - Reativar mensagens

### Para Administradores
- `#humano_on` - Ativar atendimento humano
- `#humano_off` - Voltar para IA

## 🔍 Monitoramento

### Endpoints
- `GET /` - Informações básicas
- `GET /health` - Status detalhado do sistema
- `POST /webhook` - Endpoint WhatsApp (privado)

### Logs Estruturados
```json
{
  "level": "info",
  "time": "2025-01-01T12:00:00.000Z",
  "action": "message_sent",
  "waId": "9999",
  "messageId": "wamid.xxx"
}
```

## � Deploy

### Opções Suportadas
- 🌐 **Railway/Render** (Recomendado)
- 🐳 **Docker** + VPS
- ⚙️ **PM2** + VPS tradicional

Ver [DEPLOY.md](./DEPLOY.md) para instruções detalhadas.

## 📚 Documentação

- [SECURITY.md](./SECURITY.md) - Guia de segurança completo
- [DEPLOY.md](./DEPLOY.md) - Instruções de deploy
- [scripts/run.sh](./scripts/run.sh) - Script de inicialização

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: suporte@lavopracadofeijao.com.br
- � WhatsApp: +55 77 9999-9999
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/juli-whatsapp-bot/issues)

---

<div align="center">
  <strong>Desenvolvido com ❤️ para a Lavô Praça do Feijão</strong>
  <br>
  <em>Transformando atendimento com IA e segurança enterprise</em>
</div>
- **Posso rodar no Xcode?** → O bot é **servidor**; use Xcode apenas para um app de **controle** (opcional).  
- **Precisa de VPS?** → Para 24/7 sim (Railway/Render/AWS). Para teste, ngrok no seu Mac resolve.

Boa jornada com a Juli! 💚
