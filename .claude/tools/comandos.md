# Comandos Úteis

## Docker / Banco
```bash
# Subir o banco
docker compose -f test/docker-compose.yml up -d

# Parar o banco
docker compose -f test/docker-compose.yml down

# Ver logs do banco
docker logs fortn-db
```

## Prisma
```bash
# Criar e rodar migration após alterar o schema
npx prisma migrate dev --name <nome-da-migration>

# Abrir o Prisma Studio (GUI do banco)
npx prisma studio

# Gerar o client (após alterar schema sem migration)
npx prisma generate

# Rodar seed
npx prisma db seed
```

## Next.js
```bash
# Dev local
npm run dev

# Build de produção
npm run build

# Checar tipos TypeScript
npx tsc --noEmit
```

## Git
```bash
# Ver o que vai ser commitado antes de adicionar
git diff --staged

# Adicionar arquivos específicos (nunca git add .)
git add src/components/MinhaFeature.tsx
```
