import { create } from 'zustand';

interface VisibilityStore {
  isVisible: boolean;
  toggleVisibility: () => void;
}

export const useVisibility = create<VisibilityStore>((set) => ({
  isVisible: true,
  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
}));
