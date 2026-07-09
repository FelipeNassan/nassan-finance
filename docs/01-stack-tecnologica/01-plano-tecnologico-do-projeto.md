# fortn — Plano Tecnológico do Projeto

## Visão geral

Site pessoal de gestão financeira. O objetivo é ter clareza sobre entradas, saídas, categorias e evolução ao longo do tempo — sem fricção, com um design bonito a médio prazo.

O projeto começa simples e funcional. Design e features avançadas entram depois que a base estiver sólida.

---

## Funcionalidades planejadas

### Gestão financeira
- Lançamento de receitas e despesas
- Categorização de gastos
- Controle de dívidas
- Metas financeiras
- Reserva de emergência

### Painéis e visibilidade
- Dashboard principal com saldo livre, dívidas e metas
- Gráficos de evolução ao longo do tempo
- Visão por categoria
- Comparativos mensais

---

## Stack técnica

### Frontend / Framework
- **Next.js 15** (App Router) + TypeScript — framework web full-stack, máxima flexibilidade de design e API routes nativas
- **Tailwind CSS** — estilização utilitária, fácil de customizar
- **shadcn/ui** — componentes base acessíveis e sem estilo imposto

### ORM / Banco de dados
- **Prisma** — ORM TypeScript-first, migrations versionadas, Prisma Studio para explorar dados
- **PostgreSQL 16** rodando localmente via Docker (`docker-compose.yml` na raiz)

### Autenticação
- **Clerk** — auth completo out-of-the-box (sessões, proteção de rotas, futuramente OAuth)

### Vibe coding
- **Claude Code / Cursor** — desenvolvimento assistido por IA com contexto de projeto

---

## Arquitetura

```
Browser (React)
     │
     ▼
Next.js (App Router)
├── Server Components   → leitura de dados direto no servidor
├── API Routes          → mutações (POST/PATCH/DELETE via Prisma)
└── Clerk Middleware     → protege rotas autenticadas
     │
     ▼
Prisma ORM
     │
     ▼
PostgreSQL (Docker local → produção futura na nuvem)
```

O banco é a única fonte da verdade. Não há estado global além da sessão do Clerk.

---

## Fases de desenvolvimento

### Fase 1 — Site funcional (atual)
Construir todas as features core com design inicial: auth, CRUD de despesas/receitas, categorias, dashboard básico. Sem frescura — funcional antes de bonito.

### Fase 2 — Design
Com as features estáveis, investir no visual: tipografia, paleta, animações, layout refinado.

### Fase 3 — App mobile (opcional, futuro)
Se fizer sentido, construir um app React Native que consome as mesmas API routes do Next.js. Reaproveitamento quase total do backend.

---

## Considerações técnicas

### Perfil do desenvolvedor
Analytics engineer pleno. Domínio em SQL e modelagem de dados. Desenvolvimento via vibe coding (Claude Code / Cursor). Windows, sem Mac.

### Valores monetários
Usar `Decimal` no Prisma schema (mapeia para `numeric` no Postgres) — nunca `Float`. Float causa erros de arredondamento em operações financeiras.

### Segurança
- Credenciais apenas em `.env.local` (nunca commitado)
- `DATABASE_URL` nunca exposta ao browser (sem prefixo `NEXT_PUBLIC_`)
- Clerk cuida de sessões e proteção de rotas — sem implementar auth manual
- Queries sempre via Prisma (parametrizadas, sem SQL injection)
