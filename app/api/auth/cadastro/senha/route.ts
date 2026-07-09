import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { ipDaRequisicao } from "@/lib/auth/rate-limit";
import { usuarioDoCadastro, lerJson } from "@/lib/auth/http";
import { gerarHashSenha, senhaValida, avaliarSenha } from "@/lib/auth/senha";
import { emitirCredenciais } from "@/lib/auth/tokens";
import { semearDadosPadrao } from "@/lib/auth";

export async function OPTIONS() {
  return respostaOptions();
}

// Etapa final do cadastro: define a senha, ativa a conta e já loga.
export async function POST(request: Request) {
  const usuario = await usuarioDoCadastro(request);
  if (!usuario) return respostaErro("Cadastro não autorizado.", 401);
  if (!usuario.phoneVerifiedAt) {
    return respostaErro("Verifique o celular antes.", 400);
  }
  if (!usuario.emailVerifiedAt) {
    return respostaErro("Confirme o e-mail antes.", 400);
  }

  const body = await lerJson<{ senha?: string }>(request);
  const senha = body?.senha ?? "";

  if (!senhaValida(senha)) {
    return respostaJson(
      { error: "A senha não atende aos requisitos.", requisitos: avaliarSenha(senha) },
      400
    );
  }

  const passwordHash = await gerarHashSenha(senha);
  await prisma.appUser.update({
    where: { id: usuario.id },
    data: { passwordHash, activatedAt: new Date() },
  });

  // Conta pronta: dados padrão + login automático
  await semearDadosPadrao(usuario.id);
  await registrarEventoAuth({
    event: "conta_ativada",
    userId: usuario.id,
    email: usuario.email,
    ip: ipDaRequisicao(request),
  });

  const credenciais = await emitirCredenciais(usuario.id);
  return respostaJson(credenciais, 201);
}
