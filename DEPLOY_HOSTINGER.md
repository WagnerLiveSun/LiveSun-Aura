# Guia de Deploy no Hostinger

## 📋 Pré-requisitos

- Plano Hostinger com Node.js (Cloud Hosting ou VPS)
- Acesso SSH ao servidor
- MySQL configurado no Hostinger
- Domínio configurado no Hostinger

## 🚀 Passo a Passo de Deploy

### 1. Preparação do Projeto

#### 1.1. Criar arquivo `.env` no servidor
```bash
# No servidor SSH
cd ~/public_html
nano .env
```

Adicione as variáveis de ambiente:
```env
DATABASE_URL=mysql://usuario_hostinger:senha@localhost:3306/nome_banco_hostinger
JWT_SECRET=chave_secreta_aleatoria_minimo_32_caracteres
OAUTH_SERVER_URL=https://seu-oauth-server.com
VITE_APP_ID=seu_app_id
OWNER_OPEN_ID=seu_owner_open_id
NODE_ENV=production
```

#### 1.2. Upload dos arquivos
```bash
# No seu computador local
cd D:\App_LiveSun\LiveSun_SunSet

# Compactar projeto (excluindo node_modules)
tar -czf livesun-sunset.tar.gz --exclude=node_modules --exclude=.git --exclude=dist .

# Upload via SCP (ou use FileZilla)
scp livesun-sunset.tar.gz usuario@seu-servidor.com:~/public_html/
```

#### 1.3. Extrair e configurar no servidor
```bash
# No servidor SSH
cd ~/public_html
tar -xzf livesun-sunset.tar.gz
rm livesun-sunset.tar.gz

# Instalar dependências
pnpm install --production
```

### 2. Configuração do Banco de Dados

#### 2.1. Criar banco de dados MySQL
- Acesse o painel do Hostinger
- Vá em "Databases" → "MySQL Databases"
- Crie um novo banco de dados
- Crie um usuário e senha
- Anote as credenciais

#### 2.2. Rodar migrations
```bash
# No servidor SSH
cd ~/public_html
pnpm db:push
```

### 3. Build do Projeto

```bash
# No servidor SSH
cd ~/public_html
pnpm build
```

### 4. Configuração do Servidor Web

#### 4.1. Opção A: Usando Node.js diretamente (Recomendado)

Crie arquivo `server.js`:
```javascript
const express = require('express');
const path = require('path');
const { createServer } = require('http');
const next = require('next');

const app = express();
const port = process.env.PORT || 3000;

// Servir arquivos estáticos do build
app.use(express.static(path.join(__dirname, 'dist/public')));

// API routes
const server = require('./dist/index.js');

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
```

#### 4.2. Opção B: Usando PM2 (Production Process Manager)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start dist/index.js --name livesun-sunset

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

### 5. Configuração do Domínio

#### 5.1. Configurar DNS
- No painel do Hostinger, vá em "Domains"
- Configure o DNS para apontar para o servidor
- Aguarde a propagação (pode levar até 24h)

#### 5.2. Configurar SSL (HTTPS)
- No painel do Hostinger, ative o SSL gratuito (Let's Encrypt)
- Configure redirecionamento HTTP → HTTPS

### 6. Configuração de Proxy (Nginx - se aplicável)

Se estiver usando VPS com Nginx:

```nginx
server {
    listen 80;
    server_name seusite.com www.seusite.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. Testes

```bash
# Verificar se está rodando
pm2 status

# Verificar logs
pm2 logs livesun-sunset

# Testar acesso
curl http://localhost:3000
```

## 🔧 Troubleshooting

### Erro de conexão com banco de dados
- Verifique se `DATABASE_URL` está correta no `.env`
- Verifique se o MySQL está rodando
- Verifique permissões do usuário MySQL

### Erro de build
- Verifique se todas as dependências estão instaladas
- Verifique versão do Node.js (deve ser compatível)
- Limpe cache: `rm -rf node_modules dist && pnpm install && pnpm build`

### Erro de permissão
- Verifique permissões de arquivos: `chmod -R 755 ~/public_html`
- Verifique dono dos arquivos: `chown -R usuario:usuario ~/public_html`

## 📊 Monitoramento

```bash
# Monitorar em tempo real
pm2 monit

# Reiniciar aplicação
pm2 restart livesun-sunset

# Parar aplicação
pm2 stop livesun-sunset
```

## 🔄 Atualizações Futuras

```bash
# Para atualizar o projeto
cd ~/public_html
git pull  # se estiver usando git
# ou upload dos novos arquivos

pnpm install --production
pnpm build
pm2 restart livesun-sunset
pnpm db:push  # se houver migrations novas
```

## 📞 Suporte Hostinger

- Painel: hpanel.hostinger.com
- Documentação: https://support.hostinger.com
- SSH: ssh usuario@seu-servidor.com -p 2222 (porta pode variar)