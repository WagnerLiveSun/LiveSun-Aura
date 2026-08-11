# Migração para autenticação local — Aura Gestão Estética

## Objetivo

O projeto atual usa autenticação OAuth integrada à plataforma. Por isso, ao abrir o sistema, a pessoa informa um e-mail para entrar por esse provedor. Para operar o Aura de forma independente em um servidor local, VPS ou outra hospedagem, substitua essa etapa por um **login próprio com e-mail e senha**.

> A troca de autenticação não altera os perfis já implementados — `admin`, `recepcao`, `profissional` e `cliente`. Ela apenas muda como a identidade do usuário é confirmada antes que as permissões sejam aplicadas.

## Pré-requisitos locais

| Item | Recomendação |
|---|---|
| Runtime | Node.js 22 e pnpm 10 |
| Banco de dados | MySQL 8.x ou TiDB compatível com MySQL |
| ORM e migrações | Drizzle ORM, já presente no projeto |
| Senhas | `argon2` para hash e verificação |
| E-mail de recuperação | Brevo SMTP/API, já usado pelos lembretes, ou outro provedor transacional |
| Arquivos clínicos | Bucket S3 privado ou serviço compatível com S3 |

## Arquivos que devem ser modificados

| Arquivo | O que fazer |
|---|---|
| `drizzle/schema.ts` | Acrescentar dados de senha, recuperação e verificação ao usuário. |
| `server/db.ts` | Criar consultas de usuário por e-mail e rotinas de atualização de senha. |
| `server/routers.ts` | Adicionar `auth.login`, `auth.criarUsuario`, `auth.solicitarRedefinicao` e `auth.redefinirSenha`. |
| `server/_core/sdk.ts` | Manter a assinatura/verificação do cookie JWT, mas evitar sincronização OAuth para identidades locais. |
| `server/_core/oauth.ts` | Remover do bootstrap do servidor ou deixar desabilitado em ambiente local. |
| `server/_core/index.ts` | Remover a chamada `registerOAuthRoutes(app)` quando o login próprio estiver concluído. |
| `client/src/_core/hooks/useAuth.ts` | Remover `startLogin()` e redirecionar usuários não autenticados para `/entrar`. |
| `client/src/components/DashboardLayout.tsx` e `client/src/pages/Home.tsx` | Trocar botões que chamam `startLogin()` pelo link para `/entrar`. |
| `client/src/pages/Login.tsx` | Criar formulário de e-mail e senha, com estado de carregamento e mensagens de erro. |
| `client/src/App.tsx` | Registrar as rotas `/entrar`, `/esqueci-a-senha` e `/redefinir-senha`. |

## 1. Alterar o modelo de usuários

Hoje, `users` possui `openId`, nome, e-mail, telefone, perfil e status. Preserve o campo `openId` para não quebrar relações existentes, mas passe a gerar um UUID interno para usuários criados localmente.

Adicione ao objeto `users` em `drizzle/schema.ts` os campos abaixo. O e-mail deve receber índice único, pois será o identificador de entrada.

```ts
passwordHash: varchar("passwordHash", { length: 255 }),
emailVerifiedAt: timestamp("emailVerifiedAt"),
failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
lockedUntil: timestamp("lockedUntil"),
passwordChangedAt: timestamp("passwordChangedAt"),
```

Crie também uma tabela `password_reset_tokens`, contendo `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt` e `createdAt`. Guarde apenas o **hash** do token no banco; o token puro só deve aparecer no link enviado por e-mail.

Depois, gere e aplique a migração:

```bash
pnpm drizzle-kit generate
# revise o SQL gerado em drizzle/
pnpm drizzle-kit migrate
```

## 2. Instalar o hash de senha

No diretório do projeto, instale Argon2:

```bash
pnpm add argon2
```

Ao criar ou redefinir uma senha, use `argon2.hash(senha)`. Na entrada, use `argon2.verify(user.passwordHash, senha)`. Nunca salve senhas em texto puro, não use MD5/SHA simples e não registre senha em logs.

Use uma política mínima: 12 caracteres, ao menos uma letra e um número. Aplique limitação de tentativas: após, por exemplo, cinco falhas, defina `lockedUntil` por 15 minutos.

## 3. Criar as rotas de autenticação local

Em `server/routers.ts`, mantenha `auth.me` e `auth.logout`. Acrescente quatro procedimentos:

