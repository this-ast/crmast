import { useState, useRef, useEffect } from 'react'
import {
  Plus, Link2, Pencil, Trash2, Copy, Check, Search, Wand2, X, ChevronDown, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useCollections, useCreateCollection, useUpdateCollection, useDeleteCollection } from '@/hooks/useCollections'
import { useClients } from '@/hooks/useClients'
import { useProperties } from '@/hooks/useProperties'
import type { CollectionFormData, CollectionWithClient, PropertyWithOwner, Client } from '@/types'
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS } from '@/types'
import { formatPriceShort } from '@/utils/format'
import { getMatchingProperties } from '@/utils/matching'

// ─── Collection Form Modal ────────────────────────────────────────────────────

interface CollectionFormProps {
  initial?: CollectionWithClient
  onClose: () => void
}

function CollectionForm({ initial, onClose }: CollectionFormProps) {
  const { data: clients = [] } = useClients()
  const { data: allProperties = [] } = useProperties()
  const createMutation = useCreateCollection()
  const updateMutation = useUpdateCollection()

  const [title, setTitle] = useState(initial?.title ?? '')
  const [clientId, setClientId] = useState(initial?.client_id ?? '')
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initial?.property_ids ?? [])
  )
  const [propSearch, setPropSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const clientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedClient = clients.find((c) => c.id === clientId)

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      String(c.client_number).includes(q) ||
      (c.phone ?? '').includes(q)
    )
  }).slice(0, 40)

  const filteredProps = allProperties.filter((p) => {
    const q = propSearch.toLowerCase()
    return (
      p.address.toLowerCase().includes(q) ||
      p.article.toLowerCase().includes(q) ||
      (p.complex_name ?? '').toLowerCase().includes(q)
    )
  })

  function handleAutoMatch() {
    if (!selectedClient) return
    const matches = getMatchingProperties(selectedClient as Client, allProperties, 2)
    const ids = new Set(matches.map((p) => p.id))
    setSelectedIds(ids)
  }

  function toggleProperty(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const formData: CollectionFormData = {
        title: title || 'Подборка',
        client_id: clientId || undefined,
        comment: comment || undefined,
        property_ids: Array.from(selectedIds),
      }
      if (initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения'
      setError(msg)
      toast.error(msg, { duration: 8000 })
      console.error('[CollectionForm] save error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {initial ? 'Редактировать подборку' : 'Новая подборка'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Название подборки
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Подборка 2к квартир"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Client selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Клиент
              </label>
              <div className="relative" ref={clientRef}>
                <button
                  type="button"
                  onClick={() => setShowClientDropdown((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left"
                >
                  {selectedClient ? (
                    <span className="text-slate-900">
                      #{selectedClient.client_number} {selectedClient.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">Выберите клиента...</span>
                  )}
                  <ChevronDown size={16} className="text-slate-400 shrink-0" />
                </button>
                {showClientDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          autoFocus
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Поиск клиента..."
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => { setClientId(''); setShowClientDropdown(false) }}
                        className="w-full px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 text-left"
                      >
                        — Без клиента
                      </button>
                      {filteredClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setClientId(c.id); setShowClientDropdown(false); setClientSearch('') }}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 flex items-center gap-2"
                        >
                          <span className="text-slate-400 shrink-0 text-xs">#{c.client_number}</span>
                          <span className="text-slate-900 font-medium">{c.name}</span>
                          {c.phone && <span className="text-slate-400 text-xs ml-auto">{c.phone}</span>}
                        </button>
                      ))}
                      {filteredClients.length === 0 && (
                        <div className="px-3 py-3 text-sm text-slate-400 text-center">Не найдено</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Комментарий для клиента
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Добрый день! Подготовили для вас подборку..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Property selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Объекты
                  {selectedIds.size > 0 && (
                    <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                      {selectedIds.size} выбрано
                    </span>
                  )}
                </label>
                {clientId && (
                  <button
                    type="button"
                    onClick={handleAutoMatch}
                    className="flex items-center gap-1.5 text-xs font-medium text-violet-700 bg-violet-50 px-2.5 py-1.5 rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    <Wand2 size={13} />
                    Автоподбор
                  </button>
                )}
              </div>

              <div className="relative mb-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  placeholder="Поиск по адресу или артикулу..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredProps.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                      Объекты не найдены
                    </div>
                  )}
                  {filteredProps.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleProperty(p.id)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{PROPERTY_TYPE_ICONS[p.type]}</span>
                          <span className="text-xs font-mono text-slate-400">{p.article}</span>
                          <span className="text-sm font-medium text-slate-900 truncate">{p.address}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                          <span>{formatPriceShort(p.price)}</span>
                          <span>{p.area} м²</span>
                          {p.rooms !== undefined && <span>{p.rooms === 0 ? 'Студия' : `${p.rooms}к`}</span>}
                          {p.complex_name && <span className="text-slate-400">{p.complex_name}</span>}
                          {p.owner && <span className="text-slate-400">· {p.owner.name}</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Сохранение...' : (initial ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Collection Card ──────────────────────────────────────────────────────────

function CopyButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    const url = `${window.location.origin}/share/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Скопировать ссылку"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {copied ? 'Скопировано!' : 'Ссылка'}
    </button>
  )
}

interface CollectionCardProps {
  collection: CollectionWithClient
  onEdit: (c: CollectionWithClient) => void
  onDelete: (c: CollectionWithClient) => void
}

function CollectionCard({ collection, onEdit, onDelete }: CollectionCardProps) {
  const count = collection.property_ids.length
  const date = new Date(collection.created_at).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => window.open(`/share/${collection.slug}`, '_blank')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{collection.title}</h3>
          {collection.client ? (
            <p className="text-sm text-slate-500 mt-0.5">
              Клиент: <span className="font-medium text-slate-700">#{collection.client.client_number} {collection.client.name}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-400 mt-0.5">Без клиента</p>
          )}
          {collection.comment && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{collection.comment}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="font-medium text-slate-600">{count}</span> объект{count === 1 ? '' : count < 5 ? 'а' : 'ов'}
            </span>
            <span>·</span>
            <span>{date}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(collection)}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Редактировать"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(collection)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Удалить"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <CopyButton slug={collection.slug} />
        <a
          href={`/share/${collection.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <ExternalLink size={13} />
          Открыть
        </a>
      </div>
    </div>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

interface DeleteDialogProps {
  collection: CollectionWithClient
  onConfirm: () => void
  onCancel: () => void
}

function DeleteDialog({ collection, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Удалить подборку?</h3>
        <p className="text-sm text-slate-500 mb-6">
          «{collection.title}» будет удалена. Ссылка перестанет работать.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollectionsPage() {
  const { data: collections = [], isLoading } = useCollections()
  const deleteMutation = useDeleteCollection()

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<CollectionWithClient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CollectionWithClient | null>(null)
  const [search, setSearch] = useState('')

  const filtered = collections.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      (c.client?.name ?? '').toLowerCase().includes(q)
    )
  })

  function handleEdit(c: CollectionWithClient) {
    setEditTarget(c)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditTarget(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 lg:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Подборки</h1>
            <p className="text-sm text-slate-500 mt-0.5">Подборки объектов для клиентов</p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
          >
            <Plus size={16} />
            Создать
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        {/* Search */}
        {collections.length > 0 && (
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или клиенту..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            Загрузка...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && collections.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Нет подборок</h3>
            <p className="text-slate-500 text-sm mb-6">
              Создайте подборку объектов для клиента и поделитесь ссылкой
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Создать подборку
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((c) => (
              <CollectionCard
                key={c.id}
                collection={c}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && collections.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Ничего не найдено
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <CollectionForm
          initial={editTarget ?? undefined}
          onClose={handleCloseForm}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteDialog
          collection={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
