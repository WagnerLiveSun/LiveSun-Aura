# 🚀 Comandos Rápidos de Deploy - LiveSun Aura

## 📋 Pré-Deploy

### 1. Instalar Dependências
```bash
cd D:\App_LiveSun\LiveSun_SunSet
pnpm install
```

### 2. Configurar .env (criar arquivo)
```env
NODE_ENV=production
DATABASE_URL=mysql://livesun_user:SUA_SENHA@mysql.hostinger.com:3306/livesun_aura
JWT_SECRET=SUA_CHAVE_SECRETA_AQUI_MINIMO_32_CARACTERES
BREVO_API_KEY=
BREVO_FROM_EMAIL=
```

### 3. Rodar Migrations no Hostinger
```bash
DATABASE_URL="mysql://livesun_user:SUA_SENHA@mysql.hostinger.com:3306/livesun_aura" pnpm db:push
```

### 4. Criar Administrador
```bash
pnpm tsx scripts/create-admin.mjs
```

## 📤 Deploy para GitHub

### 5. Inicializar Git (se necessário)
```bash
cd D:\App_LiveSun\LiveSun_SunSet
git init
```

### 6. Adicionar e Commitar
```bash
git add .
git commit -m "Implement autenticação local - LiveSun Aura"
```

### 7. Conectar ao Repositório
```bash
git remote add origin https://github.com/WagnerLiveSun/LiveSun-Aura.git
git branch -M main
```

### 8. Push para GitHub
```bash
git push -u origin main
```

## ⚠️ Se houver erro no push

```bash
# Se o repositório já existe
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## 🌐 Configurar Render

### 9. Acessar Render
1. [dashboard.render.com](https://dashboard.render.com)
2. New → Web Service
3. Conectar repositório: `WagnerLiveSun/LiveSun-Aura`
4. Configurar:
   - Name: `livesun-aura`
   - Region: Oregon (ou mais próxima)
   - Branch: `main`
   - Runtime: Node
   - Build: `pnpm install && pnpm build`
   - Start: `node dist/index.js`

### 10. Variáveis de Ambiente no Render
- `NODE_ENV`: `production`
- `DATABASE_URL`: `mysql://livesun_user:SUA_SENHA@mysql.hostinger.com:3306/livesun_aura`
- `JWT_SECRET`: (sua chave secreta)

### 11. Rodar Migrations no Render
No Shell do Render:
```bash
cd /opt/render/project/src
pnpm db:push
```

## ✅ Testar

URL: `https://livesun-aura.onrender.com/entrar`

## 📚 Documentação Completa

- `DEPLOY_GITHUB_RENDER.md` - Guia detalhado
- `DEPLOY_HIBRIDO_RENDER_HOSTINGER.md` - Configuração Hostinger
- `AUTENTICACAO_LOCAL_IMPLEMENTADA.md` - Autenticação local