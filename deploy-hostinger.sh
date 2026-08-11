#!/bin/bash

# Script de Deploy para Hostinger
# Uso: ./deploy-hostinger.sh usuario@seu-servidor.com

SERVER=$1
PROJECT_NAME="livesun-sunset"
REMOTE_DIR="~/public_html"

if [ -z "$SERVER" ]; then
    echo "Uso: ./deploy-hostinger.sh usuario@seu-servidor.com"
    exit 1
fi

echo "🚀 Iniciando deploy para $SERVER..."

# 1. Limpar build anterior
echo "📦 Limpando build anterior..."
rm -rf dist
rm -f *.tar.gz

# 2. Instalar dependências
echo "📥 Instalando dependências..."
pnpm install

# 3. Build do projeto
echo "🔨 Building projeto..."
pnpm build

# 4. Compactar projeto (excluindo node_modules)
echo "📦 Compactando projeto..."
tar -czf ${PROJECT_NAME}.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=dist \
    --exclude=.env \
    --exclude=*.log \
    --exclude=.manus-logs \
    --exclude=.app-logs \
    .

# 5. Upload para servidor
echo "⬆️ Upload para servidor..."
scp ${PROJECT_NAME}.tar.gz ${SERVER}:${REMOTE_DIR}/

# 6. Deploy no servidor
echo "🔧 Configurando no servidor..."
ssh ${SERVER} << EOF
cd ${REMOTE_DIR}

# Backup do .env existente
if [ -f .env ]; then
    cp .env .env.backup
fi

# Limpar versão anterior
rm -rf dist_old
if [ -d dist ]; then
    mv dist dist_old
fi

# Extrair nova versão
tar -xzf ${PROJECT_NAME}.tar.gz
rm ${PROJECT_NAME}.tar.gz

# Instalar dependências
pnpm install --production

# Build no servidor
pnpm build

# Restaurar .env
if [ -f .env.backup ]; then
    mv .env.backup .env
fi

# Rodar migrations
pnpm db:push

# Reiniciar PM2
pm2 restart ${PROJECT_NAME} || pm2 start dist/index.js --name ${PROJECT_NAME}

echo "✅ Deploy concluído!"
EOF

# 7. Limpar arquivos locais
echo "🧹 Limpando arquivos temporários..."
rm -f ${PROJECT_NAME}.tar.gz

echo "✨ Deploy concluído com sucesso!"
echo "🌐 Acesse seu site em: https://seusite.com"