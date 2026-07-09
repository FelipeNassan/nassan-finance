// Auditoria de arquivos: sensíveis/proibidos, grandes, .gitignore e duplicados.
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { tamanhoBytes, achado } from "../util.mjs";
import { config } from "../config.mjs";

export function verificarArquivosProibidos(arquivos) {
  const achados = [];

  for (const arquivo of arquivos) {
    for (const regra of config.arquivosProibidos) {
      if (regra.padrao.test(arquivo)) {
        achados.push(
          achado({
            id: "git/arquivo-sensivel",
            severidade: "critica",
            arquivo,
            mensagem: `Arquivo não pode ser commitado: ${regra.motivo}.`,
            bloqueia: true,
          })
        );
      }
    }

    const bytes = tamanhoBytes(arquivo, true);
    if (bytes > config.tamanhoMaximo) {
      achados.push(
        achado({
          id: "git/arquivo-grande",
          severidade: "critica",
          arquivo,
          mensagem: `Arquivo com ${(bytes / 1024 / 1024).toFixed(1)} MB (limite ${config.tamanhoMaximo / 1024 / 1024} MB). Git não é lugar de binário grande.`,
          bloqueia: true,
        })
      );
    }
  }

  return achados;
}

// Garante que o .gitignore protege o essencial
export function verificarGitignore() {
  const achados = [];
  if (!existsSync(".gitignore")) {
    achados.push(
      achado({
        id: "git/sem-gitignore",
        severidade: "critica",
        arquivo: ".gitignore",
        mensagem: "Repositório sem .gitignore.",
        bloqueia: true,
      })
    );
    return achados;
  }
  const conteudo = readFileSync(".gitignore", "utf8");
  const obrigatorios = [".env", "node_modules", ".next"];
  for (const entrada of obrigatorios) {
    if (!conteudo.split(/\r?\n/).some((l) => l.trim().startsWith(entrada))) {
      achados.push(
        achado({
          id: "git/gitignore-incompleto",
          severidade: "alta",
          arquivo: ".gitignore",
          mensagem: `Falta proteger "${entrada}" no .gitignore.`,
        })
      );
    }
  }
  return achados;
}

// Modo completo: arquivos com conteúdo idêntico (hash)
export function verificarDuplicados(arquivos) {
  const porHash = new Map();
  for (const arquivo of arquivos) {
    if (config.ignorar.some((re) => re.test(arquivo))) continue;
    try {
      const buf = readFileSync(arquivo);
      if (buf.length < 64) continue; // arquivos triviais geram ruído
      const hash = createHash("sha256").update(buf).digest("hex");
      if (!porHash.has(hash)) porHash.set(hash, []);
      porHash.get(hash).push(arquivo);
    } catch {
      /* binário ilegível ou removido */
    }
  }

  const achados = [];
  for (const grupo of porHash.values()) {
    if (grupo.length > 1) {
      achados.push(
        achado({
          id: "arquivos/duplicados",
          severidade: "media",
          arquivo: grupo.join("  ≡  "),
          mensagem: "Arquivos com conteúdo idêntico — manter um e remover o resto.",
          classificacao: "Revisão Manual",
        })
      );
    }
  }
  return achados;
}

// Modo completo: assets (imagens/fontes) nunca referenciados pelo nome
export function verificarAssetsOrfaos(arquivos) {
  const assets = arquivos.filter((a) =>
    /\.(png|jpe?g|gif|webp|svg|ttf|otf|woff2?|mp3|mp4)$/i.test(a) &&
    !config.ignorar.some((re) => re.test(a))
  );
  if (assets.length === 0) return [];

  // Índice de conteúdo dos arquivos de código/config para busca por nome
  const codigo = arquivos.filter((a) => /\.(ts|tsx|js|jsx|mjs|json|css|html|md)$/.test(a));
  let corpus = "";
  for (const a of codigo) {
    try {
      corpus += readFileSync(a, "utf8") + "\n";
    } catch {
      /* ignora */
    }
  }

  const achados = [];
  for (const asset of assets) {
    const nome = asset.split("/").pop();
    if (!corpus.includes(nome)) {
      achados.push(
        achado({
          id: "arquivos/asset-orfao",
          severidade: "baixa",
          arquivo: asset,
          mensagem: `"${nome}" não é referenciado em nenhum código/config. Evidência: busca textual no repo inteiro.`,
          classificacao: "Revisão Manual",
        })
      );
    }
  }
  return achados;
}
