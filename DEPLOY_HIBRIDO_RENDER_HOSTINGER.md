# Guia de Deploy Híbrido: Render + Hostinger MySQL

## 🏗️ Arquitetura

- **Frontend + Backend (Node.js)**: Render.com
- **Banco de Dados MySQL**: Hostinger
- **Autenticação**: Local (e-mail e senha)

## 📋 Pré-requisitos

### Render.com
- Conta no Render (plano gratuito ou pago)
- Repositório Git (GitHub, GitLab, Bitbucket)
- Conhecimento básico de Git

### Hostinger
- Plano de hospedagem com MySQL
- Acesso ao painel hPanel
- Credenciais do banco de dados

## 🚀 Passo a Passo

### 1. Configurar Banco de Dados no Hostinger

#### 1.1. Criar Banco de Dados MySQL
1. Acesse o painel Hostinger (hpanel.hostinger.com)
2. Vá em **Databases** → **MySQL Databases**
3. Clique em **Create database**
4. Configure:
   - **Database name**: `livesun_sunset`
   - **Username**: `livesun_user`
   - **Password**: (gere uma senha forte e anote)
5. Clique em **Create**

#### 1.2. Configurar Acesso Remoto (Importante!)
Para que o Render acesse o MySQL do Hostinger:

1. No painel Hostinger, vá em **Databases** → **MySQL Databases**
2. Encontre seu banco criado
3. Clique em **Manage** ou **Configure**
4. Procure a opção **Remote MySQL** ou **Remote Access**
5. Adicione o IP/hosts permitidos:
   - Se o Render fornecer IPs específicos, adicione-os
   - Ou use `%` para permitir qualquer IP (menos seguro, mas funcional)
   - Ou use `%.render.com` se Render tiver domínio específico

#### 1.3. Anote as Credenciais
```
Host: mysql.hostinger.com (ou o host fornecido)
Port: 3306
Database: livesun_sunset
User: livesun_user
Password: SUA_SENHA
```

### 2. Preparar Projeto para Render

#### 2.1. Criar `render.yaml`
Crie arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  - type: web
    name: livesun-sunset
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: node dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false  # Será configurado manualmente no painel
      - key: JWT_SECRET
        sync: false  # Será configurado manualmente no painel
      - key: BREVO_API_KEY
        sync: false  # Opcional
      - key: BREVO_FROM_EMAIL
        sync: false  # Opcional
```

#### 2.2. Atualizar `.env.example`
```env
NODE_ENV=production
DATABASE_URL=mysql://livesun_user:SUA_SENHA@mysql.hostinger.com:3306/livesun_sunset
JWT_SECRET=SUA_CHAVE_SECRETA_AQUI_MINIMO_32_CARACTERES
BREVO_API_KEY=  # Opcional
BREVO_FROM_EMAIL=  # Opcional
```

#### 2.3. Atualizar `package.json`
Verifique se está com scripts corretos:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
    "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest run",
    "db:push": "drizzle-kit generate && drizzle-kit migrate"
  }
}
```

### 3. Configurar no Render

#### 3.1. Criar Repositório Git
```bash
cd D:\App_LiveSun\LiveSun_SunSet
git init
git add .
git commit -m "Initial commit - LiveSun Aura with local auth"
```

#### 3.2. Push para GitHub
```bash
# Conectar ao repositório existente
git remote add origin https://github.com/WagnerLiveSun/LiveSun-Aura.git
git branch -M main
git push -u origin main
```

#### 3.3. Criar Web Service no Render
1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **New** → **Web Service**
3. Conecte seu repositório (GitHub/GitLab)
4. Configure:
   - **Name**: `livesun-aura`
   - **Region**: Escolha a mais próxima do Hostinger
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/index.js`

#### 3.4. Configurar Variáveis de Ambiente no Render
No painel do Render, vá em **Environment**:

1. **NODE_ENV**: `production`
2. **DATABASE_URL**: `mysql://livesun_user:SUA_SENHA@mysql.hostinger.com:3306/livesun_sunset`
3. **JWT_SECRET**: (gere uma chave forte, mínimo 32 caracteres)
4. **BREVO_API_KEY**: (opcional, para e-mails)
5. **BREVO_FROM_EMAIL**: (opcional, para e-mails)

### 4. Rodar Migrations

#### 4.1. Opção A: Via SSH no Render (Recomendado)
1. No painel Render, vá em seu Web Service
2. Clique em **Shell** ou **SSH**
3. Rode:
```bash
cd /opt/render/project/src
pnpm db:push
```

#### 4.2. Opção B: Localmente (Conectando ao Hostinger)
```bash
# No seu computador local
DATABASE_URL="mysql://livesun_user:SUA_SENHA@mysql.hostinger.com:3306/livesun_sunset" pnpm db:push
```

### 5. Criar Primeiro Administrador

