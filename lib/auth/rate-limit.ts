// Rate limit em memória (janela deslizante) — suficiente para instância única
// em dev/uso pessoal. Para múltiplas instâncias em produção, trocar por Redis.
const janelas = new Map<string, number[]>();

export function estourouLimite(
  chave: string,
  maxRequisicoes: number,
  janelaMs: number
): boolean {
  const agora = Date.now();
  const historico = (janelas.get(chave) ?? []).filter(
    (t) => agora - t < janelaMs
  );

  if (historico.length >= maxRequisicoes) {
    janelas.set(chave, historico);
    return true;
  }

  historico.push(agora);
  janelas.set(chave, historico);
  return false;
}

export function ipDaRequisicao(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "desconhecido"
  );
}
