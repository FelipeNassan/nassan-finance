import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { estourouLimite, ipDaRequisicao } from "@/lib/auth/rate-limit";
import { lerJson } from "@/lib/auth/http";
import { gerarHashSenha, senhaValida, avaliarSenha } from "@/lib/auth/senha";
import { verificarToken, revogarTodasSessoes } from "@/lib/auth/tokens";

export async function OPTIONS() {
  return respostaOptions();
}

// Redefine a senha com o resetToken (emitido ao validar o código).
// Revoga todas as sessões antigas. NÃO loga automaticamente: o usuário
// volta à tela de Entrar (decisão de produto).
export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  if (estourouLimite(`redefinir:${ip}`, 10, 15 * 60 * 1000)) {
    return respostaErro("Muitas tentativas. Tente mais tarde.", 429);
  }

  const body = await lerJson<{ resetToken?: string; novaSenha?: string }>(
    request
  );
  const resetToken = body?.resetToken?.trim();
  const novaSenha = body?.novaSenha ?? "";

  if (!resetToken) return respostaErro("Sessão de recuperação inválida.", 400);
  if (!senhaValida(novaSenha)) {
    return respostaJson(
      {
        error: "A senha não atende aos requisitos.",
        requisitos: avaliarSenha(novaSenha),
      },
      400
    );
  }

  const userId = await verificarToken(resetToken, "reset");
  if (!userId) {
    return respostaErro("Sessão de recuperação expirada. Recomece.", 401);
  }

  const passwordHash = await gerarHashSenha(novaSenha);
  await prisma.appUser.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Sessões antigas caem: se a senha vazou, ninguém continua logado
  await revogarTodasSessoes(userId);
  await registrarEventoAuth({ event: "senha_redefinida", userId, ip });

  return respostaJson({ ok: true });
}
