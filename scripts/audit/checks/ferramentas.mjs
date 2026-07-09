// Integração com ferramentas consolidadas: TypeScript, ESLint, npm audit,
// depcheck (dependências) e madge (imports circulares).
import { existsSync, readFileSync } from "node:fs";
import { sh, achado, lerConteudo } from "../util.mjs";
import { config } from "../config.mjs";

// --- TypeScript (bloqueia em erro) ---
export function verificarTypescript(arquivosStaged) {
  const achados = [];
  const alvos = [
    { nome: "backend", dir: ".", pertence: (a) => !a.startsWith("mobile/") },
    { nome: "app", dir: "mobile", pertence: (a) => a.startsWith("mobile/") },
  ];

  for (const alvo of alvos) {
    // Só roda se houver arquivo TS relevante no commit (ou modo --all)
    const relevante =
      !arquivosStaged ||
      arquivosStaged.some((a) => alvo.pertence(a) && /\.(ts|tsx)$/.test(a));
    if (!relevante) continue;

    const saida = sh("npx tsc --noEmit --pretty false", { cwd: alvo.dir }) ?? "";
    const erros = saida.split(/\r?\n/).filter((l) => /error TS\d+/.test(l));
    for (const erro of erros.slice(0, 20)) {
      const m = erro.match(/^(.*?)\((\d+),\d+\): (.*)$/);
      achados.push(
        achado({
          id: "qualidade/typescript",
          severidade: "alta",
          arquivo: m ? `${alvo.dir === "." ? "" : alvo.dir + "/"}${m[1]}` : alvo.nome,
          linha: m ? Number(m[2]) : null,
          mensagem: m ? m[3] : erro,
          bloqueia: true,
        })
      );
    }
  }
  return achados;
}

// --- ESLint no backend (bloqueia em error; warning só alerta) ---
export function verificarEslint(arquivosStaged) {
  const alvos = (arquivosStaged ?? []).filter(
    (a) => !a.startsWith("mobile/") && /\.(ts|tsx|js|jsx|mjs)$/.test(a) &&
      !config.ignorar.some((re) => re.test(a))
  );
  if (arquivosStaged && alvos.length === 0) return [];

  const lista = arquivosStaged ? alvos.map((a) => `"${a}"`).join(" ") : "app lib scripts";
  const saida = sh(`npx eslint ${lista} --format json --no-warn-ignored`) ?? "[]";

  const achados = [];
  try {
    for (const resultado of JSON.parse(saida)) {
      for (const msg of resultado.messages) {
        achados.push(
          achado({
            id: `eslint/${msg.ruleId ?? "parse"}`,
            severidade: msg.severity === 2 ? "alta" : "media",
            arquivo: resultado.filePath.replace(process.cwd() + "\\", "").replaceAll("\\", "/"),
            linha: msg.line,
            mensagem: msg.message,
            bloqueia: msg.severity === 2,
          })
        );
      }
    }
  } catch {
    /* saída não-JSON (eslint indisponível) — não bloqueia por falha de ferramenta */
  }
  return achados;
}

// --- npm audit (bloqueia em vulnerabilidade crítica) ---
export function verificarNpmAudit() {
  const achados = [];
  for (const alvo of [{ nome: "backend", dir: "." }, { nome: "app", dir: "mobile" }]) {
    const saida = sh("npm audit --json", { cwd: alvo.dir, timeout: 60000 });
    if (!saida) {
      achados.push(
        achado({
          id: "deps/audit-indisponivel",
          severidade: "baixa",
          arquivo: alvo.nome,
          mensagem: "npm audit indisponível (offline?). Rode manualmente depois.",
        })
      );
      continue;
    }
    try {
      const json = JSON.parse(saida);
      const v = json.metadata?.vulnerabilities ?? {};
      if (v.critical > 0) {
        achados.push(
          achado({
            id: "deps/vulnerabilidade-critica",
            severidade: "critica",
            arquivo: `${alvo.nome}/package.json`,
            mensagem: `${v.critical} vulnerabilidade(s) CRÍTICA(s). Rode "npm audit" em ${alvo.dir} e corrija.`,
            bloqueia: true,
          })
        );
      }
      if (v.high > 0) {
        achados.push(
          achado({
            id: "deps/vulnerabilidade-alta",
            severidade: "alta",
            arquivo: `${alvo.nome}/package.json`,
            mensagem: `${v.high} vulnerabilidade(s) alta(s). Planeje a correção (npm audit).`,
          })
        );
      }
    } catch {
      /* ignora saída inválida */
    }
  }
  return achados;
}

