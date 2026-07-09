// Configuração central da auditoria — adicione regras e exceções AQUI.
//
// Supressão pontual: escreva `// audit-ok: <motivo>` na linha (ou na anterior)
// do achado. Sem motivo escrito, a supressão não vale a pena existir.

export const config = {
  // Nunca vasculhar (build/deps/lock) — vale até para a busca de segredos
  ignorarSempre: [
    /^node_modules\//,
    /\/node_modules\//,
    /^\.next\//,
    /^mobile\/\.expo\//,
    /^\.git\//,
    /package-lock\.json$/,
    /^scripts\/audit\//, // os padrões de busca vivem aqui — autodetecção seria falso positivo
  ],

  // Ignorado nas checagens estruturais (duplicados, assets, dead code),
  // MAS a busca de segredos ainda roda aqui — docs/.claude já vazaram senha antes.
  ignorar: [
    /^node_modules\//,
    /\/node_modules\//,
    /^\.next\//,
    /^mobile\/\.expo\//,
    /^\.git\//,
    /package-lock\.json$/,
    /^scripts\/audit\//,
    /^docs\//, // documentação contém exemplos didáticos
    /\.claude\//,
  ],

  // Arquivos que NUNCA podem ser commitados (bloqueia)
  arquivosProibidos: [
    { padrao: /(^|\/)\.env($|\.(?!example).*)/, motivo: "arquivo .env (segredos)" },
    { padrao: /\.(pem|key|p12|pfx|keystore|jks)$/i, motivo: "chave/certificado privado" },
    { padrao: /(^|\/)id_(rsa|ed25519|ecdsa)/, motivo: "chave SSH privada" },
    { padrao: /\.(bak|backup|dump|old|orig|tmp)$/i, motivo: "backup/temporário" },
    { padrao: /(^|\/)(\.DS_Store|Thumbs\.db)$/, motivo: "lixo de sistema operacional" },
    { padrao: /(^|\/)(node_modules|\.next|\.expo)\//, motivo: "diretório de build/dependências" },
  ],

  // Tamanho máximo de arquivo commitável (bytes)
  tamanhoMaximo: 5 * 1024 * 1024,

  // Limiares de qualidade (modo completo)
  qualidade: {
    linhasPorArquivo: 400,
    linhasPorFuncao: 80,
  },
};
