import { create } from "zustand";
import { marcarIntroExibida } from "./intro";

// Orquestra a animação de onboarding que aparece POR CIMA da Home logo após
// login/cadastro. A Home fica montada embaixo; ao final, o overlay revela a
// Home (cards em stagger) — sem transição de rota, sem corte seco.
interface OnboardingState {
  ativo: boolean; // overlay visível
  revelar: boolean; // fase de revelação: Home começa a entrar
  nome: string;
  iniciar: (nome: string) => void;
  revelarHome: () => void;
  concluir: () => void;
}

export const useOnboarding = create<OnboardingState>((set) => ({
  ativo: false,
  revelar: false,
  nome: "",
  iniciar: (nome) => {
    // A saudação animada do onboarding substitui a intro simples da Home
    marcarIntroExibida();
    set({ ativo: true, revelar: false, nome });
  },
  revelarHome: () => set({ revelar: true }),
  concluir: () => set({ ativo: false, revelar: false }),
}));
