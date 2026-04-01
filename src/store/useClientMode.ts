import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ClientModeState {
  isClientMode: boolean
  toggle: () => void
  setClientMode: (v: boolean) => void
}

export const useClientMode = create<ClientModeState>()(
  persist(
    (set) => ({
      isClientMode: false,
      toggle: () => set((s) => ({ isClientMode: !s.isClientMode })),
      setClientMode: (v) => set({ isClientMode: v }),
    }),
    { name: 'crm-client-mode' }
  )
)
