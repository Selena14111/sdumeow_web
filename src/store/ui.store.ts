import { create } from 'zustand'

type UiState = {
  busy: boolean
  setBusy: (busy: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  busy: false,
  setBusy: (busy) => set({ busy }),
}))
