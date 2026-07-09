import bcrypt from "bcryptjs";

const CUSTO_BCRYPT = 12;

export async function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO_BCRYPT);
}

export async function verificarSenha(
  senha: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export interface RequisitosSenha {
  tamanhoMinimo: boolean;
  maiuscula: boolean;
  minuscula: boolean;
  numero: boolean;
  especial: boolean;
}

// Checklist da política de senha — o app usa a mesma estrutura em tempo real.
export function avaliarSenha(senha: string): RequisitosSenha {
  return {
    tamanhoMinimo: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /\d/.test(senha),
    especial: /[^A-Za-z0-9]/.test(senha),
  };
}

export function senhaValida(senha: string): boolean {
  return Object.values(avaliarSenha(senha)).every(Boolean);
}
