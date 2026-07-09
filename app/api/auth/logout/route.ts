import { respostaJson, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { ipDaRequisicao } from "@/lib/auth/rate-limit";
import { lerJson } from "@/lib/auth/http";
import { revogarRefreshToken } from "@/lib/auth/tokens";

export async function OPTIONS() {
  return respostaOptions();
}

// Revoga o refresh token da sessão. Idempotente: sempre responde ok.
export async function POST(request: Request) {
  const body = await lerJson<{ refreshToken?: string }>(request);
  if (body?.refreshToken) {
    await revogarRefreshToken(body.refreshToken);
  }
  await registrarEventoAuth({ event: "logout", ip: ipDaRequisicao(request) });
  return respostaJson({ ok: true });
}
