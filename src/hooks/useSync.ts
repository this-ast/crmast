import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNetworkStore } from '@/store/useNetworkStore'
import {
  getPendingItems,
  getPendingCount,
  markSynced,
  markError,
  type SyncQueueItem,
} from '@/lib/db'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// ─── Executor ────────────────────────────────────────────────────────────────

async function executeSyncItem(item: SyncQueueItem): Promise<void> {
  const { entity, operation, data, entityId } = item
  console.log(`[Sync] ${operation} → ${entity}`, entityId ?? '')

  if (operation === 'create') {
    const { error } = await supabase.from(entity).insert(data)
    if (error) throw new Error(error.message)
  } else if (operation === 'update') {
    if (!entityId) throw new Error('entityId required for update')
    const { error } = await supabase.from(entity).update(data).eq('id', entityId)
    if (error) throw new Error(error.message)
  } else if (operation === 'delete') {
    if (!entityId) throw new Error('entityId required for delete')
    const { error } = await supabase.from(entity).delete().eq('id', entityId)
    if (error) throw new Error(error.message)
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSync() {
  const queryClient = useQueryClient()
  const { setOnline, setPendingCount, setSyncing } = useNetworkStore()

  async function drainQueue() {
    const pending = await getPendingItems()
    if (pending.length === 0) return

    setSyncing(true)
    const toastId = toast.loading(`Синхронизация ${pending.length} записей...`)
    console.log(`[Sync] draining ${pending.length} pending items`)

    let ok = 0
    let fail = 0

    for (const item of pending) {
      try {
        await executeSyncItem(item)
        await markSynced(item.id!)
        ok++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        await markError(item.id!, msg)
        console.error('[Sync] failed:', item.entity, item.operation, msg)
        fail++
      }
    }

    setSyncing(false)
    setPendingCount(await getPendingCount())

    toast.dismiss(toastId)

    if (ok > 0) {
      toast.success(`Синхронизировано: ${ok} ${ok === 1 ? 'запись' : 'записей'}`)
      // Обновляем все кэши — данные пришли с сервера
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['complexes'] })
    }
    if (fail > 0) {
      toast.error(`Не удалось синхронизировать: ${fail} записей`)
    }
  }

  useEffect(() => {
    // Инициализация: загружаем счётчик и сразу синхронизируем если есть очередь
    getPendingCount().then((count) => {
      setPendingCount(count)
      if (count > 0 && navigator.onLine) {
        console.log(`[Sync] ${count} pending on mount, syncing...`)
        drainQueue()
      }
    })

    const handleOnline = async () => {
      console.log('[Network] → online')
      setOnline(true)
      await drainQueue()
    }

    const handleOffline = () => {
      console.log('[Network] → offline')
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, []) // eslint-disable-line
}
