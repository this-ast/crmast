import { WifiOff, RefreshCw, Clock } from 'lucide-react'
import { useNetworkStore } from '@/store/useNetworkStore'
import { cn } from '@/utils/cn'

export default function NetworkStatusBar() {
  const { isOnline, pendingCount, isSyncing } = useNetworkStore()

  // Показываем только если есть что-то важное
  const visible = !isOnline || isSyncing || pendingCount > 0
  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-1.5 text-xs font-medium select-none transition-colors',
        !isOnline
          ? 'bg-red-600 text-white'
          : isSyncing
          ? 'bg-amber-500 text-white'
          : 'bg-blue-500 text-white'
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff size={13} />
          <span>
            Офлайн{pendingCount > 0 ? ` · ${pendingCount} в очереди` : ''}
          </span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw size={13} className="animate-spin" />
          <span>Синхронизация...</span>
        </>
      ) : (
        <>
          <Clock size={13} />
          <span>{pendingCount} {pendingCount === 1 ? 'запись ожидает' : 'записей ожидают'} синхронизации</span>
        </>
      )}
    </div>
  )
}
