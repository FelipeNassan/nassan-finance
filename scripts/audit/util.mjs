// Utilitários compartilhados da auditoria (pre-commit e completa).
import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

export const C = {
  vermelho: (s) => `\x1b[31m${s}\x1b[0m`,
  amarelo: (s) => `\x1b[33m${s}\x1b[0m`,
  verde: (s) => `\x1b[32m${s}\x1b[0m`,
  cinza: (s) => `\x1b[90m${s}\x1b[0m`,
  negrito: (s) => `\x1b[1m${s}\x1b[0m`,
};

// Executa um comando e devolve stdout (ou null se falhar) — nunca lança.
export function sh(cmd, { cwd, timeout = 120000 } = {}) {
  try {
    return execSync(cmd, {
      cwd,
      timeout,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    // Comandos como tsc/eslint saem com código != 0 e o relatório no stdout
    if (e.stdout) return e.stdout.toString();
    return null;
  }
}

export function shOk(cmd, opts = {}) {
  try {
    execSync(cmd, {
      ...opts,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

// Arquivos staged para commit (novos/alterados/copiados)
export function arquivosStaged() {
  const saida = sh("git diff --cached --name-only --diff-filter=ACM -z") ?? "";
  return saida.split("\0").filter(Boolean);
}

// Todos os arquivos do repo (tracked + untracked), respeitando o .gitignore
export function todosArquivos() {
  const saida = sh("git ls-files -co --exclude-standard -z") ?? "";
  return saida.split("\0").filter(Boolean);
}

// Conteúdo do arquivo: no modo staged lê o INDEX (o que será commitado)
export function lerConteudo(arquivo, staged) {
  try {
    if (staged) return sh(`git show :"${arquivo}"`) ?? "";
    return readFileSync(arquivo, "utf8");
  } catch {
    return "";
  }
}

export function tamanhoBytes(arquivo, staged) {
  try {
    if (staged) {
      const s = sh(`git cat-file -s :"${arquivo}"`);
      return s ? Number(s.trim()) : 0;
    }
    return statSync(arquivo).size;
  } catch {
    return 0;
  }
}

const EXT_TEXTO = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".css",
  ".html", ".yml", ".yaml", ".toml", ".prisma", ".sql", ".txt", ".env",
  ".example", ".sh", ".ps1", ".xml", ".svg",
]);

export function ehTexto(arquivo) {
  const ponto = arquivo.lastIndexOf(".");
  if (ponto === -1) return true; // sem extensão (ex.: hooks)
  return EXT_TEXTO.has(arquivo.slice(ponto).toLowerCase());
}

export function ehCodigo(arquivo) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(arquivo);
}

// Supressão consciente: a linha (ou a anterior) contém "audit-ok: <motivo>"
export function linhaSuprimida(linhas, indice) {
  const atual = linhas[indice] ?? "";
  const anterior = linhas[indice - 1] ?? "";
  return atual.includes("audit-ok:") || anterior.includes("audit-ok:");
}

// Formato padrão de achado
export function achado({
  id,
  severidade, // "critica" | "alta" | "media" | "baixa"
  arquivo,
  linha = null,
  mensagem,
  bloqueia = false,
  classificacao = null, // "Seguro para remover" | "Revisão Manual" | "Necessário"
}) {
  return { id, severidade, arquivo, linha, mensagem, bloqueia, classificacao };
}

const PESO = { critica: 0, alta: 1, media: 2, baixa: 3 };

export function ordenarAchados(achados) {
  return [...achados].sort(
    (a, b) => PESO[a.severidade] - PESO[b.severidade] ||
      (a.arquivo ?? "").localeCompare(b.arquivo ?? "")
  );
}

export function imprimirAchados(achados) {
  const icone = {
    critica: C.vermelho("✖ CRÍTICO"),
    alta: C.vermelho("▲ ALTO   "),
    media: C.amarelo("● MÉDIO  "),
    baixa: C.cinza("○ BAIXO  "),
  };
  for (const a of ordenarAchados(achados)) {
    const local = a.arquivo ? `${a.arquivo}${a.linha ? `:${a.linha}` : ""}` : "";
    console.log(
      `${icone[a.severidade]} ${C.cinza(`[${a.id}]`)} ${local ? C.negrito(local) + " — " : ""}${a.mensagem}` +
        (a.bloqueia ? C.vermelho("  [BLOQUEIA]") : "")
    );
  }
}

export function resumo(achados) {
  const n = { critica: 0, alta: 0, media: 0, baixa: 0 };
  for (const a of achados) n[a.severidade]++;
  return n;
}