#### 5.1. Via SSH no Render
```bash
cd /opt/render/project/src
node scripts/create-admin.mjs
```

#### 5.2. Ou criar script inline no SSH
```bash
cd /opt/render/project/src
node -e "
const { hash } = require('argon2');
const { randomUUID } = require('crypto');

async function createAdmin() {
  const passwordHash = await hash('admin123');
  const openId = randomUUID();

  console.log('Copie e execute no banco de dados:');
  console.log(\`INSERT INTO users (openId, name, email, passwordHash, role, ativo, loginMethod, createdAt, updatedAt, lastSignedIn)
  VALUES ('\${openId}', 'Administrator', 'admin@livesun.com', '\${passwordHash}', 'admin', true, 'local', NOW(), NOW(), NOW());\`);
}

createAdmin();
"
```

### 6. Testar Deploy

#### 6.1. Verificar Logs no Render
- Acesse o painel Render
- Vá em **Logs** do seu Web Service
- Verifique se não há erros

#### 6.2. Acessar Aplicação
- URL será: `https://livesun-sunset.onrender.com`
- Ou seu domínio customizado se configurou

#### 6.3. Testar Login
1. Acesse a URL da aplicação
2. Use as credenciais do administrador criado
3. Verifique se consegue acessar o dashboard

### 7. Configurar Domínio Customizado (Opcional)

#### 7.1. No Render
1. Vá em **Domains** no seu Web Service
2. Clique em **Add Domain**
3. Adicione seu domínio: `suaclinica.com`

#### 7.2. Configurar DNS no Hostinger
1. No painel Hostinger, vá em **Domains**
2. Encontre seu domínio
3. Vá em **DNS Manager**
4. Adicione registro CNAME:
   - **Name**: `www` (ou `@` para raiz)
   - **Type**: `CNAME`
   - **Target**: `livesun-sunset.onrender.com`

#### 7.3. Configurar SSL
- O Render configurará SSL automaticamente
- Aguarde o certificado ser emitido (pode levar alguns minutos)

### 8. Monitoramento e Manutenção

#### 8.1. Monitorar no Render
- **Logs**: Acompanhe logs em tempo real
- **Metrics**: Veja CPU, memória, resposta
- **Deploy History**: Histórico de deploys

#### 8.2. Atualizações
```bash
# Localmente
git add .
git commit -m "Nova funcionalidade"
git push

# O Render fará deploy automático
```

#### 8.3. Backup do Banco de Dados
No Hostinger:
1. Vá em **Databases** → **MySQL Databases**
2. Encontre seu banco
3. Clique em **Backup** ou **Export**
4. Faça backups regulares

## 🔧 Troubleshooting

### Erro: "Connection refused" MySQL
- **Causa**: Acesso remoto não configurado no Hostinger
- **Solução**: Configure Remote MySQL no painel Hostinger

### Erro: "ECONNREFUSED"
- **Causa**: Firewall bloqueando conexão
- **Solução**: Verifique regras de firewall no Hostinger

### Erro: "Build failed"
- **Causa**: Dependências faltando ou erro de build
- **Solução**: Verifique logs, ajuste build command

### Erro: "Database connection timeout"
- **Causa**: Latência entre Render e Hostinger
- **Solução**: Considere usar banco de dados no mesmo provedor

### Erro: "Cannot find module"
- **Causa**: Dependências não instaladas
- **Solução**: Verifique se `pnpm install` está no build command

## 📊 Custos Estimados

### Render (Plano Gratuito)
- **Web Service**: Gratuito (com limites)
- **Limites**: 512MB RAM, 750 horas/mês
- **Downtime**: Após inatividade

### Render (Plano Pago)
- **Starter**: ~$7/mês (512MB RAM, sempre ativo)
- **Standard**: ~$25/mês (2GB RAM, melhor performance)

### Hostinger
- **MySQL**: Incluído na maioria dos planos
- **Custo adicional**: Geralmente zero

## 🔒 Segurança

### Recomendações
1. **Senhas fortes**: Use senhas complexas para banco e JWT
2. **HTTPS**: Render configura automaticamente
3. **Variáveis de ambiente**: Nunca commit credenciais
4. **Firewall**: Limite IPs que podem acessar o MySQL
5. **Backups**: Faça backups regulares do banco

### Monitoramento
- Configure alertas no Render para erros
- Monitore uso de recursos
- Revise logs regularmente

## 📞 Suporte

- **Render**: [render.com/support](https://render.com/support)
- **Hostinger**: [support.hostinger.com](https://support.hostinger.com)
- **Documentação Render**: [render.com/docs](https://render.com/docs)

## 🔄 Próximos Passos

1. ✅ Configurar banco no Hostinger
2. ✅ Deploy no Render
3. ✅ Rodar migrations
4. ✅ Criar administrador
5. ✅ Testar autenticação local
6. ✅ Configurar domínio customizado
7. ✅ Configurar monitoramento