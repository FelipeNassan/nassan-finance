# Padrões de Código

## Geral
- TypeScript strict em todo o projeto
- Sem comentários óbvios — só quando o "porquê" não é evidente
- Sem código morto, sem `console.log` esquecido

## Next.js
- App Router (pasta `app/`) — nunca misturar com Pages Router
- Server Components por padrão; `"use client"` só quando necessário
- API routes em `app/api/`
- Variáveis de ambiente: `NEXT_PUBLIC_*` só para o que for público

## Prisma
- Nunca alterar o banco direto — sempre via `prisma migrate dev`
- Schema em `prisma/schema.prisma`
- Seed em `prisma/seed.ts` quando necessário
- Usar o client singleton em `lib/prisma.ts`

## Componentes
- shadcn/ui para componentes base
- Tailwind para estilo; sem CSS inline sem motivo forte
- Componentes em `components/`, páginas em `app/`

## Formatação
- Prettier + ESLint configurados no projeto
- Aspas duplas, ponto-e-vírgula, 2 espaços
