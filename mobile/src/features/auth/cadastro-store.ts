import { create } from "zustand";
import type { Credenciais } from "./api";

// Estado do fluxo de cadastro em etapas. Nome/sobrenome ficam aqui até a tela
// de nascimento enviar tudo ao backend (que emite o cadastroToken). As
// credenciais finais ficam aqui até a tela de sucesso aplicá-las.
interface CadastroState {
  nome: string;
  sobrenome: string;
  token: string | null;
  ddd: string;
  numero: string;
  email: string;
  credenciais: Credenciais | null;
  // Só em dev (AUTH_DEV_RETORNA_CODIGO): código SMS para teste sem provedor
  devCodigo: string | null;

  setNomeSobrenome: (nome: string, sobrenome: string) => void;
  setToken: (t: string) => void;
  setTelefone: (ddd: string, numero: string) => void;
  setEmail: (e: string) => void;
  setCredenciais: (c: Credenciais) => void;
  setDevCodigo: (c: string | null) => void;
  reset: () => void;
}

const ESTADO_INICIAL = {
  nome: "",
  sobrenome: "",
  token: null,
  ddd: "",
  numero: "",
  email: "",
  credenciais: null,
  devCodigo: null,
};

export const useCadastro = create<CadastroState>((set) => ({
  ...ESTADO_INICIAL,

  setNomeSobrenome: (nome, sobrenome) => set({ nome, sobrenome }),
  setToken: (token) => set({ token }),
  setTelefone: (ddd, numero) => set({ ddd, numero }),
  setEmail: (email) => set({ email }),
  setCredenciais: (credenciais) => set({ credenciais }),
  setDevCodigo: (devCodigo) => set({ devCodigo }),
  reset: () => set(ESTADO_INICIAL),
}));
