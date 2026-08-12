# CORRIGIR VARIÁVEIS DE AMBIENTE NO RENDER

## Problema
O erro "Failed query" está ocorrendo porque o Render está usando o hostname `mysql.hostinger.com` que não resolve DNS corretamente.

## Solução
Você precisa atualizar a variável de ambiente `DATABASE_URL` no painel do Render.

## Passos para Corrigir

1. **Acesse o painel do Render**
   - Vá para: https://dashboard.render.com
   - Faça login na sua conta

2. **Encontre o serviço livesun-aura**
   - Na lista de serviços, encontre "livesun-aura"
   - Clique no serviço

3. **Vá para Environment**
   - No menu lateral, clique em "Environment"
   - Você verá as variáveis de ambiente atuais

4. **Atualize a variável DATABASE_URL**
   - Encontre a variável `DATABASE_URL`
   - Clique no botão "Edit"
   - Substitua o valor atual por:
     ```
     mysql://u951548013_livesun_aura:quemsabe123!A@195.35.61.111:3306/u951548013_livesun_aura
     ```
   - Clique em "Save Changes"

5. **Trigger um novo deploy**
   - Após salvar as variáveis, o Render fará um deploy automático
   - Se não fizer automaticamente, clique em "Manual Deploy" -> "Deploy latest commit"

## Variáveis de Ambiente Corretas

```
NODE_ENV=production
DATABASE_URL=mysql://u951548013_livesun_aura:quemsabe123!A@195.35.61.111:3306/u951548013_livesun_aura
JWT_SECRET=5224f24e2b50a72e111f28ac279f5c01
BREVO_API_KEY=
BREVO_FROM_EMAIL=
```

## Importante
- ✅ Use o IP `195.35.61.111` em vez de `mysql.hostinger.com`
- ✅ Mantenha as credenciais `u951548013_livesun_aura` e `quemsabe123!A`
- ✅ O nome do banco de dados é `u951548013_livesun_aura`
- ✅ A porta é `3306`

## Verificação
Após o deploy, teste o login em:
https://aura.livesun.com.br/entrar

Com as credenciais:
- Email: admin@livesun.com.br
- Senha: admin123

## Observação
O arquivo `.env` local já foi atualizado com o IP correto, então localmente a conexão funciona. O problema é apenas no Render que precisa das variáveis atualizadas.
