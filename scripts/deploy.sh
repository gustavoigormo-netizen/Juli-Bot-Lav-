#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Juli WhatsApp Bot - Deploy Automatizado"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Verificar se .env existe
if [ ! -f .env ]; then
    log_error ".env não encontrado!"
    echo "Execute: cp .env.example .env e configure as credenciais"
    exit 1
fi

# Carregar variáveis
source .env

# Verificar credenciais
REQUIRED_VARS=("WHATSAPP_TOKEN" "PHONE_NUMBER_ID" "VERIFY_TOKEN" "APP_SECRET" "OPENAI_API_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]] || [[ "${!var}" == *"your_"* ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log_error "Variáveis não configuradas: ${MISSING_VARS[*]}"
    echo "📖 Consulte CREDENTIALS_GUIDE.md para configurar"
    exit 1
fi

log_success "Todas as credenciais configuradas"

# Menu de opções de deploy
echo ""
echo "Escolha a plataforma de deploy:"
echo "1) Railway (Recomendado - Grátis)"
echo "2) Render"
echo "3) Docker Local"
echo "4) Cancelar"
echo ""
read -p "Opção (1-4): " DEPLOY_OPTION

case $DEPLOY_OPTION in
    1)
        log_info "Deploy no Railway selecionado"
        
        # Verificar Railway CLI
        if ! command -v railway &> /dev/null; then
            log_info "Instalando Railway CLI..."
            npm install -g @railway/cli
        fi
        
        # Login (se necessário)
        if ! railway whoami &> /dev/null; then
            log_info "Faça login no Railway:"
            railway login
        fi
        
        # Criar projeto
        log_info "Criando projeto no Railway..."
        railway new || true
        railway link || true
        
        # Configurar variáveis
        log_info "Configurando variáveis de ambiente..."
        railway variables set WHATSAPP_TOKEN="$WHATSAPP_TOKEN"
        railway variables set PHONE_NUMBER_ID="$PHONE_NUMBER_ID"
        railway variables set VERIFY_TOKEN="$VERIFY_TOKEN"
        railway variables set APP_SECRET="$APP_SECRET"
        railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
        railway variables set NODE_ENV="production"
        railway variables set PORT="3000"
        railway variables set LOG_LEVEL="info"
        railway variables set ADMIN_PHONE="${ADMIN_PHONE:-5577999999999}"
        railway variables set RATE_LIMIT_MAX="${RATE_LIMIT_MAX:-10}"
        railway variables set RATE_LIMIT_WINDOW="${RATE_LIMIT_WINDOW:-60000}"
        
        # Deploy
        log_info "Fazendo deploy..."
        railway up
        
        # Obter URL
        sleep 5
        DEPLOY_URL=$(railway domain 2>/dev/null | head -n1 || echo "")
        
        if [[ ! -z "$DEPLOY_URL" ]]; then
            log_success "Deploy concluído!"
            echo ""
            echo "🌐 URL de Produção: https://$DEPLOY_URL"
            echo "📱 Webhook URL: https://$DEPLOY_URL/webhook"
            echo "🏥 Health Check: https://$DEPLOY_URL/health"
            echo ""
            echo "📝 Próximos passos:"
            echo "1. Configure o webhook no Meta for Developers"
            echo "2. URL: https://$DEPLOY_URL/webhook"
            echo "3. Token: $VERIFY_TOKEN"
        else
            log_warning "Deploy feito, mas URL não obtida automaticamente"
            echo "Execute: railway domain"
        fi
        ;;
        
    2)
        log_info "Deploy no Render selecionado"
        echo ""
        echo "📝 Passos manuais para Render:"
        echo "1. Acesse: https://render.com/"
        echo "2. Conecte sua conta GitHub"
        echo "3. Crie novo 'Web Service'"
        echo "4. Conecte este repositório"
        echo "5. Configure:"
        echo "   - Build Command: npm install"
        echo "   - Start Command: npm start"
        echo "   - Environment: Node.js"
        echo "6. Adicione as variáveis de ambiente:"
        
        for var in "${REQUIRED_VARS[@]}"; do
            echo "   - $var = ${!var}"
        done
        
        echo "   - NODE_ENV = production"
        echo "   - PORT = 3000"
        ;;
        
    3)
        log_info "Deploy Docker local selecionado"
        
        # Build da imagem
        log_info "Fazendo build da imagem Docker..."
        docker build -t juli-bot .
        
        # Parar container anterior se existir
        docker stop juli-bot 2>/dev/null || true
        docker rm juli-bot 2>/dev/null || true
        
        # Criar .env.production
        log_info "Criando .env.production..."
        cat > .env.production << EOF
WHATSAPP_TOKEN=$WHATSAPP_TOKEN
PHONE_NUMBER_ID=$PHONE_NUMBER_ID
VERIFY_TOKEN=$VERIFY_TOKEN
APP_SECRET=$APP_SECRET
OPENAI_API_KEY=$OPENAI_API_KEY
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
ADMIN_PHONE=${ADMIN_PHONE:-5577999999999}
RATE_LIMIT_MAX=${RATE_LIMIT_MAX:-10}
RATE_LIMIT_WINDOW=${RATE_LIMIT_WINDOW:-60000}
EOF
        
        # Run container
        log_info "Iniciando container..."
        docker run -d \
          --name juli-bot \
          --env-file .env.production \
          -p 3000:3000 \
          --restart unless-stopped \
          juli-bot
        
        log_success "Container iniciado!"
        echo ""
        echo "🐳 Container: juli-bot"
        echo "🌐 URL Local: http://localhost:3000"
        echo "📱 Para expor: ngrok http 3000"
        echo "📊 Logs: docker logs juli-bot -f"
        ;;
        
    4)
        log_info "Deploy cancelado"
        exit 0
        ;;
        
    *)
        log_error "Opção inválida"
        exit 1
        ;;
esac

log_success "Deploy concluído com sucesso!"
