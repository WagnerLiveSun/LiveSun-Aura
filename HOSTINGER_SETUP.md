# Configuração do Hostinger para LiveSun Sunset

## 🎯 Resumo do que você precisa:

### 1. Plano e Servidor
- **Cloud Hosting** (recomendado) ou **VPS**
- Node.js suportado
- MySQL Database
- Domínio configurado

### 2. Acesso SSH
- Host: seu-servidor.com
- Porta: 2222 (padrão Hostinger)
- Usuário: seu usuário do Hostinger
- Senha: sua senha do Hostinger

### 3. Credenciais do Banco de Dados
- Database name (criado no painel Hostinger)
- Database user (criado no painel Hostinger)
- Database password (criado no painel Hostinger)
- Host: geralmente `localhost`

## 📝 Checklist Pré-Deploy

### ✅ No Painel do Hostinger

1. **Criar Banco de Dados MySQL**
   - Acesse: Databases → MySQL Databases
   - Clique em "Create database"
   - Nome: `livesun_sunset`
   - Clique em "Create user"
   - Usuário: `livesun_user`
   - Senha: (gere uma senha forte)
   - Anote todas as credenciais

2. **Configurar Domínio**
   - Acesse: Domains
   - Se já tem domínio, configure DNS
   - Se não, registre um novo domínio

3. **Ativar SSL**
   - Acesse: Domains → SSL
   - Ative Let's Encrypt (gratuito)
   - Configure redirecionamento HTTP → HTTPS

4. **Verificar Node.js**
   - Acesse: Advanced → Node.js
   - Verifique versão disponível (deve ser 18+)
   - Anote o caminho do Node.js

### ✅ No seu Computador Local

1. **Testar build local**
   ```bash
   cd D:\App_LiveSun\LiveSun_SunSet
   pnpm install
   pnpm build
   ```

2. **Criar arquivo `.env` local (para teste)**
   ```env
   DATABASE_URL=mysql://livesun_user:senha@localhost:3306/livesun_sunset
   JWT_SECRET=chave_secreta_aleatoria_minimo_32_caracteres
   OAUTH_SERVER_URL=https://seu-oauth-server.com
   VITE_APP_ID=seu_app_id
   OWNER_OPEN_ID=seu_owner_open_id
   NODE_ENV=production
   ```

3. **Testar aplicação local**
   ```bash
   pnpm start
   ```
   Acesse: http://localhost:3000

## 🚀 Passo a Passo de Deploy

### Passo 1: Acesso SSH
```bash
ssh usuario@seu-servidor.com -p 2222
```

### Passo 2: Instalar PNPM (se não estiver instalado)
```bash
npm install -g pnpm
```

### Passo 3: Criar diretório do projeto
```bash
cd ~/public_html
mkdir livesun-sunset
cd livesun-sunset
```

### Passo 4: Criar arquivo `.env`
```bash
nano .env
```

Cole:
```env
DATABASE_URL=mysql://livesun_user:SUA_SENHA@localhost:3306/livesun_sunset
JWT_SECRET=SUA_CHAVE_SECRETA_AQUI_MINIMO_32_CARACTERES
OAUTH_SERVER_URL=https://seu-oauth-server.com
VITE_APP_ID=seu_app_id
OWNER_OPEN_ID=seu_owner_open_id
NODE_ENV=production
```

Pressione `Ctrl+O`, `Enter`, `Ctrl+X` para salvar.

### Passo 5: Upload dos arquivos
**Opção A: Usando script automático**
```bash
# No seu computador local
cd D:\App_LiveSun\LiveSun_SunSet
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh usuario@seu-servidor.com
```

**Opção B: Upload manual**
```bash
# No seu computador local
cd D:\App_LiveSun\LiveSun_SunSet
tar -czf livesun-sunset.tar.gz --exclude=node_modules --exclude=.git --exclude=dist .

# Upload via SCP
scp -P 2222 livesun-sunset.tar.gz usuario@seu-servidor.com:~/public_html/livesun-sunset/

# No servidor
ssh usuario@seu-servidor.com -p 2222
cd ~/public_html/livesun-sunset
tar -xzf livesun-sunset.tar.gz
rm livesun-sunset.tar.gz
```

### Passo 6: Instalar dependências no servidor
```bash
cd ~/public_html/livesun-sunset
pnpm install --production
```

### Passo 7: Build no servidor
```bash
pnpm build
```

### Passo 8: Rodar migrations do banco de dados
```bash
pnpm db:push
```

### Passo 9: Instalar e configurar PM2
```bash
npm install -g pm2
pm2 start dist/index.js --name livesun-sunset
pm2 save
pm2 startup
```

### Passo 10: Configurar Node.js no Hostinger (se necessário)
- Acesse o painel Hostinger
- Vá em: Advanced → Node.js
- Clique em "Create application"
- Configure:
  - Project root: `/home/usuario/public_html/livesun-sunset`
  - Application mode: `Production`
  - Application URL: `seusite.com`
  - Application root: `dist`
  - Startup file: `index.js`

## 🔧 Configuração de Domínio e Proxy

### Se estiver usando Cloud Hosting com painel:
1. Acesse: Advanced → Node.js
2. Configure a aplicação conforme acima
3. O Hostinger vai configurar o proxy automaticamente

### Se estiver usando VPS com Nginx:
Crie arquivo de configuração:
```bash
sudo nano /etc/nginx/sites-available/livesun-sunset
```

Adicione:
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

Ative:
```bash
sudo ln -s /etc/nginx/sites-available/livesun-sunset /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🧪 Testes

### Verificar se está rodando:
```bash
pm2 status
pm2 logs livesun-sunset
```

### Testar localmente no servidor:
```bash
curl http://localhost:3000
```

### Testar do seu computador:
```bash
curl https://seusite.com
```

Acesse no navegador: `https://seusite.com`

## 🔄 Atualizações Futuras

Para atualizar o projeto:

**Opção A: Script automático**
```bash
./deploy-hostinger.sh usuario@seu-servidor.com
```

**Opção B: Manual**
```bash
# No servidor
cd ~/public_html/livesun-sunset
git pull  # se estiver usando git
# ou faça upload dos novos arquivos

pnpm install --production
pnpm build
pnpm db:push  # se houver migrations novas
pm2 restart livesun-sunset
```

## 📊 Monitoramento

```bash
# Verificar status
pm2 status

# Verificar logs em tempo real
pm2 logs livesun-sunset

# Monitorar
pm2 monit

# Reiniciar
pm2 restart livesun-sunset

# Parar
pm2 stop livesun-sunset
```

## ⚠️ Problemas Comuns

### Erro: "Cannot find module"
- Solução: `pnpm install --production`

### Erro: "Database connection failed"
- Solução: Verifique `.env` e credenciais MySQL

### Erro: "Port already in use"
- Solução: `pm2 stop livesun-sunset` e tente novamente

### Erro: "Permission denied"
- Solução: `chmod -R 755 ~/public_html/livesun-sunset`

## 📞 Suporte

- Painel Hostinger: hpanel.hostinger.com
- SSH: `ssh usuario@seu-servidor.com -p 2222`
- Documentação: https://support.hostinger.com