| Procedimento | Perfil que pode usar | Função |
|---|---|---|
| `auth.login` | Público | Recebe e-mail e senha; procura o usuário, verifica se está ativo e valida Argon2. |
| `auth.criarUsuario` | Administrador | Cria recepcionista, profissional ou gestor com senha temporária. |
| `auth.solicitarRedefinicao` | Público | Cria token com validade curta e envia o link por e-mail sem revelar se o e-mail existe. |
| `auth.redefinirSenha` | Público com token válido | Valida o token, altera o hash, invalida o token e encerra sessões antigas. |

No sucesso de `auth.login`, emita o mesmo cookie de sessão HTTP-only já usado pelo projeto. A sessão deve conter a identidade interna (`openId`/UUID), nome e expiração. O cookie deve ser `httpOnly`, `secure` em HTTPS e `sameSite: "lax"` quando front-end e API usam o mesmo domínio.

O `sdk.authenticateRequest` em `server/_core/sdk.ts` já verifica o JWT e busca o usuário por `openId`. Para usuários locais, basta garantir que o usuário já exista no banco; remova apenas o bloco que tenta consultar o provedor OAuth quando o usuário não é encontrado. Preserve o tratamento especial de tarefas agendadas com prefixo `cron_`.

## 4. Remover a dependência do login OAuth

Quando o login local estiver funcionando, retire a chamada abaixo de `server/_core/index.ts`:

```ts
registerOAuthRoutes(app);
```

Em seguida, elimine as chamadas a `startLogin()` do front-end. O hook `client/src/_core/hooks/useAuth.ts` deve redirecionar para `/entrar` quando a pessoa não possuir sessão, em vez de criar o nonce OAuth. Os botões de entrada em `DashboardLayout.tsx` e em outras telas devem apontar para essa rota.

## 5. Criar a tela de entrada

Crie `client/src/pages/Login.tsx` com formulário de e-mail e senha. A tela deve chamar `trpc.auth.login.useMutation()`. Após sucesso, invalide `trpc.auth.me` e redirecione para `/`.

Inclua links para “Esqueci minha senha” e, somente se necessário, para primeiro acesso. O cadastro de funcionários não deve ser aberto ao público: mantenha-o como ação exclusiva de administrador dentro de **Gestão**.

## 6. Variáveis de ambiente para execução fora da plataforma

Crie `.env` local, nunca o envie ao repositório. Um exemplo mínimo é:

```env
NODE_ENV=production
DATABASE_URL=mysql://usuario:senha@host:3306/aura
JWT_SECRET=gere-uma-chave-longa-e-aleatoria-de-pelo-menos-32-bytes
BREVO_API_KEY=sua-chave-brevo
BREVO_FROM_EMAIL=agenda@livesun.com.br
APP_BASE_URL=https://aura.livesun.com.br
```

Os valores `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID` e credenciais Forge deixam de ser necessários ao login. Porém, se você mantiver fotos clínicas no fluxo atual, será necessário substituir o armazenamento integrado por credenciais próprias de S3 (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`) ou adaptar `server/storage.ts` a outro provedor compatível.

## 7. Criar o primeiro administrador

Antes de expor o sistema, crie um script local, por exemplo `scripts/create-admin.mjs`, que aceite nome, e-mail e senha, gere `openId` com UUID e aplique `argon2.hash`. O perfil deve ser `admin` e `ativo` deve ser verdadeiro. Execute apenas em ambiente seguro:

```bash
pnpm tsx scripts/create-admin.mjs
```

Não coloque a senha inicial no código, em arquivos versionados ou em mensagens de log. Após o primeiro acesso, cadastre os demais usuários pelo módulo **Gestão**.

## 8. Testes mínimos antes de publicar

Valide obrigatoriamente os seguintes cenários:

1. Gestor ativo entra com e-mail e senha e acessa **Gestão** e **Financeiro**.
2. Recepção não acessa configurações administrativas sensíveis.
3. Profissional visualiza apenas sua agenda e seus prontuários permitidos.
4. Cliente não acessa dados de outros clientes.
5. Usuário inativo ou bloqueado não entra.
6. Redefinição de senha funciona apenas uma vez e expira.
7. Logout invalida a sessão no navegador.

Finalize sempre com:

```bash
pnpm check
pnpm test
pnpm build
```

## Observação sobre dados clínicos

Como o sistema armazena prontuários e imagens clínicas, mantenha HTTPS obrigatório, backups criptografados, acesso por menor privilégio, logs de auditoria e controle rigoroso de papéis. Antes do uso comercial, valide os requisitos de privacidade, retenção e segurança aplicáveis à sua operação.
