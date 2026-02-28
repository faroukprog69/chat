import { create } from "zustand";

interface CryptoState {
  privateKey: CryptoKey | null; // المفتاح الخاص المفكوك
  setPrivateKey: (key: CryptoKey | null) => void;
  clearKeys: () => void;
  name: string;
  setName: (name: string) => void;
  displayName: string;
  setDisplayName: (displayName: string) => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
  privateKey: null,
  setPrivateKey: (key) => set({ privateKey: key }),
  clearKeys: () => set({ privateKey: null }),
  name: "",
  setName: (name) => set({ name: name }),
  displayName: "",
  setDisplayName: (displayName) => set({ displayName: displayName }),
}));
