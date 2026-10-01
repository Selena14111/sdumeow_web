import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEYS } from '@/utils/constants'

type AppState = {
  campus: string
  setCampus: (campus: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      campus: 'SOFTWARE_PARK',
      setCampus: (campus) => set({ campus }),
    }),
    { name: STORAGE_KEYS.campus },
  ),
)
