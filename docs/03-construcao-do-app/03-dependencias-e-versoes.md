# fortn — Dependências e Versões

## Stack principal

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `next` | 15.x | Framework web — App Router, Server Components, API Routes |
| `react` / `react-dom` | 19.x | Pinado pelo Next.js 15 |
| `typescript` | 5.x | Tipagem estrita |
| `@prisma/client` | 6.x | Client do ORM gerado a partir do schema |
| `prisma` | 6.x | CLI: migrate, generate, studio |
| `@clerk/nextjs` | 6.x | Auth completo: sessões, middleware, hooks |

## Estilo e UI

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `tailwindcss` | 4.x | Classes utilitárias |
| `@tailwindcss/postcss` | 4.x | Plugin PostCSS do Tailwind v4 |
| `shadcn/ui` | (CLI) | Componentes copiados para `components/ui/` via `npx shadcn@latest add` |

## Dev dependencies

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `@types/node` | 22.x | Tipos Node para TypeScript |
| `@types/react` | 19.x | Tipos React |
| `eslint` + `eslint-config-next` | 9.x | Linting |

---

## Comandos de instalação

```bash
# Criar o projeto
npx create-next-app@latest fortn --typescript --tailwind --eslint --app

# Prisma
npm install prisma @prisma/client
npx prisma init

# Clerk
npm install @clerk/nextjs

# shadcn/ui (inicializar e adicionar componentes)
npx shadcn@latest init
npx shadcn@latest add button input card label
```

---

## Notas de compatibilidade

- Next.js 15 usa React 19 — sem instalar versões anteriores do React
- Tailwind v4 tem config diferente da v3: sem `tailwind.config.js`, configuração via CSS
- Prisma 6 requer Node.js ≥ 18
- `@clerk/nextjs` v6 usa `auth()` assíncrono (breaking change da v5)
