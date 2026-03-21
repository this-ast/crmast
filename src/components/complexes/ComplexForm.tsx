import { useEffect, useRef, useState } from 'react'
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

const DOC_TYPE_LABELS = {
  permit: 'Разрешение на строительство',
  developer: 'Документы застройщика',
  other: 'Другое',
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {children}
    </label>
  )
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

  // Form fields as plain state — no React Hook Form
  const [name, setName] = useState('')
  const [developer, setDeveloper] = useState('')
  const [completionDate, setCompletionDate] = useState('')
  const [description, setDescription] = useState('')
  const [purchaseConditions, setPurchaseConditions] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Populate form when editing
  useEffect(() => {
    if (editingComplex) {
      setName(editingComplex.name ?? '')
      setDeveloper(editingComplex.developer ?? '')
      setCompletionDate(editingComplex.completion_date ?? '')
      setDescription(editingComplex.description ?? '')
      setPurchaseConditions(editingComplex.purchase_conditions ?? '')
    }
  }, [editingComplex])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Блокируем только если абсолютно всё пусто
    const allEmpty = !name.trim() && !developer.trim() && !completionDate.trim() && !description.trim() && !purchaseConditions.trim()
    if (allEmpty) {
      setSubmitError('Заполните хотя бы одно поле')
      return
    }

    const data = {
      name: name.trim() || 'Без названия',
      developer: developer.trim() || undefined,
      completion_date: completionDate.trim() || undefined,
      description: description.trim() || undefined,
      purchase_conditions: purchaseConditions.trim() || undefined,
      characteristics: editingComplex?.characteristics ?? {},
      developer_phones: editingComplex?.developer_phones ?? [],
      manager_names: editingComplex?.manager_names ?? [],
      manager_phones: editingComplex?.manager_phones ?? [],
    }

    console.log('[ComplexForm] Отправка данных:', data)
    setIsLoading(true)
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
      const msg = err instanceof Error ? err.message : 'Ошибка при сохранении'
      console.error('[ComplexForm] Ошибка:', err)
      setSubmitError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
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

  // Characteristics helpers
  const chars = editingComplex?.characteristics ?? {}
  const charEntries = Object.entries(chars)

  const updateChar = async (oldKey: string, newKey: string, newValue: string) => {
    if (!editingComplexId) return
    const updated = { ...chars }
    delete updated[oldKey]
    if (newKey.trim()) updated[newKey.trim()] = newValue
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

  // Phone/manager helpers
  const updateArray = async (field: 'developer_phones' | 'manager_phones' | 'manager_names', arr: string[]) => {
    if (!editingComplexId) return
    await updateComplex.mutateAsync({ id: editingComplexId, data: { [field]: arr } as never })
  }

  const devPhones = editingComplex?.developer_phones ?? []
  const mgNames = editingComplex?.manager_names ?? []
  const mgPhones = editingComplex?.manager_phones ?? []

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col" style={{ maxHeight: '80vh' }}>
      {/* Error at top */}
      {submitError && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700 shrink-0">
          ⚠️ {submitError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Name */}
        <div>
          <FieldLabel>Название ЖК</FieldLabel>
          <Input
            placeholder="ЖК Солнечный"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Developer + Completion */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Застройщик</FieldLabel>
            <Input
              placeholder="ООО Стройград"
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Срок сдачи</FieldLabel>
            <Input
              placeholder="Q4 2025"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <FieldLabel>Описание</FieldLabel>
          <textarea
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Описание ЖК..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Purchase conditions */}
        <div>
          <FieldLabel>Условия покупки</FieldLabel>
          <textarea
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="Ипотека 0,1%, рассрочка на 24 мес..."
            value={purchaseConditions}
            onChange={(e) => setPurchaseConditions(e.target.value)}
          />
        </div>

        {/* Characteristics — only when editing */}
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

        {/* Developer phones — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Телефоны застройщика</FieldLabel>
              <button
                type="button"
                onClick={() => updateArray('developer_phones', [...devPhones, ''])}
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
                      updateArray('developer_phones', arr)
                    }}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+7 900 000-00-00"
                  />
                  <button
                    type="button"
                    onClick={() => updateArray('developer_phones', devPhones.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Managers — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Менеджеры</FieldLabel>
              <button
                type="button"
                onClick={() => {
                  updateArray('manager_names', [...mgNames, ''])
                  updateArray('manager_phones', [...mgPhones, ''])
                }}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={12} /> Добавить
              </button>
            </div>
            <div className="space-y-2">
              {mgNames.map((mgName, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    defaultValue={mgName}
                    onBlur={(e) => {
                      const arr = [...mgNames]; arr[i] = e.target.value
                      updateArray('manager_names', arr)
                    }}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Имя менеджера"
                  />
                  <input
                    defaultValue={mgPhones[i] ?? ''}
                    onBlur={(e) => {
                      const arr = [...mgPhones]; arr[i] = e.target.value
                      updateArray('manager_phones', arr)
                    }}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+7 900 000-00-00"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateArray('manager_names', mgNames.filter((_, j) => j !== i))
                      updateArray('manager_phones', mgPhones.filter((_, j) => j !== i))
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
              <div className="flex gap-2 flex-wrap">
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
                <div key={doc.url} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
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
            После сохранения можно добавить фото, документы, характеристики и контакты.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={closeForm}
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 size={15} className="animate-spin" />}
          {editingComplexId ? 'Сохранить' : 'Создать ЖК'}
        </button>
      </div>
    </form>
  )
}
