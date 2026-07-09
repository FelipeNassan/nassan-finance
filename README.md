# fortn

App multiplataforma de gestão financeira pessoal (iPhone > Android > Web).
Registrar despesas sem fricção, entender para onde o dinheiro vai — com cara de
fintech premium.

## Arquitetura

Duas aplicações no mesmo repositório:

| Parte | Onde | O quê |
|---|---|---|
| **App** | `mobile/` | React Native + Expo (Expo Router, React Query, Zustand, Reanimated) |
| **Backend** | raiz (`app/api/`) | Next.js 15 servindo somente API REST (Prisma + PostgreSQL) |

Autenticação própria: JWT (access 15 min) + refresh token rotacionado, cadastro
em etapas com verificação de celular e e-mail, recuperação de senha. Detalhes:
[.claude/context/arquitetura.md](.claude/context/arquitetura.md) ·
Referência da API: [docs/api.md](docs/api.md)

## Rodar localmente

**Pré-requisitos:** Node 20+, Docker Desktop, app Expo Go no celular (mesmo Wi-Fi).

```bash
# 1. Dependências (backend e app)
npm install
npm --prefix mobile install

# 2. Variáveis de ambiente
cp .env.example .env    # preencher JWT_SECRET e SMTP_* (senha de app do Gmail)

# 3. Banco + migrations + calendário 2026
docker compose up -d
npx prisma migrate dev
npx prisma db seed

# 4. Tudo de uma vez: Docker + backend (:3000) + Expo (:8081 com QR code)
npm run dev:all
```

Leia o QR code no **Expo Go**. No Windows, libere as portas 3000 e 8081 no
firewall (uma vez, como admin):

```powershell
New-NetFirewallRule -DisplayName "fortn dev 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "fortn expo 8081" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow -Profile Private
```

### Modo desenvolvimento (sem login)

`AUTH_DISABLED=true` no `.env` + reiniciar o backend: o app entra direto com o
usuário fixo `dev-user` — útil para testes (inclusive por agentes de IA).

## Estrutura do repositório

```
fortn/
├── app/api/          # Backend: rotas REST (auth + despesas)
├── lib/              # Serviços do backend (auth/, prisma, validações)
├── prisma/           # Schema, migrations e seed
├── mobile/           # App React Native + Expo (ver mobile/README.md)
├── scripts/          # dev-all.mjs (sobe tudo), ensure-db.mjs
├── docs/             # api.md e documentação do projeto
└── .claude/          # Contexto, regras e memória para desenvolvimento com IA
```
