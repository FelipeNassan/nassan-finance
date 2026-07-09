# fortn — Como Rodar e Próximos Passos

## Pré-requisitos

- Node.js 18+
- Docker Desktop rodando
- Conta no Clerk (gratuita)

---

## Setup inicial (uma vez)

### 1. Subir o banco local

```bash
docker compose up -d
```

Isso sobe o container `fortn-db` com PostgreSQL na porta 5432.

### 2. Criar `.env.local`

Copiar `.env.example` para `.env.local` e preencher:

```bash
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/fortn"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...   # Clerk Dashboard → API Keys
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Rodar a migration inicial

```bash
npx prisma migrate dev --name init
```

Isso cria as tabelas no banco e gera o Prisma Client.

### 5. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`.

---

## Comandos do dia a dia

```bash
# Dev
npm run dev

# Após alterar prisma/schema.prisma
npx prisma migrate dev --name <nome-descritivo>

# Explorar o banco via GUI
npx prisma studio

# Type check
npx tsc --noEmit

# Parar o banco
docker compose down

# Ver logs do banco
docker logs fortn-db
```

---

## Próximos passos

### Fase 1 — Funcional

- [ ] Inicializar projeto Next.js 15 na raiz do repo
- [ ] Configurar Clerk (middleware + route groups)
- [ ] Configurar Prisma + rodar migration inicial
- [ ] CRUD de despesas (lista, nova, editar, deletar)
- [ ] Dashboard com totais e categorias
- [ ] Análise comparativa mensal

### Fase 2 — Design

- [ ] Definir paleta de cores e tipografia
- [ ] Prototipar telas no Pencil
- [ ] Aplicar design no shadcn/ui customizado
- [ ] Animações com Framer Motion

### Fase 3 — App mobile (opcional)

- [ ] Criar projeto React Native / Expo
- [ ] Consumir as API routes do Next.js
- [ ] Build iOS via Expo EAS Build
