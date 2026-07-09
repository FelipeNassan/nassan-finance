# fortn — Banco de Dados e Segurança

## PostgreSQL local via Docker

Banco rodando localmente, gerenciado pelo `docker-compose.yml` na raiz:

```
Container : fortn-db
Porta     : 5432
Banco     : fortn
```

Em produção futura, migrar para um Postgres gerenciado (Supabase, Neon, Railway) é trivial:
basta trocar `DATABASE_URL` no `.env`.

---

## Schema inicial (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String     @id  // Clerk user ID (ex: user_2abc...)
  despesas  Despesa[]
  createdAt DateTime   @default(now())
}

model Despesa {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  data           DateTime @db.Date
  valor          Decimal  @db.Decimal(12, 2)
  descricao      String
  categoria      String
  formaPagamento String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### Decisões de modelagem

- **`valor: Decimal`** — nunca Float. Decimal é exato; Float causa erros de arredondamento em valores monetários.
- **`data: DateTime @db.Date`** — separado de `createdAt`. A data da despesa é quando o gasto aconteceu; `createdAt` é quando foi registrado. São conceitos diferentes.
- **`userId: String`** — ID do Clerk (não UUID gerado pelo banco). Clerk é a fonte da verdade de identidade.
- **`onDelete: Cascade`** — se o usuário for deletado, as despesas são deletadas automaticamente.
- **`categoria / formaPagamento: String`** — validação no servidor (enum no código), não constraint no banco. Mais fácil de evoluir sem migrations para cada nova categoria.

### Índices a criar (após schema inicial estabilizar)
```prisma
@@index([userId])
@@index([userId, data])
@@index([userId, categoria])
```
Todas as queries filtram por `userId` + período ou categoria.

---

## Autenticação com Clerk

O Clerk é a única camada de auth. Não há tabela de sessões ou tokens no banco.

### Como funciona
1. Usuário acessa rota protegida → Clerk Middleware verifica sessão
2. Sem sessão → redirect para `/sign-in`
3. Com sessão → `auth()` ou `currentUser()` no servidor retorna o usuário
4. `userId` do Clerk é usado como chave estrangeira em todas as tabelas do domínio

### Isolamento de dados
Como não há RLS (o banco é acessado apenas pelo servidor Next.js, nunca pelo browser):
- Toda query **obrigatoriamente** inclui `where: { userId: session.userId }`
- Nenhuma API route responde sem verificar `auth()` primeiro

```ts
// Exemplo: API route segura
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const despesas = await prisma.despesa.findMany({
    where: { userId }, // sempre filtrado pelo usuário
  });
  return Response.json(despesas);
}
```

---

## Variáveis de ambiente

```bash
# .env.local (nunca commitado)
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/fortn"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

- `DATABASE_URL` — nunca com prefixo `NEXT_PUBLIC_` (ficaria exposta no browser)
- `CLERK_SECRET_KEY` — nunca com prefixo `NEXT_PUBLIC_`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — segura para o browser (é pública por design)