// --- depcheck: dependências não usadas / faltando (modo completo) ---
export function verificarDependencias() {
  const achados = [];
  for (const alvo of [{ nome: "backend", dir: "." }, { nome: "app", dir: "mobile" }]) {
    const saida = sh("npx depcheck --json", { cwd: alvo.dir, timeout: 180000 });
    if (!saida) continue;
    try {
      const json = JSON.parse(saida.slice(saida.indexOf("{")));
      for (const dep of json.dependencies ?? []) {
        achados.push(
          achado({
            id: "deps/nao-usada",
            severidade: "baixa",
            arquivo: `${alvo.nome}/package.json`,
            mensagem: `Dependência "${dep}" sem import detectado (evidência: depcheck). Impacto de remover: nenhum se realmente não usada.`,
            classificacao: "Revisão Manual",
          })
        );
      }
      for (const [dep, usos] of Object.entries(json.missing ?? {})) {
        achados.push(
          achado({
            id: "deps/faltando",
            severidade: "alta",
            arquivo: `${alvo.nome}/package.json`,
            mensagem: `"${dep}" é importado mas não declarado (usado em ${usos[0]}).`,
          })
        );
      }
    } catch {
      /* depcheck falhou — segue */
    }
  }
  return achados;
}

// --- madge: imports circulares (modo completo) ---
export function verificarCirculares() {
  const achados = [];
  for (const alvo of [
    { nome: "backend", dir: ".", entrada: "app lib" },
    { nome: "app", dir: "mobile", entrada: "src" },
  ]) {
    const saida = sh(`npx madge --circular --extensions ts,tsx --json ${alvo.entrada}`, {
      cwd: alvo.dir,
      timeout: 180000,
    });
    if (!saida) continue;
    try {
      const ciclos = JSON.parse(saida.slice(saida.indexOf("[")));
      for (const ciclo of ciclos) {
        achados.push(
          achado({
            id: "estrutura/import-circular",
            severidade: "media",
            arquivo: ciclo.join(" → "),
            mensagem: "Dependência circular — extraia a parte comum para um módulo neutro.",
          })
        );
      }
    } catch {
      /* madge falhou — segue */
    }
  }
  return achados;
}

// --- Variáveis de ambiente: .env.example × uso no código (modo completo) ---
export function verificarEnv(arquivos) {
  const achados = [];
  if (!existsSync(".env.example")) {
    achados.push(
      achado({
        id: "env/sem-exemplo",
        severidade: "media",
        arquivo: ".env.example",
        mensagem: "Sem .env.example — novos ambientes não sabem quais chaves precisam.",
      })
    );
    return achados;
  }

  const exemplo = readFileSync(".env.example", "utf8");
  const declaradas = new Set(
    [...exemplo.matchAll(/^([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1])
  );

  // Uso real: process.env.X no código + env("X") no schema Prisma
  const usadas = new Set();
  for (const a of arquivos) {
    if (config.ignorar.some((re) => re.test(a))) continue;
    const ehCodigo = /\.(ts|tsx|mjs)$/.test(a) && !a.startsWith("mobile/");
    const ehPrisma = a.endsWith(".prisma");
    if (!ehCodigo && !ehPrisma) continue;
    const conteudo = lerConteudo(a, false);
    for (const m of conteudo.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) {
      usadas.add(m[1]);
    }
    for (const m of conteudo.matchAll(/env\(\s*["']([A-Z][A-Z0-9_]+)["']\s*\)/g)) {
      usadas.add(m[1]);
    }
  }

  for (const chave of usadas) {
    if (!declaradas.has(chave) && !["NODE_ENV"].includes(chave)) {
      achados.push(
        achado({
          id: "env/faltando-no-exemplo",
          severidade: "media",
          arquivo: ".env.example",
          mensagem: `"${chave}" é usada no código mas não está documentada no .env.example.`,
        })
      );
    }
  }
  for (const chave of declaradas) {
    if (!usadas.has(chave) && !/^(DB_|SMTP_)/.test(chave)) {
      achados.push(
        achado({
          id: "env/nao-usada",
          severidade: "baixa",
          arquivo: ".env.example",
          mensagem: `"${chave}" declarada mas nenhum process.env.${chave} encontrado.`,
          classificacao: "Revisão Manual",
        })
      );
    }
  }
  return achados;
}
