import { create } from 'zustand';

interface LocalUiState {
  isRegisterModalOpen: boolean;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
}

export const useLocalUiStore = create<LocalUiState>((set) => ({
  isRegisterModalOpen: false,
  openRegisterModal: () => set({ isRegisterModalOpen: true }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),
}));
