# fortn — Arquitetura

> Leia este arquivo antes de mexer em qualquer código. Ele descreve como as
> peças se encaixam e onde cada coisa vive. Decisões e motivos: `.claude/memory/decisoes.md`.

## Visão geral

Monorepo informal com duas aplicações:

```
fortn/
├── app/api/          BACKEND — Next.js 15 servindo APENAS API REST (sem UI web)
├── lib/              Serviços do backend (auth, prisma, validações, CORS)
├── prisma/           Schema, migrations e seed do PostgreSQL
├── scripts/          dev-all.mjs (sobe tudo), ensure-db.mjs (garante Docker)
└── mobile/           APP — React Native + Expo SDK 54 (iPhone > Android > Web)
    └── src/
        ├── app/          Telas (Expo Router, file-based)
        ├── components/   UI reutilizável (Button, Card, Field, Toast...)
        ├── features/     Domínios: auth/ e despesas/ (hooks, telas parciais, stores)
        ├── services/     HTTP client com refresh automático, token store
        ├── store/        Zustand: toast, visibility, intro
        ├── theme/        Cores/tipografia/espaçamento (identidade fortn)
        ├── types/        Tipos compartilhados do app
        └── utils/        Formatação, ícones de categoria
```

- O backend NÃO tem páginas web (a raiz `/` é só uma página informativa).
- O app descobre a URL do backend sozinho em dev: host do Metro + porta 3000
  (`mobile/src/constants/config.ts`). Override: `EXPO_PUBLIC_API_URL`.
- Rodar tudo: `npm run dev:all` na raiz (garante Docker + backend + Expo com QR).

## Identidade visual

Paleta "fortuna": dourado `#755A26`, fundo creme `#FBF9F7`, superfícies brancas.
Tipografia: **Libre Caslon** (serifa — títulos e números) + **Hanken Grotesk** (texto).
Tema centralizado em `mobile/src/theme/index.ts`. Detalhes de marca: blob orgânico
nos cards (`CardBlob`), fundo com formas nas telas de auth (`BrandBackdrop`).

## Autenticação (própria, sem Clerk)

### Backend (`lib/auth/` + `app/api/auth/`)
- **Access token**: JWT HS256 (`jose`), 15 min, escopo `acesso`. Vai no header
  `Authorization: Bearer` de toda chamada de dados.
- **Refresh token**: opaco (48 bytes hex), 30 dias, guardado como hash sha256 em
  `refresh_token`. **Rotacionado a cada uso** (replay do antigo → 401). Logout e
  reset de senha revogam.
- **Cadastro em etapas** (estado no servidor): `POST /api/auth/cadastro` cria o
  usuário PENDENTE e emite um JWT de escopo `cadastro` que só autoriza as rotas
  do fluxo. Gates reais: e-mail só depois do telefone verificado; senha só depois
  do e-mail confirmado; a conta ativa (`activatedAt`) ao definir a senha.
- **Senha**: bcryptjs custo 12. Política (8+ chars, maiúscula, minúscula, número,
  especial) validada em `lib/auth/senha.ts` — espelhada no app em
  `mobile/src/features/auth/senha.ts`.
- **Anti-brute-force**: 5 falhas de login em 15 min bloqueiam o e-mail (conta via
  tabela `auth_log`). Rate limit em memória por IP nos endpoints sensíveis.
- **Entrega** (`lib/auth/entrega.ts`): e-mail real via Gmail SMTP (nodemailer,
  credenciais no `.env`); SMS ainda sem provedor — o código volta na resposta da
  API quando `AUTH_DEV_RETORNA_CODIGO=true` e o app exibe "código de teste".
- **`getUserId()`** (`lib/auth.ts`) resolve o usuário de TODA rota de dados a
  partir do Bearer. Nunca confiar em ID vindo do cliente.
- **Flag `AUTH_DISABLED=true`** (.env): desliga tudo e usa o usuário fixo
  `dev-user` — para testes locais/IA sem credenciais. Reiniciar o server ao trocar.

### App (`mobile/src/features/auth/`)
- `store.ts` — Zustand: status `carregando|autenticado|deslogado`, hidratação no
  boot (chama `/api/auth/sessao`), `sair()`. O app NÃO conhece a flag AUTH_DISABLED:
  se a sessão responde 200, entra; 401, mostra login.
- `services/token-store.ts` — tokens no SecureStore (nativo) / localStorage (web).
- `services/http.ts` — client HTTP: injeta Bearer, no 401 renova o token UMA vez
  (compartilhando a promessa entre chamadas concorrentes) e repete a requisição.
