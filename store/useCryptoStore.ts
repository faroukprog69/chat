import { create } from "zustand";

interface CryptoState {
  privateKey: CryptoKey | null; // المفتاح الخاص المفكوك
  setPrivateKey: (key: CryptoKey | null) => void;
  clearKeys: () => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
  privateKey: null,
  setPrivateKey: (key) => set({ privateKey: key }),
  clearKeys: () => set({ privateKey: null }),
}));
