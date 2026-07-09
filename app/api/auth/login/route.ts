import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth, falhasRecentesDeLogin } from "@/lib/auth/log";
import { estourouLimite, ipDaRequisicao } from "@/lib/auth/rate-limit";
import { lerJson } from "@/lib/auth/http";
import { verificarSenha } from "@/lib/auth/senha";
import { emitirCredenciais } from "@/lib/auth/tokens";

export async function OPTIONS() {
  return respostaOptions();
}

const MAX_FALHAS = 5;
const JANELA_BLOQUEIO_MIN = 15;

export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  if (estourouLimite(`login:${ip}`, 20, 15 * 60 * 1000)) {
    return respostaErro("Muitas tentativas. Tente mais tarde.", 429);
  }

  const body = await lerJson<{ email?: string; senha?: string }>(request);
  const email = body?.email?.trim().toLowerCase();
  const senha = body?.senha ?? "";

  if (!email || !senha) {
    return respostaErro("Informe e-mail e senha.", 400);
  }

  // Bloqueio temporário por e-mail após falhas repetidas (anti brute force)
  const falhas = await falhasRecentesDeLogin(email, JANELA_BLOQUEIO_MIN);
  if (falhas >= MAX_FALHAS) {
    await registrarEventoAuth({ event: "login_bloqueado", email, ip });
    return respostaErro(
      `Acesso bloqueado por ${JANELA_BLOQUEIO_MIN} minutos após muitas tentativas.`,
      429
    );
  }

  const usuario = await prisma.appUser.findUnique({ where: { email } });

  // Mensagens distintas por decisão de produto (app pessoal):
  // e-mail inexistente → "Usuário não encontrado"; senha errada → "Senha incorreta"
  if (!usuario?.passwordHash || !usuario.activatedAt) {
    await registrarEventoAuth({ event: "login_falha", email, ip });
    return respostaErro("Usuário não encontrado.", 404);
  }

  const senhaOk = await verificarSenha(senha, usuario.passwordHash);
  if (!senhaOk) {
    await registrarEventoAuth({ event: "login_falha", email, ip });
    return respostaErro("Senha incorreta.", 401);
  }

  await registrarEventoAuth({
    event: "login_ok",
    userId: usuario.id,
    email,
    ip,
  });

  const credenciais = await emitirCredenciais(usuario.id);
  return respostaJson(credenciais);
}
