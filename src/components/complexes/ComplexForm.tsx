import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import {
  useCreateComplex,
  useUpdateComplex,
  useComplex,
  useUploadComplexPhoto,
  useUploadComplexDocument,
  useDeleteComplexPhoto,
  useDeleteComplexDocument,
} from '@/hooks/useComplexes'
import { useComplexStore } from '@/store/useComplexStore'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { ComplexFormData } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Укажите название'),
  developer: z.string().optional(),
  completion_date: z.string().optional(),
  description: z.string().optional(),
  purchase_conditions: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-500 mt-1">{message}</p>
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        className
      )}
      {...props}
    />
  )
}

const DOC_TYPE_LABELS = {
  permit: 'Разрешение на строительство',
  developer: 'Документы застройщика',
  other: 'Другое',
}

export default function ComplexForm() {
  const { closeForm, editingComplexId } = useComplexStore()
  const { data: editingComplex } = useComplex(editingComplexId ?? '')
  const createComplex = useCreateComplex()
  const updateComplex = useUpdateComplex()
  const uploadPhoto = useUploadComplexPhoto()
  const deletePhoto = useDeleteComplexPhoto()
  const uploadDoc = useUploadComplexDocument()
  const deleteDoc = useDeleteComplexDocument()

  const photoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  // Characteristics state (key-value pairs)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', developer: '', completion_date: '', description: '', purchase_conditions: '' },
  })

  // Dynamic lists stored outside RHF (simpler for arrays of primitives)
  const characteristics = watch('description') // placeholder, managed separately below
  void characteristics // suppress unused warning

  // We'll manage phones/contacts/characteristics in local state via useForm watch
  // Actually for simplicity, manage as separate form fields
  const developerPhones = watch('developer' as never) // unused, just typing
  void developerPhones

  useEffect(() => {
    if (editingComplex && editingComplexId) {
      reset({
        name: editingComplex.name,
        developer: editingComplex.developer ?? '',
        completion_date: editingComplex.completion_date ?? '',
        description: editingComplex.description ?? '',
        purchase_conditions: editingComplex.purchase_conditions ?? '',
      })
    }
  }, [editingComplex, editingComplexId, reset])

  const onSubmit = async (values: FormValues) => {
    const data: ComplexFormData = {
      name: values.name,
      developer: values.developer || undefined,
      completion_date: values.completion_date || undefined,
      description: values.description || undefined,
      purchase_conditions: values.purchase_conditions || undefined,
      characteristics: editingComplex?.characteristics ?? {},
      developer_phones: editingComplex?.developer_phones ?? [],
      manager_names: editingComplex?.manager_names ?? [],
      manager_phones: editingComplex?.manager_phones ?? [],
    }

    try {
      if (editingComplexId) {
        await updateComplex.mutateAsync({ id: editingComplexId, data })
        toast.success('ЖК обновлён')
      } else {
        await createComplex.mutateAsync(data)
        toast.success('ЖК добавлен')
      }
      closeForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка при сохранении')
    }
  }

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingComplexId || !e.target.files?.[0]) return
    const file = e.target.files[0]
    try {
      await uploadPhoto.mutateAsync({ complexId: editingComplexId, file })
      toast.success('Фото загружено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
    e.target.value = ''
  }

  // Document upload
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingComplexId || !e.target.files?.[0]) return
    const file = e.target.files[0]
    const docType = (e.target.dataset.doctype as 'permit' | 'developer' | 'other') ?? 'other'
    const docName = file.name.replace(/\.[^/.]+$/, '')
    try {
      await uploadDoc.mutateAsync({ complexId: editingComplexId, file, docName, docType })
      toast.success('Документ загружен')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
    e.target.value = ''
  }

  // Manage characteristics as a simple list of key-value
  const chars = editingComplex?.characteristics ?? {}
  const charEntries = Object.entries(chars)

  const updateChar = async (oldKey: string, newKey: string, newValue: string) => {
    if (!editingComplexId) return
    const updated = { ...chars }
    delete updated[oldKey]
    if (newKey) updated[newKey] = newValue
    await updateComplex.mutateAsync({ id: editingComplexId, data: { characteristics: updated } as never })
  }

  const addChar = async () => {
    if (!editingComplexId) return
    const key = `Характеристика ${charEntries.length + 1}`
    await updateComplex.mutateAsync({
      id: editingComplexId,
      data: { characteristics: { ...chars, [key]: '' } } as never,
    })
  }

  const removeChar = async (key: string) => {
    if (!editingComplexId) return
    const updated = { ...chars }
    delete updated[key]
    await updateComplex.mutateAsync({ id: editingComplexId, data: { characteristics: updated } as never })
  }

  // Manage phones
  const updatePhones = async (field: 'developer_phones' | 'manager_phones' | 'manager_names', arr: string[]) => {
    if (!editingComplexId) return
    await updateComplex.mutateAsync({ id: editingComplexId, data: { [field]: arr } as never })
  }

  const devPhones = editingComplex?.developer_phones ?? []
  const mgNames = editingComplex?.manager_names ?? []
  const mgPhones = editingComplex?.manager_phones ?? []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[85vh]">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Name */}
        <div>
          <FieldLabel required>Название ЖК</FieldLabel>
          <Input placeholder="ЖК Солнечный" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>

        {/* Developer + Completion */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Застройщик</FieldLabel>
            <Input placeholder="ООО Стройград" {...register('developer')} />
          </div>
          <div>
            <FieldLabel>Срок сдачи</FieldLabel>
            <Input placeholder="Q4 2025" {...register('completion_date')} />
          </div>
        </div>

        {/* Description */}
        <div>
          <FieldLabel>Описание</FieldLabel>
          <textarea
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Описание ЖК..."
            {...register('description')}
          />
        </div>

        {/* Purchase conditions */}
        <div>
          <FieldLabel>Условия покупки</FieldLabel>
          <textarea
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="Ипотека 0,1%, рассрочка на 24 мес..."
            {...register('purchase_conditions')}
          />
        </div>

        {/* Characteristics — only when editing (need ID for save) */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Характеристики</FieldLabel>
              <button
                type="button"
                onClick={addChar}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={12} /> Добавить
              </button>
            </div>
            <div className="space-y-2">
              {charEntries.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    defaultValue={key}
                    onBlur={(e) => updateChar(key, e.target.value, value)}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Название"
                  />
                  <span className="text-slate-300">:</span>
                  <input
                    defaultValue={value}
                    onBlur={(e) => updateChar(key, key, e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Значение"
                  />
                  <button type="button" onClick={() => removeChar(key)} className="text-red-400 hover:text-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {charEntries.length === 0 && (
                <p className="text-xs text-slate-400">Нет характеристик. Нажмите «Добавить».</p>
              )}
            </div>
          </div>
        )}

        {/* Developer phones */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Телефоны застройщика</FieldLabel>
              <button
                type="button"
                onClick={() => updatePhones('developer_phones', [...devPhones, ''])}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={12} /> Добавить
              </button>
            </div>
            <div className="space-y-2">
              {devPhones.map((phone, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    defaultValue={phone}
                    onBlur={(e) => {
                      const arr = [...devPhones]
                      arr[i] = e.target.value
                      updatePhones('developer_phones', arr)
                    }}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+7 900 000-00-00"
                  />
                  <button
                    type="button"
                    onClick={() => updatePhones('developer_phones', devPhones.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Managers */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Менеджеры</FieldLabel>
              <button
                type="button"
                onClick={() => {
                  updatePhones('manager_names', [...mgNames, ''])
                  updatePhones('manager_phones', [...mgPhones, ''])
                }}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={12} /> Добавить
              </button>
            </div>
            <div className="space-y-2">
              {mgNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    defaultValue={name}
                    onBlur={(e) => {
                      const arr = [...mgNames]; arr[i] = e.target.value
                      updatePhones('manager_names', arr)
                    }}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Имя менеджера"
                  />
                  <input
                    defaultValue={mgPhones[i] ?? ''}
                    onBlur={(e) => {
                      const arr = [...mgPhones]; arr[i] = e.target.value
                      updatePhones('manager_phones', arr)
                    }}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+7 900 000-00-00"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updatePhones('manager_names', mgNames.filter((_, j) => j !== i))
                      updatePhones('manager_phones', mgPhones.filter((_, j) => j !== i))
                    }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Фотографии</FieldLabel>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Upload size={12} /> Загрузить
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            {editingComplex?.photos && editingComplex.photos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {editingComplex.photos.map((url) => (
                  <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden group/photo">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => deletePhoto.mutate({ complexId: editingComplexId!, url })}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Нет фотографий</p>
            )}
          </div>
        )}

        {/* Documents — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Документы</FieldLabel>
              <div className="flex gap-2">
                {(['permit', 'developer', 'other'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (docInputRef.current) {
                        docInputRef.current.dataset.doctype = type
                        docInputRef.current.click()
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    + {DOC_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                className="hidden"
                onChange={handleDocUpload}
              />
            </div>
            <div className="space-y-2">
              {(editingComplex?.documents ?? []).map((doc) => (
                <div
                  key={doc.url}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-slate-500 shrink-0 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                      {DOC_TYPE_LABELS[doc.type]}
                    </span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate"
                    >
                      {doc.name}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteDoc.mutate({ complexId: editingComplexId!, url: doc.url })}
                    className="text-red-400 hover:text-red-600 shrink-0 ml-2"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {(editingComplex?.documents ?? []).length === 0 && (
                <p className="text-xs text-slate-400">Нет документов</p>
              )}
            </div>
          </div>
        )}

        {!editingComplexId && (
          <p className="text-xs text-slate-400 bg-blue-50 rounded-lg p-3">
            💡 После сохранения вы сможете добавить фото, документы, характеристики и контакты.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
        <button
          type="button"
          onClick={closeForm}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {editingComplexId ? 'Сохранить' : 'Создать ЖК'}
        </button>
      </div>
    </form>
  )
}
