import { create } from 'zustand'
import { getPendingCount } from '@/lib/db'

interface NetworkStore {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  setOnline: (v: boolean) => void
  setPendingCount: (n: number) => void
  setSyncing: (v: boolean) => void
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: 0,
  isSyncing: false,
  setOnline: (v) => set({ isOnline: v }),
  setPendingCount: (n) => set({ pendingCount: n }),
  setSyncing: (v) => set({ isSyncing: v }),
}))

// Вызывается после enqueue — обновляет счётчик в сторе
export async function refreshPendingCount(): Promise<void> {
  const count = await getPendingCount()
  useNetworkStore.getState().setPendingCount(count)
}
