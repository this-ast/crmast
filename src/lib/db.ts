import { openDB, type IDBPDatabase } from 'idb'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SyncQueueItem {
  id?: number
  entity: string
  operation: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  entityId?: string   // для update / delete
  timestamp: number
  status: 'pending' | 'synced' | 'error'
  error?: string
  retries: number
}

// ─── DB init ─────────────────────────────────────────────────────────────────

const DB_NAME = 'crm_offline'
const DB_VERSION = 1

let _db: IDBPDatabase | null = null

export async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('entityCache')) {
        db.createObjectStore('entityCache')
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', {
          autoIncrement: true,
          keyPath: 'id',
        })
        store.createIndex('status', 'status')
      }
    },
  })
  return _db
}

// ─── Entity cache (offline reads) ────────────────────────────────────────────

export async function cacheEntities(key: string, data: unknown[]): Promise<void> {
  try {
    const db = await getDB()
    await db.put('entityCache', data, key)
  } catch (e) {
    console.warn('[IDB] cacheEntities failed:', e)
  }
}

export async function getCachedEntities<T>(key: string): Promise<T[]> {
  try {
    const db = await getDB()
    return (await db.get('entityCache', key)) ?? []
  } catch (e) {
    console.warn('[IDB] getCachedEntities failed:', e)
    return []
  }
}

// ─── Sync queue (offline writes) ─────────────────────────────────────────────

export async function enqueue(
  item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'status' | 'retries'>
): Promise<void> {
  const db = await getDB()
  await db.add('syncQueue', {
    ...item,
    timestamp: Date.now(),
    status: 'pending',
    retries: 0,
  })
  console.log('[Queue] enqueued:', item.operation, item.entity, item.entityId ?? '')
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  const items = await db.getAllFromIndex('syncQueue', 'status', 'pending')
  // Сортируем по времени — старые сначала
  return items.sort((a, b) => a.timestamp - b.timestamp)
}

export async function getPendingCount(): Promise<number> {
  try {
    const db = await getDB()
    return db.countFromIndex('syncQueue', 'status', 'pending')
  } catch {
    return 0
  }
}

export async function markSynced(id: number): Promise<void> {
  const db = await getDB()
  const item = await db.get('syncQueue', id)
  if (item) await db.put('syncQueue', { ...item, status: 'synced' })
}

export async function markError(id: number, error: string): Promise<void> {
  const db = await getDB()
  const item = await db.get('syncQueue', id)
  if (item) {
    await db.put('syncQueue', {
      ...item,
      status: 'error',
      error,
      retries: (item.retries ?? 0) + 1,
    })
  }
}

// ─── Offline marker ───────────────────────────────────────────────────────────
// Возвращается из mutationFn при офлайн — сигнализирует onSuccess пропустить
// инвалидацию кэша (нет смысла рефетчить, сети нет)

export const OFFLINE_MARKER = { __offline: true } as const
export type OfflineMarker = typeof OFFLINE_MARKER

export function isOfflineMarker(result: unknown): result is OfflineMarker {
  return (
    typeof result === 'object' &&
    result !== null &&
    '__offline' in result &&
    (result as Record<string, unknown>).__offline === true
  )
}
