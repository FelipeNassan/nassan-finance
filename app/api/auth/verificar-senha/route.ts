import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { verificarSenha } from "@/lib/auth/senha";
import { lerJson } from "@/lib/auth/http";
import { ipDaRequisicao, estourouLimite } from "@/lib/auth/rate-limit";

export async function OPTIONS() {
  return respostaOptions();
}

export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  if (estourouLimite(`verificar_senha:${ip}`, 20, 15 * 60 * 1000)) {
    return respostaErro("Muitas tentativas. Tente mais tarde.", 429);
  }

  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const body = await lerJson<{ senha?: string }>(request);
  const senha = body?.senha ?? "";

  if (!senha) {
    return respostaErro("Informe a senha.", 400);
  }

  const usuario = await prisma.appUser.findUnique({ where: { id: userId } });

  if (!usuario?.passwordHash) {
    return respostaErro("Usuário não encontrado.", 404);
  }

  const senhaOk = await verificarSenha(senha, usuario.passwordHash);
  if (!senhaOk) {
    return respostaErro("Senha incorreta.", 401);
  }

  return respostaJson({ success: true });
}
