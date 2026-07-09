import { NextResponse } from "next/server";

// CORS liberado para o app Expo em desenvolvimento (RN Web roda em outra porta).
// Em produção, restringir ao domínio do app.
const CORS_HEADERS = {
  // audit-ok: CORS * é intencional em dev (RN Web em outra porta); restringir ao publicar
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function respostaJson(dados: unknown, status = 200) {
  return NextResponse.json(dados, { status, headers: CORS_HEADERS });
}

export function respostaErro(mensagem: string, status: number) {
  return respostaJson({ error: mensagem }, status);
}

export function respostaOptions() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Conflito de unicidade do Prisma (P2002) — ex.: nome duplicado.
export function ehConflitoUnico(erro: unknown): boolean {
  return (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    (erro as { code?: unknown }).code === "P2002"
  );
}
