# Deploy do LiveSun Aura - GitHub + Render + Hostinger MySQL

## 🎯 Repositório GitHub
**URL**: https://github.com/WagnerLiveSun/LiveSun-Aura.git

## 📋 Pré-requisitos

- ✅ Repositório GitHub criado
- ✅ Conta no Render.com
- ✅ MySQL configurado no Hostinger
- ✅ Projeto pronto com autenticação local

## 🚀 Passo a Passo de Deploy

### 1. Preparar Projeto Local

#### 1.1. Instalar Dependências
```bash
cd D:\App_LiveSun\LiveSun_SunSet
pnpm install
```

#### 1.2. Configurar Banco de Dados Hostinger
No painel Hostinger:
1. Vá em **Databases** → **MySQL Databases**
2. Crie banco: `livesun_aura`
3. Crie usuário: `livesun_user`
4. Configure acesso remoto (Remote MySQL)
5. Anote credenciais

#### 1.3. Rodar Migrations
```bash
# Configure DATABASE_URL no .env primeiro
DATABASE_URL="mysql://livesun_user:SUA_SENHA@mysql.hostinger.com:3306/livesun_aura" pnpm db:push
```

#### 1.4. Criar Primeiro Administrador
```bash
pnpm tsx scripts/create-admin.mjs
```

### 2. Configurar Git e Push para GitHub

#### 2.1. Inicializar Git (se necessário)
```bash
cd D:\App_LiveSun\LiveSun_SunSet
git init
```

#### 2.2. Adicionar e Commitar Arquivos
```bash
git add .
git commit -m "Implement autenticação local - LiveSun Aura"
```

#### 2.3. Conectar ao Repositório GitHub
```bash
git remote add origin https://github.com/WagnerLiveSun/LiveSun-Aura.git
git branch -M main
```

#### 2.4. Push para GitHub
```bash
git push -u origin main
```

**Se houver erro:**
```bash
# Se o repositório já existir com commits
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### 3. Configurar no Render

#### 3.1. Criar Web Service
1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **New** → **Web Service**
3. Conecte seu repositório GitHub
4. Selecione `WagnerLiveSun/LiveSun-Aura`
5. Configure:
   - **Name**: `livesun-aura`
   - **Region**: Escolha a mais próxima (ex: Oregon)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/index.js`

#### 3.2. Configurar Variáveis de Ambiente
No painel Render, vá em **Environment** e adicione:

1. **NODE_ENV**: `production`
2. **DATABASE_URL**: `mysql://livesun_user:SUA_SENHA@mysql.hostinger.com:3306/livesun_aura`
3. **JWT_SECRET**: (gere uma chave forte, mínimo 32 caracteres)
4. **BREVO_API_KEY**: (opcional, para e-mails)
5. **BREVO_FROM_EMAIL**: (opcional, para e-mails)

#### 3.3. Deploy Automático
O Render fará deploy automático após conectar o repositório.

### 4. Rodar Migrations no Render

#### 4.1. Via SSH no Render
1. No painel Render, vá em seu Web Service
2. Clique em **Shell**
3. Rode:
```bash
cd /opt/render/project/src
pnpm db:push
```

### 5. Testar Deploy

#### 5.1. Verificar Logs
- No painel Render, vá em **Logs**
- Verifique se não há erros

#### 5.2. Acessar Aplicação
- URL será: `https://livesun-aura.onrender.com`
- Acesse `/entrar` para login

#### 5.3. Testar Login
1. Use credenciais do administrador criado
2. Verifique se consegue acessar o dashboard

### 6. Configurar Domínio Customizado (Opcional)

#### 6.1. No Render
1. Vá em **Domains** no seu Web Service
2. Clique em **Add Domain**
3. Adicione: `suaclinica.com`

#### 6.2. Configurar DNS no Hostinger
1. No painel Hostinger, vá em **Domains**
2. Encontre seu domínio
3. Vá em **DNS Manager**
4. Adicione registro CNAME:
   - **Name**: `www` (ou `@` para raiz)
   - **Type**: `CNAME`
   - **Target**: `livesun-aura.onrender.com`

## 🔧 Troubleshooting

### Erro: "Connection refused" MySQL
- **Causa**: Acesso remoto não configurado no Hostinger
- **Solução**: Configure Remote MySQL no painel Hostinger

### Erro: "Build failed"
- **Causa**: Dependências faltando
- **Solução**: Verifique logs, ajuste build command

### Erro: "Database connection timeout"
- **Causa**: Latência entre Render e Hostinger
- **Solução**: Verifique configuração de acesso remoto

### Erro ao Push para GitHub
```bash
# Se o repositório já existe
git remote -v
# Se mostrar outro remoto, remova:
git remote remove origin
# Adicione novamente:
git remote add origin https://github.com/WagnerLiveSun/LiveSun-Aura.git
git push -u origin main
```

## 📊 Monitoramento

### No Render
- **Logs**: Logs em tempo real
- **Metrics**: CPU, memória, resposta
- **Deploy History**: Histórico de deploys

### No Hostinger
- **MySQL Status**: Status do banco
- **Backups**: Backups automáticos

## 🔄 Atualizações Futuras

```bash
# Localmente
git add .
git commit -m "Nova funcionalidade"
git push

# O Render fará deploy automático
```

## 📞 Suporte

- **Render**: [render.com/support](https://render.com/support)
- **Hostinger**: [support.hostinger.com](https://support.hostinger.com)
- **GitHub**: [github.com/WagnerLiveSun/LiveSun-Aura](https://github.com/WagnerLiveSun/LiveSun-Aura)

## ✅ Checklist de Deploy

- [ ] Banco MySQL configurado no Hostinger
- [ ] Acesso remoto MySQL habilitado
- [ ] Dependências instaladas localmente
- [ ] Migrations rodadas no banco
- [ ] Administrador criado
- [ ] Projeto commitado no Git
- [ ] Push para GitHub realizado
- [ ] Web Service criado no Render
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Migrations rodadas no Render
- [ ] Login testado com sucesso
- [ ] Funcionalidades básicas testadas

## 🎉 Deploy Concluído!

Seu sistema LiveSun Aura está online e pronto para uso!

**URL de Acesso**: `https://livesun-aura.onrender.com/entrar`

**Repositório**: `https://github.com/WagnerLiveSun/LiveSun-Aura`