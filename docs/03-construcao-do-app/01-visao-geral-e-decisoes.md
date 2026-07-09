# fortn — Visão Geral e Decisões de Construção

## Estrutura de arquivos (planejada)

```
fortn/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout — Clerk provider, fontes
│   ├── page.tsx                      # Página inicial (redirect ou landing)
│   ├── (auth)/                       # Rotas públicas
│   │   ├── sign-in/[[...sign-in]]/   # Clerk sign-in
│   │   └── sign-up/[[...sign-up]]/   # Clerk sign-up
│   └── (app)/                        # Rotas protegidas
│       ├── layout.tsx                # Sidebar / nav autenticada
│       ├── dashboard/page.tsx        # Dashboard principal
│       ├── despesas/page.tsx         # Lista de despesas
│       ├── despesas/nova/page.tsx    # Nova despesa
│       └── analise/page.tsx          # Análise e comparativos
├── app/api/                          # API Routes (mutações via Prisma)
│   └── despesas/
│       ├── route.ts                  # GET (lista) / POST (cria)
│       └── [id]/route.ts             # PATCH (edita) / DELETE (remove)
├── components/
│   ├── ui/                           # shadcn/ui (gerado pelo CLI)
│   └── ...                           # Componentes do domínio
├── lib/
│   ├── prisma.ts                     # Client singleton do Prisma
│   └── auth.ts                       # Helpers do Clerk
├── prisma/
│   ├── schema.prisma                 # Schema do banco
│   └── migrations/                   # Migrations versionadas
├── middleware.ts                     # Clerk: protege rotas (app)
├── docker-compose.yml                # Postgres local
├── .env.local                        # Credenciais (gitignored)
└── .env.example                      # Template de variáveis
```

---

## Decisões de arquitetura

### Por que Next.js App Router?
Roteamento file-based, Server Components para leitura de dados sem API extra,
API Routes para mutações. Máxima liberdade de design e fácil migração futura para app mobile
(que consumiria as mesmas API routes).

### Por que Server Components por padrão?
Dados financeiros nunca precisam ser renderizados no cliente antes de chegarem.
Server Components leem do Prisma direto, sem round-trip de API desnecessário.
`"use client"` entra apenas onde há interatividade real (formulários, estado de UI).

### Por que Clerk e não auth manual?
Sessões, refresh tokens, proteção de rotas e futuramente OAuth (Google, GitHub) — tudo
resolvido sem implementar. O middleware do Clerk protege as rotas `(app)/` em um único arquivo.

### Por que Prisma?
TypeScript-first: os tipos do schema são gerados automaticamente, sem manter tipos manuais
sincronizados com o banco. Migrations versionadas no git. Prisma Studio como GUI local.

### Por que grupos `(auth)` e `(app)`?
Next.js usa parênteses para route groups que não aparecem na URL. Permite layouts diferentes
para telas autenticadas e não autenticadas sem duplicar lógica.

### Por que `lib/prisma.ts` singleton?
Em desenvolvimento com hot reload, criar um novo PrismaClient a cada módulo esgota
as conexões do banco. O singleton reutiliza a instância existente.
