import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import {
  Plus, MessageSquare, Copy, Check, Pencil, Trash2,
  Loader2, Search, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
} from '@/hooks/useTemplates'
import type { MessageTemplate, TemplateFormData } from '@/types'
import { TEMPLATE_CATEGORIES } from '@/types'
import { cn } from '@/utils/cn'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

// ─── Template Form ────────────────────────────────────────────────────────────

function TemplateForm({
  initial,
  onSave,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<TemplateFormData>
  onSave: (data: TemplateFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<TemplateFormData>({
    defaultValues: { category: 'Общее', ...initial },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col max-h-[85vh]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Название шаблона <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title', { required: 'Укажите название' })}
            placeholder="Первый контакт с продавцом..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Категория</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <label key={cat.value} className="cursor-pointer">
                <input type="radio" {...register('category')} value={cat.value} className="sr-only peer" />
                <span className={cn(
                  'inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                  'border-slate-200 text-slate-600 bg-white',
                  'peer-checked:border-blue-400 peer-checked:bg-blue-50 peer-checked:text-blue-700'
                )}>
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Текст сообщения <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('body', { required: 'Введите текст шаблона' })}
            rows={8}
            placeholder="Здравствуйте, [Имя]! Меня зовут [Ваше имя], я риэлтор..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed"
          />
          {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>}
          <p className="text-xs text-slate-400 mt-1">
            Используйте [Имя], [Адрес], [Цена] и другие метки — замените вручную перед отправкой
          </p>
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Сохранить
        </button>
      </div>
    </form>
  )
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: MessageTemplate
  onEdit: (t: MessageTemplate) => void
  onDelete: (t: MessageTemplate) => void
}) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const catMeta = TEMPLATE_CATEGORIES.find((c) => c.value === template.category)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(template.body)
    setCopied(true)
    toast.success('Скопировано в буфер')
    setTimeout(() => setCopied(false), 2000)
  }

  // Show preview: first 120 chars
  const preview = template.body.length > 120
    ? template.body.slice(0, 120) + '...'
    : template.body
  const hasMore = template.body.length > 120

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare size={14} className="text-blue-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{template.title}</span>
            {catMeta && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {catMeta.label}
              </span>
            )}
          </div>

          {/* Body preview / expanded */}
          <div className="mt-2">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {expanded ? template.body : preview}
            </p>
            {hasMore && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 font-medium"
              >
                {expanded ? <><ChevronUp size={12} /> Свернуть</> : <><ChevronDown size={12} /> Показать полностью</>}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            )}
            title="Скопировать"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Редактировать"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(template)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Удалить"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ALL_TAB = '__all__'

export default function TemplatesPage() {
  const { data: templates = [], isLoading, error } = useTemplates()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()

  const [activeCategory, setActiveCategory] = useState(ALL_TAB)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [deleting, setDeleting] = useState<MessageTemplate | null>(null)

  // Count per category
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of templates) {
      map[t.category] = (map[t.category] ?? 0) + 1
    }
    return map
  }, [templates])

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (activeCategory !== ALL_TAB && t.category !== activeCategory) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.body.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [templates, activeCategory, search])

  const handleSave = async (data: TemplateFormData) => {
    try {
      if (editing) {
        await updateTemplate.mutateAsync({ id: editing.id, data })
        toast.success('Шаблон обновлён')
      } else {
        await createTemplate.mutateAsync(data)
        toast.success('Шаблон добавлен')
      }
      setIsFormOpen(false)
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка при сохранении')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteTemplate.mutateAsync(deleting.id)
      toast.success('Шаблон удалён')
      setDeleting(null)
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const openEdit = (t: MessageTemplate) => {
    setEditing(t)
    setIsFormOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Шаблоны сообщений</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} из {templates.length}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setIsFormOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Новый шаблон
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveCategory(ALL_TAB)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            activeCategory === ALL_TAB
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
          )}
        >
          Все <span className={cn('ml-1', activeCategory === ALL_TAB ? 'opacity-80' : 'text-slate-400')}>{templates.length}</span>
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => {
          const count = counts[cat.value] ?? 0
          if (count === 0 && activeCategory !== cat.value) return null
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeCategory === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              )}
            >
              {cat.label}
              {count > 0 && (
                <span className={cn('ml-1', activeCategory === cat.value ? 'opacity-80' : 'text-slate-400')}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по названию или тексту..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 rounded-xl text-red-700 text-sm space-y-1">
          <p className="font-medium">Ошибка загрузки шаблонов</p>
          <p className="text-red-500 text-xs font-mono">{(error as Error).message}</p>
          <p className="text-xs text-red-400 mt-2">Запустите add_templates.sql в Supabase SQL Editor</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <MessageSquare size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Шаблонов нет</p>
          <p className="text-slate-400 text-sm mt-1">
            {templates.length === 0
              ? 'Добавьте первый шаблон сообщения'
              : 'Попробуйте изменить фильтры'}
          </p>
        </div>
      )}

      {/* List */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} onEdit={openEdit} onDelete={setDeleting} />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditing(null) }}
        title={editing ? 'Редактировать шаблон' : 'Новый шаблон'}
        size="lg"
      >
        <TemplateForm
          initial={editing ? { title: editing.title, body: editing.body, category: editing.category } : undefined}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditing(null) }}
          isSubmitting={createTemplate.isPending || updateTemplate.isPending}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Удалить шаблон?"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-5">
            Шаблон <span className="font-semibold text-slate-900">«{deleting?.title}»</span> будет удалён безвозвратно.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleting(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteTemplate.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {deleteTemplate.isPending && <Loader2 size={14} className="animate-spin" />}
              Удалить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
