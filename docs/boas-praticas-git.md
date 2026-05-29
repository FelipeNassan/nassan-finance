# Git Flow — Guia do Dia a Dia

## Estrutura das branches

```
main        → produção, sempre estável
develop     → integração, acumula features prontas
feature/*   → uma funcionalidade nova
fix/*       → correção de bug no desenvolvimento
hotfix/*    → correção urgente direto em produção
```


## Começando qualquer sessão de trabalho

Antes de criar qualquer branch ou mexer em qualquer coisa, sempre atualize a `develop`:

```bash
git checkout develop
git pull origin develop
```

## Criando uma feature ou fix

```bash
# Já estando na develop atualizada:
git checkout -b feature/nome-da-feature
```

Trabalhe normalmente. Quando quiser salvar um ponto:

```bash
git add .
git commit -m "feat: descrição do que foi feito"
```

Pode fazer quantos commits quiser enquanto trabalha na branch.

## Convenção de commits

Use o padrão **Conventional Commits** para manter o histórico legível:

| Prefixo | Quando usar |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Documentação |
| `style:` | Formatação, sem mudança de lógica |
| `refactor:` | Refatoração sem nova feature ou fix |
| `test:` | Testes |
| `chore:` | Configs, dependências, build |

**Exemplos:**

```
feat: adiciona autenticação com Google
fix: corrige cálculo de desconto no carrinho
docs: atualiza README com instruções de instalação
refactor: extrai lógica de validação para helper
```

## Terminando e subindo para o GitHub

Quando a feature estiver pronta:

```bash
git push origin feature/nome-da-feature
```

No GitHub vai aparecer o botão **"Compare & pull request"**. Clique, confirme que é `feature/...` → `develop`, e abra o PR.

Como você é o único do projeto, você mesmo aprova e faz o merge. Após o merge, delete a branch pelo GitHub (aparece o botão logo após o merge).

## Após o merge, de volta na sua máquina

```bash
git checkout develop
git pull origin develop
git branch -d feature/nome-da-feature
```

Pronto, ciclo fechado. A `develop` local está atualizada e a branch antiga foi limpa.

## Quando quiser subir para produção (develop → main)

Abra um PR no GitHub de `develop` → `main`, faça o merge. Depois:

```bash
git checkout main
git pull origin main
git checkout develop
```

## Hotfix — bug urgente em produção

Situação: tem um bug crítico na `main` que não pode esperar o ciclo normal.

```bash
# Crie o hotfix A PARTIR DA MAIN
git checkout main
git pull origin main
git checkout -b hotfix/descricao-do-problema

# Corrija, commite
git add .
git commit -m "fix: corrige vulnerabilidade no login"

# Suba
git push origin hotfix/descricao-do-problema
```

Abra **dois** Pull Requests no GitHub:

1. `hotfix/...` → `main` (corrige produção)
2. `hotfix/...` → `develop` (garante que a correção não se perca)

Faça os dois merges e delete a branch.

## Resumo visual do fluxo

```
main  ──────────────────────────────────────────►  produção
         ▲                              ▲
         │   (PR: develop → main)       │  (PR: hotfix → main)
         │                              │
develop  ──────────────────────────────┤
         ▲           ▲                  │
         │           │            hotfix/bug-critico
         │           │
  feature/x       fix/y
```

## Resumo do loop diário

```
pull develop  →  cria branch  →  trabalha  →  commit  →  push  →  PR  →  merge  →  pull develop  →  deleta branch local
```

## Regras de ouro

- **Nunca** commite direto na `main` ou na `develop`
- **Sempre** crie feature/fix a partir da `develop` atualizada
- **Sempre** crie hotfix a partir da `main`
- Branches são descartáveis — nascem com um propósito e morrem após o merge
- PRs pequenos são mais fáceis de revisar e menos propensos a conflito
- A `develop` sempre está **igual ou mais avançada** que a `main`, nunca atrás