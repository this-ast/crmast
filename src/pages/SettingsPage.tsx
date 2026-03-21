import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Database, Globe, Shield, Info, CheckCircle2, User, Palette,
  Tags, Filter, ChevronUp, ChevronDown, Eye, EyeOff, Pencil,
  Trash2, Plus, X, Loader2, RotateCcw, Save,
} from 'lucide-react'
import { useAgentSettings, useUpsertAgentSettings } from '@/hooks/useAgentSettings'
import {
  useCustomStatuses, useCreateCustomStatus, useUpdateCustomStatus, useDeleteCustomStatus,
} from '@/hooks/useCustomStatuses'
import { useSavedFilters, useDeleteSavedFilter } from '@/hooks/useSavedFilters'
import { useUISettings } from '@/store/useUISettings'
import type { AgentSettings } from '@/types'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'profile',   label: 'Профиль агента', icon: User },
  { id: 'interface', label: 'Интерфейс',      icon: Palette },
  { id: 'statuses',  label: 'Статусы',        icon: Tags },
  { id: 'filters',   label: 'Фильтры',        icon: Filter },
  { id: 'system',    label: 'Система',        icon: Database },
] as const

type TabId = typeof TABS[number]['id']

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { data: settings, isLoading } = useAgentSettings()
  const upsert = useUpsertAgentSettings()
  const { register, handleSubmit } = useForm<AgentSettings>({ values: settings ?? undefined })

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>

  const onSubmit = async (data: AgentSettings) => {
    try {
      await upsert.mutateAsync({ ...data, id: settings?.id })
      toast.success('Профиль сохранён')
    } catch { toast.error('Ошибка сохранения') }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { field: 'name' as const,        label: 'Имя агента',  ph: 'Иван Петров' },
          { field: 'phone' as const,       label: 'Телефон',     ph: '+7 900 000 00 00' },
          { field: 'email' as const,       label: 'Email',       ph: 'agent@example.com' },
          { field: 'agency_name' as const, label: 'Агентство',   ph: 'Название агентства' },
        ]).map(({ field, label, ph }) => (
          <div key={field}>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
            <input {...register(field)} placeholder={ph} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Соцсети</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { field: 'instagram' as const, label: 'Instagram', ph: '@username' },
            { field: 'telegram'  as const, label: 'Telegram',  ph: '@username' },
            { field: 'whatsapp'  as const, label: 'WhatsApp',  ph: '+7...' },
          ]).map(({ field, label, ph }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
              <input {...register(field)} placeholder={ph} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={upsert.isPending} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
        {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Сохранить профиль
      </button>
    </form>
  )
}

// ─── Interface Tab ────────────────────────────────────────────────────────────

function InterfaceTab() {
  const { sections, toggleSection, renameSection, moveSection, resetSections } = useUISettings()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const startEdit = (id: string, label: string) => { setEditingId(id); setEditLabel(label) }
  const saveEdit = (id: string) => {
    if (editLabel.trim()) renameSection(id, editLabel.trim())
    setEditingId(null)
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Разделы навигации</p>
          <button onClick={resetSections} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <RotateCcw size={12} /> Сбросить
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {sections.map((sec, idx) => (
            <div key={sec.id} className={cn('flex items-center gap-3 px-4 py-3', sec.hidden && 'opacity-50')}>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveSection(sec.id, 'up')} disabled={idx === 0} className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20">
                  <ChevronUp size={13} className="text-slate-400" />
                </button>
                <button onClick={() => moveSection(sec.id, 'down')} disabled={idx === sections.length - 1} className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20">
                  <ChevronDown size={13} className="text-slate-400" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                {editingId === sec.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(sec.id); if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                      className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={() => saveEdit(sec.id)} className="text-xs text-blue-600 font-medium hover:underline">OK</button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{sec.label}</span>
                    {sec.hidden && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">скрыт</span>}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(sec.id, sec.label)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Переименовать">
                  <Pencil size={13} />
                </button>
                <button onClick={() => toggleSection(sec.id)} className={cn('p-1.5 rounded-lg transition-colors', sec.hidden ? 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50')} title={sec.hidden ? 'Показать' : 'Скрыть'}>
                  {sec.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400">Изменения применяются мгновенно. Скрытые разделы не отображаются в меню.</p>
    </div>
  )
}

// ─── Statuses Tab ─────────────────────────────────────────────────────────────

const STATUS_TYPES = [
  { value: 'hot',      label: '🔥 Горячий' },
  { value: 'warm',     label: '⚡ Тёплый' },
  { value: 'thinking', label: '💭 Думает' },
  { value: 'cold',     label: '❄️ Холодный' },
  { value: 'deal',     label: '✅ Сделка' },
  { value: 'archive',  label: '📦 Архив' },
]

function EditStatusRow({ status, onSave, onCancel }: {
  status: { name: string; color: string; type: string; hint?: string }
  onSave: (patch: object) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(status.name)
  const [color, setColor] = useState(status.color)
  const [type, setType] = useState(status.type)
  const [hint, setHint] = useState(status.hint ?? '')

  return (
    <div className="flex-1 space-y-2">
      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-8 rounded border border-slate-200 cursor-pointer" />
      </div>
      <div className="flex gap-2">
        <select value={type} onChange={e => setType(e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm bg-white focus:outline-none">
          {STATUS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input value={hint} onChange={e => setHint(e.target.value)} placeholder="Подсказка" className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ name, color, type, hint })} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">Сохранить</button>
        <button onClick={onCancel} className="px-3 py-1 border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-50">Отмена</button>
      </div>
    </div>
  )
}

function StatusesTab() {
  const { data: statuses = [], isLoading } = useCustomStatuses()
  const create = useCreateCustomStatus()
  const update = useUpdateCustomStatus()
  const remove = useDeleteCustomStatus()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', color: '#6366f1', type: 'warm', hint: '' })

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Введите название')
    try {
      await create.mutateAsync({ ...form, type: form.type as 'hot'|'warm'|'thinking'|'cold'|'deal'|'archive', sort_order: statuses.length })
      setForm({ name: '', color: '#6366f1', type: 'warm', hint: '' })
      setShowForm(false)
      toast.success('Статус добавлен')
    } catch { toast.error('Ошибка') }
  }

  const handleUpdate = async (id: string, patch: object) => {
    try { await update.mutateAsync({ id, data: patch }) } catch { toast.error('Ошибка') }
  }

  const handleDelete = async (id: string) => {
    try { await remove.mutateAsync(id); toast.success('Статус удалён') } catch { toast.error('Ошибка') }
  }

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Статусы клиентов</p>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
            <Plus size={13} /> Добавить
          </button>
        </div>

        {showForm && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 space-y-3">
            <div className="flex gap-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название статуса" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer" title="Цвет" />
            </div>
            <div className="flex gap-3">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input value={form.hint} onChange={e => setForm(f => ({ ...f, hint: e.target.value }))} placeholder="Подсказка (необязательно)" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={create.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5">
                {create.isPending && <Loader2 size={12} className="animate-spin" />} Сохранить
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50">Отмена</button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-50">
          {statuses.map((status) => (
            <div key={status.id} className="flex items-center gap-3 px-4 py-3">
              {editingId === status.id ? (
                <EditStatusRow
                  status={status}
                  onSave={(patch) => { handleUpdate(status.id, patch); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{status.name}</span>
                      <span className="text-[10px] text-slate-400">{STATUS_TYPES.find(t => t.value === status.type)?.label}</span>
                    </div>
                    {status.hint && <p className="text-xs text-slate-400 truncate">{status.hint}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditingId(status.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(status.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {statuses.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Нет статусов. Добавьте первый.</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Filters Tab ──────────────────────────────────────────────────────────────

function FiltersTab() {
  const { data: clientFilters = [], isLoading } = useSavedFilters('client')
  const { data: propFilters = [] } = useSavedFilters('property')
  const deleteFilter = useDeleteSavedFilter()

  const handleDelete = async (id: string) => {
    try { await deleteFilter.mutateAsync(id); toast.success('Фильтр удалён') } catch { toast.error('Ошибка') }
  }

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>

  const allFilters = [...clientFilters, ...propFilters]

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-medium text-amber-800">
          💡 Сохранённые фильтры создаются в разделах <strong>Клиенты</strong> и <strong>Объекты</strong> — кнопка «Сохранить фильтр» рядом с поиском. Здесь можно их удалять.
        </p>
      </div>

      {allFilters.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Filter size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Нет сохранённых фильтров</p>
          <p className="text-xs text-slate-400 mt-1">Перейдите в Клиенты и настройте нужный фильтр</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Сохранённые фильтры ({allFilters.length})</p>
          </div>
          <div className="divide-y divide-slate-50">
            {allFilters.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{f.name}</span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded-full">
                      {f.entity_type === 'client' ? 'Клиенты' : 'Объекты'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {Object.entries(f.filter_data).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                </div>
                <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── System Tab ───────────────────────────────────────────────────────────────

function SystemTab() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const proxyUrl = import.meta.env.VITE_SUPABASE_PROXY_URL as string
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const isUsingProxy = !currentOrigin.includes('localhost') && !currentOrigin.includes('127.0.0.1')
  const activeUrl = isUsingProxy ? `${currentOrigin}/supabase-proxy` : proxyUrl || supabaseUrl
  const [copied, setCopied] = useState('')
  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 2000) }

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Database size={18} className="text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">База данных Supabase</h2>
        </div>
        <div className="space-y-3">
          {[{ label: 'Supabase URL', value: supabaseUrl, key: 'url' }, { label: 'Активное подключение', value: activeUrl, key: 'active' }].map(({ label, value, key }) => (
            <div key={key}>
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-mono truncate">{value || '— не задан —'}</code>
                {value && <button onClick={() => copy(value, key)} className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0">{copied === key ? '✓ Скопировано' : 'Копировать'}</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center"><Globe size={18} className="text-emerald-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Прокси для России</h2>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
          <div className={cn('w-2 h-2 rounded-full shrink-0', isUsingProxy ? 'bg-emerald-500' : 'bg-slate-300')} />
          <div>
            <p className="text-sm font-medium text-slate-800">{isUsingProxy ? 'Прокси активен' : 'Прямое подключение'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{isUsingProxy ? `${currentOrigin}/supabase-proxy → Nginx → Supabase` : 'localhost — прямой запрос к Supabase'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center"><Shield size={18} className="text-purple-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Безопасность (RLS)</h2>
        </div>
        <div className="space-y-1.5">
          {['clients','properties','deals','tasks','custom_statuses','saved_filters'].map(t => (
            <div key={t} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-700 font-mono">{t}</span>
              <div className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={13} /><span className="text-xs font-medium">RLS включён</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center"><Info size={18} className="text-slate-500" /></div>
          <h2 className="text-sm font-semibold text-slate-800">О системе</h2>
        </div>
        {[['Версия','2.0.0'],['Frontend','React 18 + TypeScript + Vite'],['UI','Tailwind CSS 4'],['БД','Supabase (PostgreSQL)'],['State','Zustand + React Query']].map(([k,v]) => (
          <div key={k} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0 text-sm">
            <span className="text-slate-500">{k}</span><span className="text-slate-800 font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  return (
    <div className="p-4 sm:p-6 max-w-screen-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Настройки</h1>
        <p className="text-sm text-slate-500 mt-0.5">Персонализация CRM под ваши задачи</p>
      </div>

      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0',
            activeTab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          )}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {activeTab === 'profile'   && <ProfileTab />}
      {activeTab === 'interface' && <InterfaceTab />}
      {activeTab === 'statuses'  && <StatusesTab />}
      {activeTab === 'filters'   && <FiltersTab />}
      {activeTab === 'system'    && <SystemTab />}
    </div>
  )
}
