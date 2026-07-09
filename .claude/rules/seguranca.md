# Segurança

## Variáveis de ambiente
- Nunca hardcodar credenciais no código
- Tudo sensível vai em `.env.local` (não commitado)
- `.env.example` com as chaves sem valores — este sim vai no git

## Autenticação
- Auth própria (JWT) em `lib/auth/` — Clerk foi removido em 2026-07-07
- Access token 15min + refresh token opaco rotacionado (hash no banco, revogável)
- Toda rota de API resolve o usuário via `getUserId()` (`lib/auth.ts`) — nunca confiar em ID vindo do cliente
- Senhas com bcryptjs (custo 12); política mínima validada em `lib/auth/senha.ts`
- Códigos SMS e tokens de e-mail/reset expiram e são de uso único
- `AUTH_DEV_RETORNA_CODIGO` devolve códigos na resposta — NUNCA em produção

## Banco de dados
- Nunca executar queries sem validar input (usar Prisma — ele já parametriza)
- Nunca conectar ao banco direto do cliente (browser) — sempre via API route
- DATABASE_URL só existe no servidor, nunca com prefixo NEXT_PUBLIC_

## Git
- `.env*` no `.gitignore` antes do primeiro commit
- Revisar o que vai ser commitado antes de qualquer `git add .`
