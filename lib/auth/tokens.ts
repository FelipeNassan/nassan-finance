import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const segredo = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

const REFRESH_DIAS = 30;

export type EscopoToken = "acesso" | "cadastro" | "reset";

// Duração por escopo: acesso curto; cadastro cobre a jornada; reset é breve
const DURACAO: Record<EscopoToken, string> = {
  acesso: "15m",
  cadastro: "1h",
  reset: "15m",
};

// ---------- JWT (access, cadastro e reset de senha) ----------

export async function assinarToken(userId: string, escopo: EscopoToken) {
  return new SignJWT({ escopo })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(DURACAO[escopo])
    .sign(segredo);
}

export async function verificarToken(
  token: string,
  escopoEsperado: EscopoToken
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, segredo);
    if (payload.escopo !== escopoEsperado || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function extrairBearer(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

// ---------- Refresh token (opaco, persistido com hash, rotacionado) ----------

function hashDeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function emitirRefreshToken(userId: string): Promise<string> {
  const token = randomBytes(48).toString("hex");
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashDeToken(token),
      expiresAt: new Date(Date.now() + REFRESH_DIAS * 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

// Valida e ROTACIONA: o token usado é revogado e um novo é emitido.
export async function rotacionarRefreshToken(
  token: string
): Promise<{ userId: string; novoToken: string } | null> {
  const registro = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashDeToken(token) },
  });
  if (!registro || registro.revokedAt || registro.expiresAt < new Date()) {
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: registro.id },
    data: { revokedAt: new Date() },
  });

  const novoToken = await emitirRefreshToken(registro.userId);
  return { userId: registro.userId, novoToken };
}

export async function revogarRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashDeToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Revoga TODAS as sessões do usuário (troca/reset de senha).
export async function revogarTodasSessoes(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Par completo de credenciais para o app.
export async function emitirCredenciais(userId: string) {
  const [accessToken, refreshToken] = await Promise.all([
    assinarToken(userId, "acesso"),
    emitirRefreshToken(userId),
  ]);
  return { accessToken, refreshToken };
}
