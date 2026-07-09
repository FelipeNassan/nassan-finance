import { prisma } from "@/lib/prisma";
import { getUserId, getOrCreateUser } from "@/lib/auth";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";

export async function OPTIONS() {
  return respostaOptions();
}

// Dados do usuário logado — o app usa para decidir a rota inicial e no perfil.
export async function GET() {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  // Garante que o dev-user exista com dados padrão no modo AUTH_DISABLED
  await getOrCreateUser();

  const usuario = await prisma.appUser.findUnique({ where: { id: userId } });
  if (!usuario) return respostaErro("Não autorizado", 401);

  return respostaJson({
    id: usuario.id,
    nome: usuario.firstName
      ? `${usuario.firstName} ${usuario.lastName ?? ""}`.trim()
      : "Membro",
    primeiroNome: usuario.firstName ?? "Membro",
    email: usuario.email,
    telefone: usuario.phone,
    avatar: usuario.avatar,
    criadoEm: usuario.createdAt,
  });
}

// Edição de perfil. IMPORTANTE (segurança): e-mail e telefone NÃO são
// editáveis aqui — são campos verificados (SMS / e-mail) e alterá-los à
// revelia burlaria a verificação. Trocar e-mail/telefone deve passar pelo
// fluxo de verificação dedicado.
export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  let body: {
    firstName?: unknown;
    lastName?: unknown;
    avatar?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return respostaErro("Corpo da requisição inválido", 400);
  }

  const data: { firstName?: string; lastName?: string; avatar?: string | null } = {};
  if (typeof body.firstName === "string") {
    data.firstName = body.firstName.trim().slice(0, 60);
  }
  if (typeof body.lastName === "string") {
    data.lastName = body.lastName.trim().slice(0, 60);
  }
  if (body.avatar === null || typeof body.avatar === "string") {
    data.avatar = body.avatar;
  }

  if (Object.keys(data).length === 0) {
    return respostaErro("Nada para atualizar", 400);
  }

  try {
    await prisma.appUser.update({ where: { id: userId }, data });
    return respostaJson({ success: true });
  } catch {
    return respostaErro("Erro ao atualizar perfil", 500);
  }
}
