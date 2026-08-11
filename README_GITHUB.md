# 🌅 LiveSun Aura - Sistema de Gestão de Clínica de Bronzeamento

Sistema completo de gestão para clínicas de bronzeamento com autenticação local, controle de agenda, prontuários, financeiro e muito mais.

## 🎯 Características

- ✅ **Autenticação Local**: Login com e-mail e senha (sem dependência de OAuth)
- ✅ **Gestão de Agenda**: Agendamentos, confirmações e controle de horários
- ✅ **Prontuários Eletrônicos**: Histórico completo de clientes
- ✅ **Financeiro**: Contas a receber, pagamentos e relatórios
- ✅ **Gestão de Usuários**: Perfis (admin, recepção, profissional, cliente)
- ✅ **Recuperação de Senha**: Sistema seguro de redefinição
- ✅ **Dashboard Interativo**: Visualização em tempo real
- ✅ **Segurança**: Hash Argon2, bloqueio automático, tokens seguros

## 🏗️ Tecnologias

### Frontend
- React 19.2.1
- TypeScript 5.9.3
- Tailwind CSS 4.1.14
- Radix UI Components
- Wouter (Routing)
- React Query (State Management)

### Backend
- Node.js (Express 4.21.2)
- Drizzle ORM 0.44.5
- MySQL 8.x
- tRPC 11.6.0 (Type-safe API)
- Argon2 (Password Hashing)
- JWT (Session Management)

## 🚀 Deploy Atual

**Repositório**: https://github.com/WagnerLiveSun/LiveSun-Aura.git

**Arquitetura Híbrida**:
- **Aplicação**: Render.com (Node.js)
- **Banco de Dados**: Hostinger (MySQL)

## 📋 Pré-requisitos

- Node.js 18+
- pnpm 10+
- MySQL 8.x
- Conta no Render.com
- Conta no Hostinger (para MySQL)

## 🔧 Instalação Local

```bash
# Clone o repositório
git clone https://github.com/WagnerLiveSun/LiveSun-Aura.git
cd LiveSun-Aura

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Rode migrations
pnpm db:push

# Crie administrador
pnpm tsx scripts/create-admin.mjs

# Inicie o servidor
pnpm dev
```

Acesse: `http://localhost:3000/entrar`

## 🌐 Deploy em Produção

### Opção 1: Deploy Híbrido (Recomendado)

**Frontend + Backend**: Render.com
**Banco de Dados**: Hostinger MySQL

Siga o guia: [DEPLOY_GITHUB_RENDER.md](./DEPLOY_GITHUB_RENDER.md)

### Opção 2: Completo no Hostinger

Tudo no Hostinger (Node.js + MySQL)

Siga o guia: [DEPLOY_HOSTINGER.md](./DEPLOY_HOSTINGER.md)

## 🔐 Autenticação Local

O sistema usa autenticação local com e-mail e senha:

- **Login**: `/entrar`
- **Recuperação de Senha**: `/esqueci-senha`
- **Redefinição**: `/redefinir-senha`

### Segurança
- Senhas hash com Argon2
- Bloqueio após 5 tentativas falhas (15 minutos)
- Tokens de recuperação com expiração (1 hora)
- Sessões HTTP-only e secure

## 👥 Perfis de Usuário

- **admin**: Acesso total ao sistema
- **recepcao**: Gestão de agenda e clientes
- **profissional**: Agenda e prontuários
- **cliente**: Portal do cliente

## 📊 Estrutura do Projeto

```
LiveSun-Aura/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/ # Componentes UI
│   │   ├── pages/      # Páginas
│   │   └── lib/        # Utilitários
├── server/              # Backend Node.js
│   ├── _core/         # Core do servidor
│   ├── routers.ts     # Rotas tRPC
│   └── db.ts          # Conexão banco
├── drizzle/            # Schema e migrations
├── scripts/            # Scripts utilitários
└── shared/             # Código compartilhado
```

## 🧪 Scripts Disponíveis

```bash
pnpm dev          # Desenvolvimento
pnpm build        # Build para produção
pnpm start        # Iniciar produção
pnpm db:push      # Rodar migrations
pnpm test         # Rodar testes
pnpm check        # Verificar TypeScript
```

## 📚 Documentação

- [DEPLOY_GITHUB_RENDER.md](./DEPLOY_GITHUB_RENDER.md) - Deploy no GitHub + Render
- [DEPLOY_HIBRIDO_RENDER_HOSTINGER.md](./DEPLOY_HIBRIDO_RENDER_HOSTINGER.md) - Configuração Hostinger
- [AUTENTICACAO_LOCAL_IMPLEMENTADA.md](./AUTENTICACAO_LOCAL_IMPLEMENTADA.md) - Autenticação local
- [COMANDOS_DEPLOY.md](./COMANDOS_DEPLOY.md) - Comandos rápidos

## 🔒 Segurança

- ✅ Senhas hash com Argon2
- ✅ Proteção contra ataques de força bruta
- ✅ Tokens JWT seguros
- ✅ HTTPS obrigatório em produção
- ✅ Validação de entrada com Zod
- ✅ Proteção CSRF

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/WagnerLiveSun/LiveSun-Aura/issues)
- **Render**: [render.com/support](https://render.com/support)
- **Hostinger**: [support.hostinger.com](https://support.hostinger.com)

## 📄 Licença

MIT

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para LiveSun**