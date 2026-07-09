// Padrões perigosos no código (XSS, injeção, cripto fraca, dados em log)
// e heurísticas de dead code / qualidade (modo completo).
import { lerConteudo, ehCodigo, linhaSuprimida, achado } from "../util.mjs";
import { config } from "../config.mjs";

const REGRAS = [
  // ---- Bloqueiam ----
  { id: "xss/eval", re: /\beval\s*\(/, sev: "critica", bloqueia: true, msg: "eval() — injeção de código. Remova." },
  { id: "xss/new-function", re: /\bnew\s+Function\s*\(/, sev: "critica", bloqueia: true, msg: "new Function() — equivale a eval. Remova." },
  {
    id: "xss/dangerously-set-html",
    re: /dangerouslySetInnerHTML/,
    sev: "critica",
    bloqueia: true,
    msg: "dangerouslySetInnerHTML sem sanitização — XSS. Sanitize (DOMPurify) ou remova.",
    exceto: /(DOMPurify|sanitize)/i,
  },
  { id: "xss/inner-html", re: /\.innerHTML\s*=/, sev: "critica", bloqueia: true, msg: "innerHTML= — XSS. Use textContent ou sanitize." },
  { id: "xss/document-write", re: /document\.write\s*\(/, sev: "critica", bloqueia: true, msg: "document.write — XSS/legado. Remova." },
  { id: "sqli/raw-unsafe", re: /\$(queryRawUnsafe|executeRawUnsafe)\b/, sev: "critica", bloqueia: true, msg: "Prisma RawUnsafe — SQL Injection. Use $queryRaw com template tag." },
  {
    id: "cors/aberto",
    re: /Access-Control-Allow-Origin['"]?\s*[:=]\s*['"]\*/,
    sev: "critica",
    bloqueia: true,
    msg: "CORS totalmente aberto (*). Restrinja a origem ou justifique com audit-ok.",
  },
  {
    id: "jwt/inseguro",
    re: /(algorithms?\s*[:=]\s*\[?\s*['"]none['"]|ignoreExpiration\s*:\s*true|verify\s*:\s*false)/,
    sev: "critica",
    bloqueia: true,
    msg: "JWT inseguro (sem assinatura/expiração ignorada).",
  },

  // ---- Alertam (não bloqueiam) ----
  { id: "cripto/fraca", re: /createHash\s*\(\s*['"](md5|sha1)['"]\s*\)/i, sev: "alta", msg: "Hash MD5/SHA1 — criptografia fraca. Use sha256+." },
  {
    id: "injecao/comando",
    re: /(execSync|exec|spawnSync)\s*\(\s*(`[^`]*\$\{|['"][^'"]*['"]\s*\+)/,
    sev: "alta",
    msg: "Comando de shell com interpolação — risco de command injection. Revise a origem do valor.",
  },
  { id: "path/traversal", re: /(readFile|writeFile|createReadStream|unlink)[^;\n]*\breq\.(params|query|body)/, sev: "alta", msg: "Caminho de arquivo vindo da requisição — path traversal." },
  {
    id: "log/dado-sensivel",
    re: /console\.(log|info|warn|error)\([^)\n]*\b(senha|password|token|secret|codigo|c[oó]digo)\b/i,
    sev: "media",
    msg: "console.log com possível dado sensível. Remova ou justifique com audit-ok.",
  },
  {
    id: "storage/token-web",
    re: /localStorage\.(setItem|getItem)\(\s*['"][^'"]*(token|jwt|senha)[^'"]*['"]/i,
    sev: "media",
    msg: "Token em localStorage — vulnerável a XSS na web. Prefira cookie httpOnly (ou justifique).",
  },
  { id: "debug/debugger", re: /^\s*debugger\b/, sev: "alta", msg: "debugger esquecido no código." },
  { id: "codigo/todo-fixme", re: /\b(FIXME|XXX)\b/, sev: "baixa", msg: "Marcação FIXME/XXX pendente." },
];

export function verificarCodigoPerigoso(arquivos, staged) {
  const achados = [];

  for (const arquivo of arquivos) {
    if (config.ignorar.some((re) => re.test(arquivo))) continue;
    if (!ehCodigo(arquivo)) continue;

    const conteudo = lerConteudo(arquivo, staged);
    if (!conteudo) continue;
    const linhas = conteudo.split(/\r?\n/);

    linhas.forEach((linha, i) => {
      if (linhaSuprimida(linhas, i)) return;
      for (const r of REGRAS) {
        if (r.re.test(linha) && !(r.exceto && r.exceto.test(linha))) {
          achados.push(
            achado({
              id: r.id,
              severidade: r.sev,
              arquivo,
              linha: i + 1,
              mensagem: r.msg,
              bloqueia: Boolean(r.bloqueia),
            })
          );
        }
      }
    });
  }

  return achados;
}

// Heurísticas de dead code / qualidade — modo completo, nunca bloqueiam.
export function verificarDeadCodeHeuristico(arquivos) {
  const achados = [];

  for (const arquivo of arquivos) {
    if (config.ignorar.some((re) => re.test(arquivo))) continue;
    if (!ehCodigo(arquivo)) continue;

    const conteudo = lerConteudo(arquivo, false);
    const linhas = conteudo.split(/\r?\n/);

    // Código após return no mesmo bloco (heurística de indentação)
    linhas.forEach((linha, i) => {
      const m = linha.match(/^(\s*)return\b.*;\s*$/);
      if (!m) return;
      const indent = m[1];
      const proxima = linhas[i + 1] ?? "";
      if (
        proxima.startsWith(indent) &&
        proxima.trim() &&
        !/^[}\])]/.test(proxima.trim()) &&
        !/^(case |default:|\/\/|\/\*|break)/.test(proxima.trim())
      ) {
        achados.push(
          achado({
            id: "deadcode/apos-return",
            severidade: "media",
            arquivo,
            linha: i + 2,
            mensagem: "Possível código inalcançável após return. Refatore ou remova.",
            classificacao: "Revisão Manual",
          })
        );
      }
    });

    // ifs impossíveis
    linhas.forEach((linha, i) => {
      if (/if\s*\(\s*(false|0|"")\s*\)/.test(linha)) {
        achados.push(
          achado({
            id: "deadcode/if-impossivel",
            severidade: "media",
            arquivo,
            linha: i + 1,
            mensagem: "if com condição sempre falsa — bloco morto.",
            classificacao: "Seguro para remover",
          })
        );
      }
    });

    // Arquivo grande
    if (linhas.length > config.qualidade.linhasPorArquivo) {
      achados.push(
        achado({
          id: "qualidade/arquivo-grande",
          severidade: "baixa",
          arquivo,
          mensagem: `${linhas.length} linhas (limite sugerido ${config.qualidade.linhasPorArquivo}). Considere dividir por responsabilidade.`,
        })
      );
    }

    // Funções grandes (heurística: declaração até fechamento no mesmo nível)
    linhas.forEach((linha, i) => {
      const decl = linha.match(/^(\s*)(export\s+)?(async\s+)?function\s+(\w+)/);
      if (!decl) return;
      const indent = decl[1];
      for (let j = i + 1; j < Math.min(linhas.length, i + 400); j++) {
        if (linhas[j].startsWith(indent + "}")) {
          const tamanho = j - i;
          if (tamanho > config.qualidade.linhasPorFuncao) {
            achados.push(
              achado({
                id: "qualidade/funcao-grande",
                severidade: "baixa",
                arquivo,
                linha: i + 1,
                mensagem: `Função ${decl[4]} com ~${tamanho} linhas (limite sugerido ${config.qualidade.linhasPorFuncao}).`,
              })
            );
          }
          break;
        }
      }
    });

    // Imports pesados conhecidos (performance)
    linhas.forEach((linha, i) => {
      if (/from\s+['"](lodash|moment)['"]/.test(linha)) {
        achados.push(
          achado({
            id: "performance/import-pesado",
            severidade: "media",
            arquivo,
            linha: i + 1,
            mensagem: "Import de pacote pesado inteiro (lodash/moment). Use lodash-es/date-fns ou import específico.",
          })
        );
      }
    });
  }

  return achados;
}
