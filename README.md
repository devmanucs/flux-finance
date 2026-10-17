# Flux Finance

Aplicação de finanças pessoais em monorepo: frontend Next.js, API NestJS e PostgreSQL acessado por Prisma.

## Onde os dados ficam

Os usuários, contas, transações, categorias e orçamentos são gravados no PostgreSQL do Supabase. O código da conexão está em `packages/database/prisma/schema.prisma`; o endereço do banco é a variável `DATABASE_URL`.

Este checkout não contém arquivos `.env` nem a URL real do banco. Durante a migração, confira `DATABASE_URL` nas variáveis do serviço da API no Railway e compare o host/projeto com **Supabase → Project Settings → Database**. Depois da migração, a URL ficará no serviço da API no Render. O arquivo `railway.json` configura o deploy da API; ele não guarda dados. Use a mesma `DATABASE_URL` para manter os registros existentes.

Reiniciar ou republicar a aplicação preserva os dados enquanto a instância PostgreSQL do Supabase continuar ativa. Se o projeto Supabase tiver sido pausado, reative-o no painel. Se o banco tiver sido excluído ou os dados removidos, a recuperação depende de um backup do Supabase; um deploy do código não restaura linhas apagadas.

## Rodar localmente

1. Instale Node.js 20 ou superior e pnpm 10.
2. Execute `pnpm install --frozen-lockfile`.
3. Crie `packages/database/.env` usando `packages/database/.env.example` e informe a `DATABASE_URL` do projeto correto.
4. Crie `apps/api/.env` usando `apps/api/.env.example` e configure `JWT_SECRET`, `WEB_APP_URL` e as credenciais Pluggy quando for testar Open Finance.
5. Crie `apps/web/.env.local` usando `apps/web/.env.example` e configure `NEXT_PUBLIC_API_URL`.
6. Gere o Prisma Client com `pnpm db:generate` e inicie os serviços com `pnpm dev`.

Não rode `db:push` contra uma URL de produção para tentar recuperar dados: ele altera o schema e não restaura registros.

## Pluggy

A conexão usa o widget oficial da Pluggy no navegador. O `CLIENT_ID` e o `CLIENT_SECRET` ficam apenas no backend; o navegador recebe um Connect Token de curta duração. Depois do consentimento, contas e transações vão para `accounts` e `transactions`, associadas ao usuário e à conexão. IDs externos garantem que webhooks repetidos não criem cópias.

Configure no serviço da API em produção:

- `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`: credenciais da aplicação no painel Pluggy.
- `API_PUBLIC_URL`: URL pública HTTPS da API, sem caminho adicional.
- `PLUGGY_WEBHOOK_SECRET`: segredo aleatório longo usado para validar webhooks.
- `DATABASE_URL`: a conexão PostgreSQL do Supabase já usada pelo sistema.

Para sandbox local, ative `NEXT_PUBLIC_PLUGGY_INCLUDE_SANDBOX=true` no frontend. Webhooks locais exigem URL pública HTTPS (por exemplo, um túnel); sem webhook, a conexão inicial ainda pode importar os dados, mas atualizações futuras não serão recebidas.

Antes do primeiro deploy da atualização, aplique a nova migração à mesma base indicada por `DATABASE_URL`:

```powershell
pnpm --filter @flux-finance/database exec prisma migrate deploy
```

Depois, publique API e frontend com suas respectivas variáveis de ambiente. A tela **Contas e cartões** permite conectar ou atualizar uma conexão. A API recebe os webhooks, grava os eventos numa fila PostgreSQL e sincroniza os dados; as telas abertas consultam o estado a cada 15 segundos.

## Migrar a API do Railway para o Render

O Railway deste projeto executa apenas a API (`railway.json`). O frontend já está configurado como um projeto Vercel em `apps/web/vercel.json`; ele pode continuar lá. O arquivo `render.yaml` define a API como um Render Blueprint e mantém o PostgreSQL no Supabase.

1. Envie o `render.yaml`, a migration Pluggy e o código atualizado para o repositório Git conectado ao Render. O Render não consegue publicar mudanças que existem apenas neste checkout.
2. Antes de criar/deployar a API no Render, aplique a migration Pluggy ao Supabase usando a mesma `DATABASE_URL` que está no Railway. O comando está na seção Pluggy acima. Não crie outro banco no Render.
3. No Render, escolha **New → Blueprint** e selecione o repositório. Revise o serviço `flux-finance-api` antes de criar.
4. Preencha `DATABASE_URL` com a URL do Supabase usada no Railway, `JWT_SECRET` com o segredo atual, `WEB_APP_URL` com o domínio de produção do Vercel e as credenciais `PLUGGY_CLIENT_ID` / `PLUGGY_CLIENT_SECRET`. O blueprint gera `PLUGGY_WEBHOOK_SECRET` e define `API_PUBLIC_URL` usando o endereço público do serviço Render.
5. Copie a URL pública exibida pelo Render para `NEXT_PUBLIC_API_URL` nas variáveis de produção do projeto Vercel e faça um novo deploy do frontend.
6. Se já houver conexões Pluggy, atualize o endereço de webhook de cada conexão para `API_PUBLIC_URL` no Render. Novas conexões já receberão o endereço novo.
7. Confira login, leitura e gravação de dados, conexão Pluggy e recebimento de webhook. Só depois desligue o serviço da API no Railway.

O plano gratuito do Render suspende a API após 15 minutos sem tráfego e pode levar cerca de um minuto para acordar. É adequado para validar a migração sem custo, mas webhooks da Pluggy podem chegar com atraso após esse período.

## Frequência de atualização

Webhooks atualizam o Flux Finance quando a Pluggy conclui uma sincronização. Isso não garante eventos instantâneos diretamente do banco: a frequência depende do conector, da instituição, do consentimento e do plano Pluggy. A Pluggy documenta auto-sync em janelas configuradas para cada aplicação. Consulte a [documentação de auto-sync e webhooks](https://docs.pluggy.ai/en/docs/connections/item) para confirmar a cadência da sua conta.
