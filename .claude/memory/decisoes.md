# Decisões Arquiteturais

## 2026-07-08 — Auditoria automática no pre-commit
**Decisão:** Hook de pre-commit versionado em `.githooks/` (ativado com
`npm run hooks:install` → `core.hooksPath`). Lógica modular em `scripts/audit/`:
`config.mjs` (exceções/limiares), `util.mjs`, `checks/*` e dois orquestradores —
`pre-commit.mjs` (rápido, só staged, BLOQUEIA) e `full.mjs` (repo inteiro →
`docs/auditoria.md`, gitignorado). Usa ferramentas consolidadas via npx (tsc,
eslint, npm audit, depcheck, madge) + regras próprias por regex (segredos,
XSS/injeção/cripto, dead code). Bloqueia: segredos, `.env`/chaves, eval,
innerHTML/dangerouslySetInnerHTML sem sanitização, Prisma RawUnsafe, CORS `*`,
JWT inseguro, erro de tsc/eslint, vuln. crítica do npm audit. Falso positivo:
`// audit-ok: <motivo>` na linha (exige justificativa). Escape: `--no-verify`.
Nunca remove nada — só classifica (Seguro remover / Revisão Manual / Necessário).
Doc: `scripts/audit/README.md`.
**Motivo:** transformar o commit em porta de qualidade/segurança sem depender de
disciplina manual; extensível para novas regras.

## 2026-07-08 — Corte final da auth (Etapa 5)
**Decisão:** `AUTH_DISABLED=false` em definitivo — o app agora exige conta real.
Base de usuários de teste zerada (calendário 2026 preservado). E-mails reais via
Gmail SMTP (nodemailer) com **senha de app** no `.env` (`SMTP_*`); a senha normal
da conta Google é recusada pelo SMTP (erro 534). Falha de envio não derruba o
fluxo (log + código dev continua na resposta). SMS segue sem provedor:
`AUTH_DEV_RETORNA_CODIGO=true` mantém o "código de teste" visível no app até
plugar Twilio/Zenvia em `lib/auth/entrega.ts`. Documentação para agentes:
`.claude/context/arquitetura.md` (arquitetura) + `docs/api.md` (referência da API).
**Motivo:** app em uso real pelo Felipe; e-mail de verificação precisa chegar
de verdade na caixa de entrada.

## 2026-07-07 — Auth própria no lugar do Clerk
**Decisão:** Clerk removido. Autenticação própria: JWT (`jose`, HS256, access 15min,
escopo "acesso"/"cadastro") + refresh token opaco rotacionado (sha256 no banco,
revogável). Senha com bcryptjs custo 12 (não Argon2: módulo nativo problemático no
Windows). Cadastro em etapas server-side: usuário pendente criado nos dados pessoais,
`cadastroToken` autoriza telefone→código SMS→e-mail→senha; conta ativa (`activatedAt`)
só ao definir senha. Tabelas: campos de auth em `app_user` (anuláveis, preserva
dev-user) + `phone_verification_code`, `email_verification_token`,
`password_reset_token`, `refresh_token`, `auth_log` (alimenta anti-brute-force:
5 falhas/15min bloqueia). SMS/e-mail sem provedor real: `lib/auth/entrega.ts` loga
no console e, com `AUTH_DEV_RETORNA_CODIGO=true`, devolve código/link na resposta
da API (só dev). Flag `AUTH_DISABLED` continua valendo (dev-user sem token).
**Motivo:** o usuário pediu remoção total do Clerk e fluxo de auth próprio estilo
fintech, com controle total do banco e da UX.

## 2026-07-07 — Soft delete de despesas
**Decisão:** Despesa não é apagada do banco. Colunas em `expense`:
`expense_is_deleted` (bool), `expense_deleted_at` (timestamp), `expense_deleted_description`
(motivo, VarChar 255). O `DELETE /api/despesas/[id]` exige `{ motivo }` no corpo (400 se vazio)
e faz UPDATE marcando as três colunas. TODA consulta de despesa filtra `isDeleted: false`
(listagem, resumo, resolver do [id]). No app, o botão apagar abre o `PromptModal` que coleta
o motivo obrigatório. Migration: `20260707223557_soft_delete_expense`.
**Motivo:** manter histórico e auditoria — poder saber o que foi apagado e por quê.

## 2026-07-07 — Pivô para app multiplataforma (Expo) + Next.js como backend
**Decisão:** O frontend passa a ser um app React Native + Expo em `mobile/` (mobile-first:
iPhone > Android > Web via RN Web). O Next.js deixa de servir UI e vira **backend de API**
(`/api/resumo`, `/api/despesas`, `/api/referencias` em `app/api/`, com CORS liberado em `lib/api.ts`).
As telas web antigas (`app/(app)/`) continuam existindo mas não são mais o foco.
Stack do app: Expo Router, React Query, Zustand, React Hook Form, Reanimated 4, expo-haptics.
Arquitetura em `mobile/src/`: app/ components/ features/ services/ store/ theme/ types/ utils/.
O app descobre o IP do backend via `Constants.expoConfig.hostUri` (porta 3000) — sem hardcode.
**Motivo:** o usuário quer um app nativo de verdade no iPhone/Android, com Web só como
consequência do código compartilhado. Backend reaproveitado inteiro (Prisma + Postgres).
Auth do Clerk no app é escopo futuro; hoje o app depende de `AUTH_DISABLED=true` (dev-user).

## 2026-07-06 — Bypass de auth para desenvolvimento
**Decisão:** Flag `AUTH_DISABLED=true` no `.env` desliga o Clerk e usa o usuário fixo
`dev-user`. Sessão centralizada em `lib/auth.ts` (`getUserId`, `getUsuarioSessao`) —
nenhuma página importa Clerk diretamente para identidade.
**Motivo:** Permitir testes locais sem login. Reativar o Clerk = remover a flag.
Nunca usar em produção.

## 2026-06-24 — Stack principal
**Decisão:** Next.js 15 (App Router) + TypeScript + Prisma + Clerk + Tailwind + shadcn/ui
**Motivo:** Next.js dá máxima liberdade de design e, se futuramente houver app mobile,
o backend (API routes + Prisma) é reaproveitado quase inteiro.

## 2026-06-24 — Banco local com Docker
**Decisão:** PostgreSQL 16 rodando via Docker (`test/docker-compose.yml`), porta 5432.
**Motivo:** Desenvolvimento local sem depender de serviço externo ou custo.
Container: `fortn-db`, banco: `fortn`.

## 2026-06-24 — Auth com Clerk
**Decisão:** Clerk para autenticação, sem implementar auth manual.
**Motivo:** Simplifica o setup, cuida de sessões, OAuth e segurança out-of-the-box.

## 2026-06-24 — Projeto começa como site (não app)
**Decisão:** Primeiro entrega um site funcional. App mobile é fase futura opcional.
**Motivo:** Evitar complexidade prematura. Stack web permite design rico e rápido.
