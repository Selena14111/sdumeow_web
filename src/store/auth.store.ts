import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { UserProfile } from '@/types/domain'
import { UserRole } from '@/types/enums'
import { STORAGE_KEYS } from '@/utils/constants'

export type AuthState = {
  token: string | null
  role: UserRole | null
  profile: UserProfile | null
  hydrated: boolean
  login: (payload: { token: string | null; role: UserRole; profile?: UserProfile | null }) => void
  enterGuest: () => void
  logout: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      profile: null,
      hydrated: true,
      login: ({ token, role, profile = null }) =>
        set({
          token,
          role,
          profile,
        }),
      enterGuest: () =>
        set({
          token: null,
          role: UserRole.Guest,
          profile: null,
        }),
      logout: () =>
        set({
          token: null,
          role: null,
          profile: null,
        }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: STORAGE_KEYS.auth,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ token, role, profile }) => ({ token, role, profile }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)
