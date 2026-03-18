import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import type { PropertyFormData, PropertyType } from '@/types'
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS } from '@/types'
import { useCreateProperty, useUpdateProperty, useProperty } from '@/hooks/useProperties'
import { useClients } from '@/hooks/useClients'
import { usePropertyStore } from '@/store/usePropertyStore'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const schema = z.object({
  type: z.enum(['apartment', 'house', 'land', 'commercial']),
  status: z.enum(['active', 'sold', 'reserved', 'withdrawn']),
  price: z.coerce.number().min(1, 'Укажите цену'),
  area: z.coerce.number().min(1, 'Укажите площадь'),
  rooms: z.coerce.number().optional(),
  floor: z.coerce.number().optional(),
  total_floors: z.coerce.number().optional(),
  view: z.string().optional(),
  address: z.string().min(1, 'Укажите адрес'),
  complex_name: z.string().optional(),
  description: z.string().optional(),
  owner_id: z.string().min(1, 'Выберите собственника'),
  area_sotki: z.coerce.number().optional(),
  communications: z.array(z.string()).optional(),
  cadastral_number: z.string().optional(),
  is_active_business: z.boolean().optional(),
  has_wet_points: z.boolean().optional(),
  has_parking: z.boolean().optional(),
  entrance_groups: z.coerce.number().optional(),
})

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

function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        className
      )}
      {...props}
    />
  )
}

const COMMUNICATIONS_OPTIONS = [
  'Электричество', 'Газ', 'Водоснабжение', 'Канализация', 'Отопление', 'Интернет',
]

export default function PropertyForm() {
  const { closeForm, editingPropertyId } = usePropertyStore()
  const { data: clients = [] } = useClients()
  const { data: editingProperty } = useProperty(editingPropertyId ?? '')
  const createProperty = useCreateProperty()
  const updateProperty = useUpdateProperty()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'apartment',
      status: 'active',
    } as PropertyFormData,
  })

  // Заполняем форму данными при редактировании
  useEffect(() => {
    if (editingProperty && editingPropertyId) {
      reset({
        type: editingProperty.type,
        status: editingProperty.status,
        price: editingProperty.price,
        area: editingProperty.area,
        rooms: editingProperty.rooms,
        floor: editingProperty.floor,
        total_floors: editingProperty.total_floors,
        view: editingProperty.view,
        address: editingProperty.address,
        complex_name: editingProperty.complex_name,
        description: editingProperty.description,
        owner_id: editingProperty.owner_id,
        area_sotki: editingProperty.area_sotki,
        communications: editingProperty.communications,
        cadastral_number: editingProperty.cadastral_number,
        is_active_business: editingProperty.is_active_business,
        has_wet_points: editingProperty.has_wet_points,
        has_parking: editingProperty.has_parking,
        entrance_groups: editingProperty.entrance_groups,
      })
    }
  }, [editingProperty, editingPropertyId, reset])

  const type = watch('type') as PropertyType
  const communications = watch('communications') ?? []

  const toggleCommunication = (value: string) => {
    const current = communications ?? []
    if (current.includes(value)) {
      setValue('communications', current.filter((c) => c !== value))
    } else {
      setValue('communications', [...current, value])
    }
  }

  const onSubmit = async (data: PropertyFormData) => {
    try {
      if (editingPropertyId) {
        await updateProperty.mutateAsync({ id: editingPropertyId, data })
        toast.success('Объект обновлён')
      } else {
        await createProperty.mutateAsync(data)
        toast.success('Объект добавлен')
      }
      closeForm()
    } catch {
      toast.error('Ошибка при сохранении')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[85vh]">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Type selection */}
        <div>
          <FieldLabel required>Тип объекта</FieldLabel>
          <div className="grid grid-cols-4 gap-2">
            {(['apartment', 'house', 'land', 'commercial'] as PropertyType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all',
                  type === t
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                <span className="text-lg">{PROPERTY_TYPE_ICONS[t]}</span>
                {PROPERTY_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <FieldLabel required>Статус</FieldLabel>
          <Select {...register('status')}>
            <option value="active">Активный</option>
            <option value="reserved">Резерв</option>
            <option value="sold">Продан</option>
            <option value="withdrawn">Снят</option>
          </Select>
        </div>

        {/* Price & Area */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>Цена (₽)</FieldLabel>
            <Input type="number" placeholder="5500000" {...register('price')} />
            <FieldError message={errors.price?.message} />
          </div>
          <div>
            <FieldLabel required>Площадь (м²)</FieldLabel>
            <Input type="number" placeholder="65" {...register('area')} />
            <FieldError message={errors.area?.message} />
          </div>
        </div>

        {/* Apartment specific */}
        {type === 'apartment' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Комнат</FieldLabel>
                <Select {...register('rooms')}>
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>Этаж</FieldLabel>
                <Input type="number" placeholder="5" {...register('floor')} />
              </div>
              <div>
                <FieldLabel>Всего этажей</FieldLabel>
                <Input type="number" placeholder="16" {...register('total_floors')} />
              </div>
            </div>
            <div>
              <FieldLabel>Вид из окон</FieldLabel>
              <Input placeholder="Двор, улица, парк..." {...register('view')} />
            </div>
          </div>
        )}

        {/* Land specific */}
        {type === 'land' && (
          <div className="space-y-3">
            <div>
              <FieldLabel>Площадь (соток)</FieldLabel>
              <Input type="number" placeholder="15" {...register('area_sotki')} />
            </div>
            <div>
              <FieldLabel>Кадастровый номер</FieldLabel>
              <Input placeholder="50:01:0000000:123" {...register('cadastral_number')} />
            </div>
            <div>
              <FieldLabel>Коммуникации</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {COMMUNICATIONS_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCommunication(c)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      communications?.includes(c)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Commercial specific */}
        {type === 'commercial' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-blue-600"
                  {...register('is_active_business')}
                />
                <span className="text-sm text-slate-700">Действующий бизнес</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-blue-600"
                  {...register('has_wet_points')}
                />
                <span className="text-sm text-slate-700">Мокрые точки</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-blue-600"
                  {...register('has_parking')}
                />
                <span className="text-sm text-slate-700">Парковка</span>
              </label>
              <div>
                <FieldLabel>Входных групп</FieldLabel>
                <Input type="number" placeholder="1" {...register('entrance_groups')} />
              </div>
            </div>
            <div>
              <FieldLabel>Коммуникации</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {COMMUNICATIONS_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCommunication(c)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      communications?.includes(c)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="space-y-3">
          <div>
            <FieldLabel>Название ЖК</FieldLabel>
            <Input placeholder="Москва Сити, Новые Черёмушки..." {...register('complex_name')} />
          </div>
          <div>
            <FieldLabel required>Адрес</FieldLabel>
            <Input placeholder="ул. Ленина, д. 5, кв. 12" {...register('address')} />
            <FieldError message={errors.address?.message} />
          </div>
        </div>

        {/* Description */}
        <div>
          <FieldLabel>Описание</FieldLabel>
          <textarea
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Описание объекта..."
            {...register('description')}
          />
        </div>

        {/* Owner */}
        <div>
          <FieldLabel required>Собственник</FieldLabel>
          <Select {...register('owner_id')}>
            <option value="">Выберите клиента</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (#{c.client_number})
              </option>
            ))}
          </Select>
          <FieldError message={errors.owner_id?.message} />
        </div>
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
          {editingPropertyId ? 'Сохранить' : 'Добавить объект'}
        </button>
      </div>
    </form>
  )
}
