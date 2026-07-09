# Auditoria automática do fortn

Auditoria de qualidade, limpeza e segurança que roda **antes de cada commit**
(bloqueante) e sob demanda (relatório completo). Modular e extensível.

## Como usar

```bash
npm run hooks:install   # 1x por clone — ativa o pre-commit (core.hooksPath)
npm run audit:fast      # roda o modo rápido no repo inteiro (sem commitar)
npm run audit:full      # auditoria completa → docs/auditoria.md
```

O hook roda sozinho no `git commit`. Para uma emergência real:
`git commit --no-verify` (pula a auditoria — use com consciência).

## Dois modos

| | pre-commit (hook) | audit:full |
|---|---|---|
| Escopo | só arquivos staged | repo inteiro |
| Velocidade | ~5–25s | ~1min |
| Bloqueia? | sim (exit 1) | só se houver crítico |
| Ferramentas pesadas | não | depcheck, madge |
| Saída | terminal | terminal + `docs/auditoria.md` |

## O que bloqueia o commit

Segredos/credenciais (AWS, Google, OpenAI/Anthropic, GitHub, JWT colado,
connection string com senha, credencial hardcoded), arquivos sensíveis
(`.env`, chaves, certificados, backups, binário > 5 MB), `eval`/`new Function`,
`dangerouslySetInnerHTML`/`innerHTML`/`document.write` sem sanitização,
Prisma `RawUnsafe` (SQLi), CORS `*`, JWT inseguro, erro de **TypeScript** ou
**ESLint (error)**, e **vulnerabilidade crítica** do `npm audit` (quando o
`package.json`/lock muda).

## Ferramentas consolidadas usadas

TypeScript (`tsc`), ESLint, `npm audit`, `depcheck` (deps não usadas/faltando),
`madge` (imports circulares) — via `npx`, sem adicionar dependências ao projeto.
Regras próprias por regex cobrem o que essas ferramentas não veem (segredos,
padrões perigosos, dead code heurístico).

## Estrutura (extensível)

```
scripts/audit/
├── config.mjs          # ignorados, arquivos proibidos, limiares — mexa aqui
├── util.mjs            # helpers (git, leitura, formato de achado, cores)
├── checks/
│   ├── segredos.mjs    # credenciais e segredos
│   ├── arquivos.mjs    # sensíveis, grandes, duplicados, assets órfãos
│   ├── codigo.mjs      # XSS/injeção/cripto + dead code/qualidade
│   └── ferramentas.mjs # tsc, eslint, npm audit, depcheck, madge, .env
├── pre-commit.mjs      # orquestra o modo rápido (bloqueante)
└── full.mjs            # orquestra o completo + gera docs/auditoria.md
```

**Adicionar uma regra nova:** crie a função de check (retornando `achado(...)`)
no módulo adequado e registre-a em `pre-commit.mjs` e/ou na lista `etapas` de
`full.mjs`. Cada achado tem `severidade` e `bloqueia`.

## Falsos positivos

Escreva `// audit-ok: <motivo>` na linha do achado (ou na anterior). Sem motivo
explícito, a supressão não é aceita — a ideia é forçar uma justificativa.
Exceções estruturais (pastas, nomes de arquivo) vão em `config.mjs`.

## Classificação de remoções

A auditoria **nunca remove nada**. Itens de limpeza saem classificados como
**Seguro para remover**, **Revisão Manual** ou **Necessário**, com a evidência
(ex.: "não referenciado em nenhum código" via busca textual / depcheck) — a
decisão é sempre humana.
