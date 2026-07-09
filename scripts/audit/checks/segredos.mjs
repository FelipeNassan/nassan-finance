// Varredura de segredos e credenciais no conteúdo dos arquivos.
// Padrões de ALTA confiança bloqueiam; genéricos entram como Revisão Manual.
import { lerConteudo, ehTexto, linhaSuprimida, achado } from "../util.mjs";
import { config } from "../config.mjs";

const PADROES_FORTES = [
  { id: "chave-privada", re: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/, msg: "Chave privada embutida" },
  { id: "aws-key", re: /\bAKIA[0-9A-Z]{16}\b/, msg: "AWS Access Key" },
  { id: "google-key", re: /\bAIza[0-9A-Za-z\-_]{35}\b/, msg: "Google API Key" },
  { id: "openai-anthropic-key", re: /\bsk-[A-Za-z0-9_\-]{20,}\b/, msg: "Chave estilo OpenAI/Anthropic (sk-...)" },
  { id: "github-token", re: /\b(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})\b/, msg: "Token do GitHub" },
  { id: "slack-token", re: /\bxox[baprs]-[A-Za-z0-9\-]{10,}\b/, msg: "Token do Slack" },
  { id: "stripe-key", re: /\b(sk|rk)_live_[A-Za-z0-9]{20,}\b/, msg: "Chave live do Stripe" },
  { id: "jwt-completo", re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/, msg: "JWT completo colado no código" },
  {
    id: "connection-string",
    re: /\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis|amqp):\/\/[^/\s:'"]+:[^@\s'"]+@/i,
    msg: "Connection string com usuário e senha",
    ignoraPlaceholder: true, // .env.example usa usuario:senha genéricos
  },
];

// Genérico com aspas (código): chave = "valor"
const PADRAO_GENERICO =
  /\b(api[_-]?key|apikey|secret|token|senha|password|passwd|pwd|private[_-]?key)\b["']?\s*[:=]\s*["']([^"']{8,})["']/i;
// Sem aspas (YAML/compose/env/.toml): KEY: valor | KEY=valor com valor literal
const PADRAO_SEM_ASPAS =
  /\b(password|passwd|pwd|senha|secret|token|POSTGRES_PASSWORD|MYSQL_PASSWORD|api[_-]?key)\b\s*[:=]\s*([^\s'"#$][^\s'"#]{6,})\s*$/i;
const PLACEHOLDERS =
  /(exemplo|example|placeholder|troque|change|xxx+|\*\*\*|<.*>|seu[-_ ]|sua[-_ ]|process\.env|\$\{|senha-de-app|aleatorio|\busuario:senha\b|\buser:pass(word)?\b|changeme|your[-_]|dummy)/i;

// Arquivos de configuração onde "KEY: valor" cru é um literal (não código)
const EH_CONFIG = /\.(ya?ml|toml|env|example|ini|conf)$|(^|\/)(docker-compose|Dockerfile)/i;

export function verificarSegredos(arquivos, staged) {
  const achados = [];

  for (const arquivo of arquivos) {
    // Busca de segredos ignora só build/deps (não docs/.claude — já vazaram)
    if (config.ignorarSempre.some((re) => re.test(arquivo))) continue;
    if (!ehTexto(arquivo)) continue;
    const ehMarkdown = arquivo.endsWith(".md");
    const ehConfig = EH_CONFIG.test(arquivo);

    const conteudo = lerConteudo(arquivo, staged);
    if (!conteudo) continue;
    const linhas = conteudo.split(/\r?\n/);

    linhas.forEach((linha, i) => {
      if (linhaSuprimida(linhas, i)) return;

      for (const p of PADROES_FORTES) {
        if (p.ignoraPlaceholder && PLACEHOLDERS.test(linha)) continue;
        if (p.re.test(linha)) {
          achados.push(
            achado({
              id: `segredo/${p.id}`,
              severidade: "critica",
              arquivo,
              linha: i + 1,
              mensagem: `${p.msg}. Mova para o .env e revogue a credencial exposta.`,
              bloqueia: true,
            })
          );
        }
      }

      // Segredo em config sem aspas (YAML/compose/env): KEY: valorLiteral
      if (ehConfig && !PLACEHOLDERS.test(linha)) {
        const y = linha.match(PADRAO_SEM_ASPAS);
        if (y) {
          achados.push(
            achado({
              id: "segredo/config-hardcoded",
              severidade: "critica",
              arquivo,
              linha: i + 1,
              mensagem: `Credencial literal em config (${y[1]}). Use variável de ambiente (\${VAR}). Se for placeholder, ajuste o valor.`,
              bloqueia: true,
            })
          );
        }
      }

      // Genérico com aspas não roda em Markdown (exemplos didáticos)
      if (!ehMarkdown) {
        const m = linha.match(PADRAO_GENERICO);
        if (m && !PLACEHOLDERS.test(linha)) {
          achados.push(
            achado({
              id: "segredo/credencial-generica",
              severidade: "critica",
              arquivo,
              linha: i + 1,
              mensagem: `Possível credencial hardcoded (${m[1]}). Se for falso positivo, use "audit-ok: <motivo>".`,
              bloqueia: true,
            })
          );
        }

        // IP privado hardcoded — informativo, não bloqueia
        if (/\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/.test(linha)) {
          achados.push(
            achado({
              id: "segredo/ip-privado",
              severidade: "baixa",
              arquivo,
              linha: i + 1,
              mensagem: "IP privado hardcoded — confira se não vaza topologia interna.",
            })
          );
        }
      }
    });
  }

  return achados;
}
