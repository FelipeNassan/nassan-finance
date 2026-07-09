# fortn — CLAUDE.md

> Índice de contexto carregado em toda sessão. É um mapa, não uma wiki.

## O que é este projeto
App multiplataforma de gestão financeira pessoal. Nome: fortn (de "fortuna").
Dev solo, Windows. **App React Native + Expo em `mobile/`** (iPhone é a prioridade);
**backend Next.js API-only na raiz** (Prisma + Postgres no Docker + auth própria JWT).
→ Produto e fases: @.claude/context/empresa.md
→ Arquitetura completa: @.claude/context/arquitetura.md

## Ordem de leitura (carregue nesta sequência)
1. @.claude/context/empresa.md      — produto, stack e fases
2. @.claude/context/arquitetura.md  — como as peças se encaixam (LEIA antes de codar)
3. @.claude/rules/geral.md          — comportamento e tom
4. @.claude/rules/codigo.md         — padrões de código
5. @.claude/rules/seguranca.md      — .env, auth, banco
6. @.claude/memory/decisoes.md      — decisões arquiteturais vigentes (com motivos)
7. @.claude/memory/feedbacks.md     — feedbacks e correções do usuário

## Mapa de pastas
| Pasta                  | Para quê                                         |
|------------------------|--------------------------------------------------|
| `app/api/`             | Backend: rotas REST (auth + despesas)            |
| `lib/`                 | Serviços do backend (auth/, prisma, validações)  |
| `prisma/`              | Schema, migrations, seed (calendário 2026)       |
| `mobile/src/`          | App Expo (telas, componentes, features, tema)    |
| `scripts/`             | dev-all.mjs — sobe Docker + backend + Expo       |
| `docs/api.md`          | Referência completa da API                       |
| `.claude/context/`     | Contexto fixo do produto e arquitetura           |
| `.claude/rules/`       | Regras modulares por tópico                      |
| `.claude/memory/`      | Memória viva: feedbacks e decisões               |

## Comandos essenciais
- `npm run dev:all` (raiz) — sobe tudo (Docker, backend :3000, Expo :8081 com QR)
- `npx tsc --noEmit` — rodar NA RAIZ e em `mobile/` (dois tsconfigs)
- `npx prisma migrate dev --name <nome>` — única forma de alterar o banco
- Testar sem login: `AUTH_DISABLED=true` no `.env` + reiniciar backend

## VOCÊ DEVE seguir este fluxo de memória em toda sessão

- **Feedback ou correção** → adicione em `.claude/memory/feedbacks.md`
  com `## YYYY-MM-DD — <contexto curto>` e o que foi corrigido.
- **Decisão técnica ou arquitetural** → adicione em `.claude/memory/decisoes.md`
  com data, decisão e motivo.
- **Nova regra para todas as sessões** → escreva em `.claude/rules/<topico>.md`
  e adicione o @import abaixo.
- **Mudança estrutural** (pastas, stack, fluxo) → atualize
  `.claude/context/arquitetura.md` e a referência `docs/api.md` se a API mudou.

## Regras ativas
@.claude/rules/geral.md
@.claude/rules/codigo.md
@.claude/rules/seguranca.md
