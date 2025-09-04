#!/usr/bin/env bash
set -euo pipefail

echo "🤖 Juli WhatsApp Bot - Setup Inteligente"
echo "======================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "📥 Baixe em: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Instalar dependências
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo "✅ Dependências instaladas"
else
    echo "✅ Dependências já instaladas"
fi

# Verificar .env
if [ ! -f .env ]; then
    echo "📄 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  Configure o .env com suas credenciais antes de continuar"
    echo "📖 Consulte CREDENTIALS_GUIDE.md para obter as credenciais"
    exit 0
fi

# Verificar se credenciais estão configuradas
source .env
if [[ "$WHATSAPP_TOKEN" == "your_whatsapp_access_token_here" ]] || [[ -z "$WHATSAPP_TOKEN" ]]; then
    echo "⚠️  WHATSAPP_TOKEN não configurado no .env"
    echo "📖 Consulte CREDENTIALS_GUIDE.md para configurar"
    echo ""
    echo "🚀 Opções disponíveis:"
    echo "1. Configure .env e execute: npm start"
    echo "2. Teste completo: ./scripts/test-complete.sh"
    echo "3. Deploy: ./scripts/deploy.sh"
    exit 0
fi

echo "✅ Configuração validada"
echo "🚀 Iniciando Juli WhatsApp Bot..."
npm start
