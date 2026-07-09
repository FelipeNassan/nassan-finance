# fortn — Contexto do Produto

## O que é
App de gestão financeira pessoal. Nome vem de "fortuna".
Objetivo: o usuário (Felipe, uso pessoal) controlar suas finanças com clareza, sem fricção.
Deve parecer um app de fintech premium: minimalista, elegante, animações suaves.

## Fase atual
App multiplataforma funcional: registrar/editar/apagar despesas (soft delete com
motivo), dashboard com dados reais, extrato com filtros/ordenação, autenticação
completa (cadastro em etapas, login, recuperação de senha).

## Próximas fases (possíveis)
- Receitas (hoje o schema só tem despesas)
- Cartões/faturas (tabelas `card`/`invoice` já existem, sem UI)
- Provedor real de SMS (hoje o código de verificação aparece no app em dev)
- Publicação na App Store (EAS Build)
- Calendário além de 2026 (`calendar_day` limita as datas hoje)

## Stack
| Camada     | Tecnologia                                              |
|------------|---------------------------------------------------------|
| App        | React Native + Expo SDK 54, Expo Router, TypeScript     |
| Estado     | Zustand (UI) + React Query (dados) + React Hook Form    |
| Animações  | Reanimated 4 + expo-haptics                              |
| Backend    | Next.js 15 (App Router) — APENAS API REST, sem UI web   |
| ORM        | Prisma 6                                                 |
| Auth       | Própria: JWT (jose) + refresh rotacionado + bcryptjs     |
| Banco      | PostgreSQL 16 local via Docker                           |
| E-mail     | Gmail SMTP via nodemailer (senha de app no .env)         |

## Banco local (Docker)
- Container: `fortn-db` · Porta: `5432` · Banco: `fortn` (+ `fortn_shadow` p/ migrations)
- docker-compose em: `test/docker-compose.yml`
- Credenciais no `.env` (nunca commitar)

## Dev
- Dev solo (Felipe), Windows (ASUS Vivobook), iPhone 16 físico via Expo Go
- IDE: Claude Code / Cursor
- Subir tudo: `npm run dev:all` na raiz