- Guard em `app/_layout.tsx`: deslogado → grupo `(auth)`; autenticado → app.
- Telas: `(auth)/inicio` (hero + LoginSheet: altura pelo conteúdo, sobe suave
  sem overshoot, acompanha o teclado, NUNCA fecha — toque fora só recolhe o
  teclado; `?login=1` abre o sheet direto). Cadastro em 5 etapas:
  dados (nome/sobrenome) → nascimento → telefone → codigo SMS → email →
  email-codigo → senha → sucesso. Recuperação em 3: recuperar (e-mail) →
  recuperar-codigo (OTP + reenvio 60s) → recuperar-nova ("Redefinir", volta
  ao Entrar sem auto-login).
- Erros de formulário aparecem no Toast global (topo, 3s, com barrinha de vida).

## Domínio de despesas

- **Tabelas** (nomes de coluna prefixados, ex. `expense_amount`): `app_user` (raiz
  de todas as FKs, agora com campos de auth), `expense_category`, `payment_method`,
  `bank`, `card`, `invoice`, `expense`, `expense_bank`, `calendar_day` (só 2026 —
  limita as datas de despesa!), `holiday`.
- **Soft delete** em `expense`: `is_deleted`/`deleted_at`/`deleted_description`.
  DELETE exige `{ motivo }` e faz UPDATE. TODA consulta filtra `isDeleted: false`.
- Categorias/formas padrão semeadas na ativação da conta (`semearDadosPadrao`).
- Validação compartilhada de criar/editar: `lib/despesas.ts`.
- No app: `features/despesas/` (hooks React Query com invalidação, DespesaForm
  compartilhado entre criar/editar, filtros client-side em `filtros.ts`).

## API (resumo — detalhes em docs/api.md)

| Rota | Método | Auth | Função |
|---|---|---|---|
| `/api/auth/cadastro` | POST | — | dados pessoais → usuário pendente + cadastroToken |
| `/api/auth/cadastro/telefone` | POST | cadastroToken | envia código SMS |
| `/api/auth/cadastro/telefone/verificar` | POST | cadastroToken | valida código |
| `/api/auth/cadastro/email` | POST | cadastroToken | envia código de 6 dígitos por e-mail |
| `/api/auth/cadastro/email/verificar` | POST | cadastroToken | valida o código do e-mail |
| `/api/auth/cadastro/senha` | POST | cadastroToken | define senha, ativa, auto-login |
| `/api/auth/login` | POST | — | e-mail+senha → credenciais (404 usuário não encontrado / 401 senha incorreta) |
| `/api/auth/refresh` | POST | — | rotaciona refresh token |
| `/api/auth/logout` | POST | — | revoga refresh token |
| `/api/auth/sessao` | GET | Bearer | dados do usuário logado |
| `/api/auth/senha/esquecida` | POST | — | valida conta (404 se não existe) + envia código |
| `/api/auth/senha/codigo` | POST | — | valida código → resetToken (escopo "reset") |
| `/api/auth/senha/redefinir` | POST | — | nova senha (SEM auto-login; volta ao Entrar) |
| `/api/resumo` | GET | Bearer | dashboard (mês, total, categorias, recentes) |
| `/api/despesas` | GET/POST | Bearer | listar / criar |
| `/api/despesas/[id]` | PATCH/DELETE | Bearer | editar / soft delete (motivo obrigatório) |
| `/api/referencias` | GET | Bearer | categorias, formas de pagamento, bancos |

Respostas de erro: `{ "error": "mensagem" }` com status HTTP adequado.
CORS liberado em `lib/api.ts` (necessário para RN Web em dev).

## Fluxos de desenvolvimento

- **Tudo de uma vez**: `npm run dev:all` (raiz) — Docker + backend + Expo (QR code).
- **Migrations**: SEMPRE `npx prisma migrate dev --name <nome>` (nunca SQL direto).
  Em ambiente não-interativo: `prisma migrate diff` + `migrate deploy` (shadow DB
  `fortn_shadow` já existe no container).
- **Type-check**: `npx tsc --noEmit` na raiz E em `mobile/` (tsconfigs separados;
  o da raiz exclui `mobile/`).
- **Tipos de rota do Expo Router**: gerados quando o Metro roda; se o tsc acusar
  rota nova como inválida, suba `npx expo start` uma vez.
- **Testar como IA sem login**: `AUTH_DISABLED=true` no `.env` + reiniciar backend.
- **iPhone físico**: mesmo Wi-Fi, Expo Go, portas 3000 e 8081 liberadas no
  firewall do Windows (regras "fortn dev 3000" / "fortn expo 8081").
