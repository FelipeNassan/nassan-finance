import { prisma } from "@/lib/prisma";
import { extrairBearer, verificarToken } from "./tokens";

// Resolve o usuário PENDENTE de um token de cadastro (escopo restrito:
// só serve para as rotas do fluxo de cadastro, nunca para acessar dados).
export async function usuarioDoCadastro(req: Request) {
  const token = extrairBearer(req);
  if (!token) return null;

  const userId = await verificarToken(token, "cadastro");
  if (!userId) return null;

  return prisma.appUser.findUnique({ where: { id: userId } });
}

export function lerJson<T>(req: Request): Promise<T | null> {
  return req.json().catch(() => null) as Promise<T | null>;
}
