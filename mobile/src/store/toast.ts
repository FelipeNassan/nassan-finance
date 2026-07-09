import { create } from "zustand";

export type ToastTipo = "sucesso" | "erro";

interface ToastState {
  mensagem: string | null;
  tipo: ToastTipo;
  mostrar: (mensagem: string, tipo?: ToastTipo) => void;
  esconder: () => void;
}

export const useToast = create<ToastState>((set) => ({
  mensagem: null,
  tipo: "sucesso",
  mostrar: (mensagem, tipo = "sucesso") => set({ mensagem, tipo }),
  esconder: () => set({ mensagem: null }),
}));
