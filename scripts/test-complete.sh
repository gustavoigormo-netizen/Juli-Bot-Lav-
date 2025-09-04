#!/usr/bin/env bash
set -euo pipefail

echo "🤖 Juli WhatsApp Bot - Script de Teste Completo"
echo "================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se .env existe e está configurado
if [ ! -f .env ]; then
    log_error ".env não encontrado!"
    echo "Execute: cp .env.example .env"
    echo "E configure suas credenciais conforme CREDENTIALS_GUIDE.md"
    exit 1
fi

# Verificar se as variáveis principais estão configuradas
source .env

if [[ "$WHATSAPP_TOKEN" == "your_whatsapp_access_token_here" ]] || [[ -z "$WHATSAPP_TOKEN" ]]; then
    log_warning "WHATSAPP_TOKEN ainda não configurado"
    echo "📖 Consulte CREDENTIALS_GUIDE.md para obter as credenciais"
    echo "🔗 Meta for Developers: https://developers.facebook.com/"
fi

if [[ "$OPENAI_API_KEY" == "your_openai_api_key_here" ]] || [[ -z "$OPENAI_API_KEY" ]]; then
    log_warning "OPENAI_API_KEY ainda não configurado"
    echo "📖 Consulte CREDENTIALS_GUIDE.md para obter a chave"
    echo "🔗 OpenAI Platform: https://platform.openai.com/"
fi

# Verificar dependências
log_info "Verificando dependências..."

if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado!"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm não encontrado!"
    exit 1
fi

if ! command -v ngrok &> /dev/null; then
    log_error "ngrok não encontrado!"
    echo "Execute: brew install ngrok"
    exit 1
fi

log_success "Todas as dependências encontradas"

# Instalar pacotes se necessário
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências npm..."
    npm install
    log_success "Dependências instaladas"
fi

# Testar se servidor inicia
log_info "Testando servidor..."
timeout 5 npm start &
SERVER_PID=$!
sleep 3

if curl -s http://localhost:3000/health > /dev/null; then
    log_success "Servidor funcionando!"
    kill $SERVER_PID 2>/dev/null || true
else
    log_error "Servidor não respondeu"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Iniciar servidor em background
log_info "Iniciando servidor em background..."
npm start &
SERVER_PID=$!
sleep 2

# Iniciar ngrok
log_info "Iniciando ngrok..."
ngrok http 3000 &
NGROK_PID=$!
sleep 3

# Obter URL do ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ "$NGROK_URL" != "null" ] && [ ! -z "$NGROK_URL" ]; then
    log_success "Ngrok funcionando!"
    echo ""
    echo "🌐 URLs de Teste:"
    echo "   Servidor Local: http://localhost:3000"
    echo "   Webhook URL:    ${NGROK_URL}/webhook"
    echo "   Health Check:   ${NGROK_URL}/health"
    echo ""
    echo "📝 Configure no Meta for Developers:"
    echo "   Callback URL:   ${NGROK_URL}/webhook"
    echo "   Verify Token:   ${VERIFY_TOKEN}"
    echo ""
    echo "📱 Teste enviando mensagem WhatsApp para seu número conectado"
    echo ""
    echo "⏹️  Para parar: Ctrl+C"
    echo ""
    
    # Manter rodando até Ctrl+C
    trap "log_info 'Parando serviços...'; kill $SERVER_PID $NGROK_PID 2>/dev/null || true; log_success 'Serviços parados'; exit 0" INT
    
    while true; do
        sleep 1
    done
else
    log_error "Falha ao obter URL do ngrok"
    kill $SERVER_PID $NGROK_PID 2>/dev/null || true
    exit 1
fi
