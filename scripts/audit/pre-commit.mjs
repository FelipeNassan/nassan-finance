#!/usr/bin/env node
// Auditoria PRÉ-COMMIT (modo rápido): analisa o que está staged e BLOQUEIA
// o commit se encontrar problema grave (segredos, arquivos sensíveis, XSS,
// SQLi, TypeScript/ESLint com erro, vulnerabilidade crítica).
//
// Uso:
//   node scripts/audit/pre-commit.mjs          → arquivos staged (hook)
//   node scripts/audit/pre-commit.mjs --all    → repo inteiro (verificação manual)
//
// Escape consciente (emergência): git commit --no-verify
// Auditoria completa com relatório: npm run audit:full

import {
  C,
  arquivosStaged,
  todosArquivos,
  imprimirAchados,
  resumo,
} from "./util.mjs";
import { verificarSegredos } from "./checks/segredos.mjs";
import {
  verificarArquivosProibidos,
  verificarGitignore,
} from "./checks/arquivos.mjs";
import { verificarCodigoPerigoso } from "./checks/codigo.mjs";
import {
  verificarTypescript,
  verificarEslint,
  verificarNpmAudit,
} from "./checks/ferramentas.mjs";

const modoAll = process.argv.includes("--all");
const inicio = Date.now();

const arquivos = modoAll ? todosArquivos() : arquivosStaged();
if (arquivos.length === 0) {
  console.log(C.cinza("auditoria: nada staged — ok."));
  process.exit(0);
}

console.log(
  C.negrito(`\n🔍 fortn audit — ${modoAll ? "repo inteiro" : `${arquivos.length} arquivo(s) staged`}\n`)
);

const achados = [];

// 1. Arquivos sensíveis/grandes + .gitignore (rápido, sempre)
achados.push(...verificarArquivosProibidos(arquivos));
achados.push(...verificarGitignore());

// 2. Segredos e credenciais no conteúdo (rápido, sempre)
achados.push(...verificarSegredos(arquivos, !modoAll));

// 3. Padrões perigosos de código (rápido, sempre)
achados.push(...verificarCodigoPerigoso(arquivos, !modoAll));

// 4. TypeScript (só se houver .ts staged no alvo)
achados.push(...verificarTypescript(modoAll ? null : arquivos));

// 5. ESLint no backend (só arquivos staged)
achados.push(...verificarEslint(modoAll ? null : arquivos));

// 6. npm audit — só quando dependências mudaram (ou --all)
const depsMudaram = arquivos.some((a) => /package(-lock)?\.json$/.test(a));
if (depsMudaram || modoAll) {
  achados.push(...verificarNpmAudit());
}

// ---- Veredito ----
const n = resumo(achados);
const bloqueantes = achados.filter((a) => a.bloqueia);
const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

if (achados.length > 0) {
  imprimirAchados(achados);
  console.log(
    `\n${C.negrito("Resumo:")} ${C.vermelho(`${n.critica} crítico(s)`)} · ` +
      `${C.vermelho(`${n.alta} alto(s)`)} · ${C.amarelo(`${n.media} médio(s)`)} · ` +
      `${C.cinza(`${n.baixa} baixo(s)`)}  ${C.cinza(`(${segundos}s)`)}`
  );
}

if (bloqueantes.length > 0) {
  console.log(
    C.vermelho(
      `\n✖ COMMIT BLOQUEADO — ${bloqueantes.length} problema(s) impeditivo(s) acima.`
    )
  );
  console.log(
    C.cinza(
      "Corrija e commite de novo. Falso positivo? Adicione `// audit-ok: <motivo>` na linha.\n" +
        "Emergência real: git commit --no-verify (fica registrado que você pulou a auditoria)."
    )
  );
  process.exit(1);
}

console.log(C.verde(`\n✔ Auditoria passou em ${segundos}s — commit liberado.`));
process.exit(0);
