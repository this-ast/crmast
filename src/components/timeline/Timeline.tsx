import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, Check, X, Loader2, Clock } from 'lucide-react'
import {
  useTimeline,
  useCreateTimelineEvent,
  useUpdateTimelineEvent,
  useDeleteTimelineEvent,
} from '@/hooks/useTimeline'
import type { TimelineEvent, TimelineEventFormData, TimelineEntityType } from '@/types'
import { TIMELINE_EVENT_TYPES } from '@/types'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

// ─── Inline event form (add / edit) ──────────────────────────────────────────

function EventForm({
  initial,
  onSave,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<TimelineEventFormData>
  onSave: (data: TimelineEventFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const now = new Date().toISOString().slice(0, 16)
  const { register, handleSubmit, watch } = useForm<TimelineEventFormData>({
    defaultValues: {
      event_type: TIMELINE_EVENT_TYPES[0].value,
      event_date: now,
      ...initial,
      // Convert full ISO to datetime-local format for the input
      ...(initial?.event_date
        ? { event_date: initial.event_date.slice(0, 16) }
        : {}),
    },
  })
  const selectedType = watch('event_type')
  const typeMeta = TIMELINE_EVENT_TYPES.find((t) => t.value === selectedType)

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="bg-slate-50 rounded-xl p-3 space-y-3 border border-slate-200"
    >
      {/* Event type pills */}
      <div className="flex flex-wrap gap-1.5">
        {TIMELINE_EVENT_TYPES.map((t) => (
          <label key={t.value} className="cursor-pointer">
            <input type="radio" {...register('event_type')} value={t.value} className="sr-only peer" />
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer',
              'border-slate-200 bg-white text-slate-600',
              'peer-checked:border-blue-400 peer-checked:bg-blue-50 peer-checked:text-blue-700'
            )}>
              {t.icon} {t.label}
            </span>
          </label>
        ))}
      </div>

      {/* Title */}
      <input
        {...register('title')}
        placeholder={typeMeta ? `${typeMeta.icon} ${typeMeta.label}...` : 'Заголовок'}
        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {/* Notes */}
      <textarea
        {...register('notes')}
        rows={2}
        placeholder="Детали, заметки..."
        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {/* Date */}
      <input
        type="datetime-local"
        {...register('event_date')}
        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-100"
        >
          <X size={12} /> Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Сохранить
        </button>
      </div>
    </form>
  )
}

// ─── Single event row ─────────────────────────────────────────────────────────

function EventRow({
  event,
  entityType,
  entityId,
}: {
  event: TimelineEvent
  entityType: TimelineEntityType
  entityId: string
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const updateEvent = useUpdateTimelineEvent(entityType, entityId)
  const deleteEvent = useDeleteTimelineEvent(entityType, entityId)

  const typeMeta = TIMELINE_EVENT_TYPES.find((t) => t.value === event.event_type)

  const handleUpdate = async (data: TimelineEventFormData) => {
    try {
      await updateEvent.mutateAsync({ id: event.id, data: {
        ...data,
        event_date: new Date(data.event_date).toISOString(),
      }})
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(event.id)
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const dateLabel = (() => {
    const d = new Date(event.event_date)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const isYesterday = d.toDateString() === new Date(today.getTime() - 86400000).toDateString()
    const time = d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return `Сегодня ${time}`
    if (isYesterday) return `Вчера ${time}`
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }) + ' ' + time
  })()

  if (editing) {
    return (
      <div className="pl-10">
        <EventForm
          initial={{
            event_type: event.event_type,
            title: event.title,
            notes: event.notes,
            event_date: event.event_date,
          }}
          onSave={handleUpdate}
          onCancel={() => setEditing(false)}
          isSubmitting={updateEvent.isPending}
        />
      </div>
    )
  }

  return (
    <div className="flex gap-3 group">
      {/* Icon */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 z-10',
          typeMeta?.color ?? 'bg-slate-100 text-slate-500'
        )}>
          {typeMeta?.icon ?? '•'}
        </div>
        {/* line below */}
        <div className="w-px flex-1 bg-slate-100 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded',
                typeMeta?.color ?? 'bg-slate-100 text-slate-500'
              )}>
                {typeMeta?.label ?? event.event_type}
              </span>
              {event.title && (
                <span className="text-xs font-medium text-slate-800">{event.title}</span>
              )}
            </div>
            {event.notes && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{event.notes}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Clock size={10} className="text-slate-300" />
              <span className="text-xs text-slate-400">{dateLabel}</span>
            </div>
          </div>

          {/* Edit/Delete — visible on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Pencil size={11} />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={handleDelete}
                  disabled={deleteEvent.isPending}
                  className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                >
                  {deleteEvent.isPending ? <Loader2 size={10} className="animate-spin" /> : 'Удалить'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="p-1 rounded text-slate-400 hover:bg-slate-100"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Timeline root component ──────────────────────────────────────────────────

export default function Timeline({
  entityType,
  entityId,
}: {
  entityType: TimelineEntityType
  entityId: string
}) {
  const { data: events = [], isLoading } = useTimeline(entityType, entityId)
  const createEvent = useCreateTimelineEvent(entityType, entityId)
  const [adding, setAdding] = useState(false)

  const handleCreate = async (data: TimelineEventFormData) => {
    try {
      await createEvent.mutateAsync({
        ...data,
        event_date: new Date(data.event_date).toISOString(),
      })
      setAdding(false)
      toast.success('Событие добавлено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          История событий
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Plus size={12} />
            Добавить
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-3">
          <EventForm
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
            isSubmitting={createEvent.isPending}
          />
        </div>
      )}

      {/* Events list */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={14} className="animate-spin text-slate-400" />
          <span className="text-xs text-slate-400">Загрузка...</span>
        </div>
      ) : events.length === 0 && !adding ? (
        <p className="text-xs text-slate-400 py-2">
          Нет событий. Нажмите «Добавить» чтобы начать историю.
        </p>
      ) : (
        <div>
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              entityType={entityType}
              entityId={entityId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
