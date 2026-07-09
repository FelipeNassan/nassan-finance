// Checklist da política de senha — espelha lib/auth/senha.ts do backend,
// usado em tempo real na tela de cadastro da senha.
export interface RequisitosSenha {
  tamanhoMinimo: boolean;
  maiuscula: boolean;
  minuscula: boolean;
  numero: boolean;
  especial: boolean;
}

export const ROTULOS_REQUISITOS: { chave: keyof RequisitosSenha; texto: string }[] = [
  { chave: "tamanhoMinimo", texto: "Mínimo de 8 caracteres" },
  { chave: "maiuscula", texto: "Uma letra maiúscula" },
  { chave: "minuscula", texto: "Uma letra minúscula" },
  { chave: "numero", texto: "Um número" },
  { chave: "especial", texto: "Um caractere especial" },
];

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
