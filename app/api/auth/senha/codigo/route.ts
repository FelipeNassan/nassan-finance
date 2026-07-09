import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { estourouLimite, ipDaRequisicao } from "@/lib/auth/rate-limit";
import { lerJson } from "@/lib/auth/http";
import { assinarToken } from "@/lib/auth/tokens";

export async function OPTIONS() {
  return respostaOptions();
}

// Valida o código de recuperação e devolve um resetToken (JWT curto, escopo
// "reset") que autoriza APENAS a redefinição da senha na etapa seguinte.
export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  if (estourouLimite(`resetcodigo:${ip}`, 15, 15 * 60 * 1000)) {
    return respostaErro("Muitas tentativas. Tente mais tarde.", 429);
  }

  const body = await lerJson<{ email?: string; codigo?: string }>(request);
  const email = body?.email?.trim().toLowerCase();
  const codigo = body?.codigo?.replace(/\D/g, "");

  if (!email || !codigo || codigo.length !== 6) {
    return respostaErro("Código inválido.", 400);
  }

  const usuario = await prisma.appUser.findUnique({ where: { email } });
  if (!usuario?.activatedAt) {
    return respostaErro("Usuário não encontrado.", 404);
  }

  const registro = await prisma.passwordResetToken.findFirst({
    where: { userId: usuario.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!registro || registro.expiresAt < new Date()) {
    return respostaErro("Código expirado. Peça um novo.", 400);
  }
  if (registro.token !== codigo) {
    return respostaErro("Código incorreto.", 400);
  }

  // Código é de uso único: marca agora; a redefinição usa o resetToken
  await prisma.passwordResetToken.update({
    where: { id: registro.id },
    data: { usedAt: new Date() },
  });

  await registrarEventoAuth({
    event: "senha_reset_codigo_ok",
    userId: usuario.id,
    email,
    ip,
  });

  const resetToken = await assinarToken(usuario.id, "reset");
  return respostaJson({ resetToken });
}
