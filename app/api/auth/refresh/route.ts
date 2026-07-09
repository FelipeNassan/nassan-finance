import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { estourouLimite, ipDaRequisicao } from "@/lib/auth/rate-limit";
import { lerJson } from "@/lib/auth/http";
import { assinarToken, rotacionarRefreshToken } from "@/lib/auth/tokens";

export async function OPTIONS() {
  return respostaOptions();
}

// Troca um refresh token válido por um novo par (rotação):
// o token usado é revogado — replay de token antigo falha.
export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  if (estourouLimite(`refresh:${ip}`, 30, 15 * 60 * 1000)) {
    return respostaErro("Muitas tentativas. Tente mais tarde.", 429);
  }

  const body = await lerJson<{ refreshToken?: string }>(request);
  if (!body?.refreshToken) {
    return respostaErro("Refresh token ausente.", 400);
  }

  const resultado = await rotacionarRefreshToken(body.refreshToken);
  if (!resultado) {
    await registrarEventoAuth({ event: "refresh_invalido", ip });
    return respostaErro("Sessão expirada. Entre novamente.", 401);
  }

  await registrarEventoAuth({
    event: "refresh_ok",
    userId: resultado.userId,
    ip,
  });

  const accessToken = await assinarToken(resultado.userId, "acesso");
  return respostaJson({ accessToken, refreshToken: resultado.novoToken });
}
