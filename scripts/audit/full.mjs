#!/usr/bin/env node
// Auditoria COMPLETA (manual/CI): roda tudo do pre-commit no repo inteiro
// + dependências (depcheck), imports circulares (madge), duplicados, assets
// órfãos, variáveis de ambiente e heurísticas de dead code/qualidade.
// Gera o relatório em docs/auditoria.md. NUNCA remove nada sozinha.
//
// Uso: npm run audit:full

import { writeFileSync } from "node:fs";
import {
  C,
  todosArquivos,
  imprimirAchados,
  ordenarAchados,
  resumo,
} from "./util.mjs";
import { verificarSegredos } from "./checks/segredos.mjs";
import {
  verificarArquivosProibidos,
  verificarGitignore,
  verificarDuplicados,
  verificarAssetsOrfaos,
} from "./checks/arquivos.mjs";
import {
  verificarCodigoPerigoso,
  verificarDeadCodeHeuristico,
} from "./checks/codigo.mjs";
import {
  verificarTypescript,
  verificarEslint,
  verificarNpmAudit,
  verificarDependencias,
  verificarCirculares,
  verificarEnv,
} from "./checks/ferramentas.mjs";

const inicio = Date.now();
const arquivos = todosArquivos();
console.log(C.negrito(`\n🔍 fortn audit:full — ${arquivos.length} arquivos\n`));

const etapas = [
  ["Arquivos sensíveis", () => verificarArquivosProibidos(arquivos)],
  [".gitignore", () => verificarGitignore()],
  ["Segredos", () => verificarSegredos(arquivos, false)],
  ["Código perigoso", () => verificarCodigoPerigoso(arquivos, false)],
  ["Dead code / qualidade", () => verificarDeadCodeHeuristico(arquivos)],
  ["Duplicados", () => verificarDuplicados(arquivos)],
  ["Assets órfãos", () => verificarAssetsOrfaos(arquivos)],
  ["Variáveis de ambiente", () => verificarEnv(arquivos)],
  ["TypeScript", () => verificarTypescript(null)],
  ["ESLint (backend)", () => verificarEslint(null)],
  ["npm audit", () => verificarNpmAudit()],
  ["depcheck", () => verificarDependencias()],
  ["Imports circulares (madge)", () => verificarCirculares()],
];

const achados = [];
for (const [nome, executar] of etapas) {
  process.stdout.write(C.cinza(`• ${nome}... `));
  const t = Date.now();
  try {
    const novos = executar();
    achados.push(...novos);
    console.log(C.cinza(`${novos.length} achado(s) em ${((Date.now() - t) / 1000).toFixed(1)}s`));
  } catch (e) {
    console.log(C.amarelo(`falhou (${e.message}) — etapa pulada`));
  }
}

const n = resumo(achados);
console.log("");
imprimirAchados(achados);
console.log(
  `\n${C.negrito("Resumo:")} ${n.critica} crítico(s) · ${n.alta} alto(s) · ` +
    `${n.media} médio(s) · ${n.baixa} baixo(s) em ${((Date.now() - inicio) / 1000).toFixed(0)}s`
);

// ---------- Relatório Markdown ----------
const agora = new Date().toISOString().slice(0, 16).replace("T", " ");
const ord = ordenarAchados(achados);
const seguranca = ord.filter((a) => /^(segredo|xss|sqli|cors|jwt|cripto|injecao|path|git\/arquivo-sensivel|deps\/vulnerabilidade|log|storage|debug)/.test(a.id));
const deadCode = ord.filter((a) => a.id.startsWith("deadcode/"));
const removiveis = ord.filter((a) => a.classificacao && !a.id.startsWith("deadcode/"));
const dependencias = ord.filter((a) => a.id.startsWith("deps/"));
const melhorias = ord.filter(
  (a) => !seguranca.includes(a) && !deadCode.includes(a) && !removiveis.includes(a) && !dependencias.includes(a)
);

const linha = (a) =>
  `| \`${(a.arquivo ?? "-").slice(0, 80)}\` | ${a.linha ?? "-"} | ${a.mensagem.replaceAll("|", "\\|")} |`;

const md = `# Auditoria fortn — ${agora}

> Gerado por \`npm run audit:full\`. Este relatório NÃO remove nada:
> toda remoção exige confirmação humana. Itens marcados "Revisão Manual"
> precisam de olho humano antes de qualquer ação.

## Resumo

| Severidade | Quantidade |
|---|---|
| Crítica | ${n.critica} |
| Alta | ${n.alta} |
| Média | ${n.media} |
| Baixa | ${n.baixa} |

## Segurança

${seguranca.length === 0 ? "Nenhuma vulnerabilidade encontrada." : `| Onde | Linha | Risco / como corrigir |\n|---|---|---|\n${seguranca.map(linha).join("\n")}`}

## Código morto

${deadCode.length === 0 ? "Nada detectado pelas heurísticas." : `| Arquivo | Linha | Motivo |\n|---|---|---|\n${deadCode.map(linha).join("\n")}`}

## Arquivos / itens removíveis

${removiveis.length === 0 ? "Nada classificado como removível." : `| Item | Linha | Evidência | Classificação |\n|---|---|---|---|\n${removiveis.map((a) => `| \`${(a.arquivo ?? "-").slice(0, 80)}\` | ${a.linha ?? "-"} | ${a.mensagem.replaceAll("|", "\\|")} | **${a.classificacao}** |`).join("\n")}`}

## Dependências

${dependencias.length === 0 ? "Sem problemas de dependências." : `| Pacote/projeto | Ação sugerida |\n|---|---|\n${dependencias.map((a) => `| \`${a.arquivo}\` | ${a.mensagem.replaceAll("|", "\\|")} |`).join("\n")}`}

## Melhorias (priorizadas por severidade)

${melhorias.length === 0 ? "Sem sugestões adicionais." : melhorias.map((a) => `- **[${a.severidade}]** \`${a.arquivo ?? ""}${a.linha ? `:${a.linha}` : ""}\` — ${a.mensagem}`).join("\n")}
`;

writeFileSync("docs/auditoria.md", md, "utf8");
console.log(C.verde(`\n✔ Relatório gravado em docs/auditoria.md`));

process.exit(n.critica > 0 ? 1 : 0);
