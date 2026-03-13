import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Textarea, SlideOver } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const optNum = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : Number(v)),
  z.number().optional()
)

const schema = z.object({
  title: z.string().min(2, 'Введите название'),
  type: z.enum(['apartment', 'house', 'commercial', 'land']),
  status: z.enum(['draft', 'active', 'reserved', 'sold', 'rented', 'archived']),
  address: z.string().min(2, 'Введите адрес'),
  city: z.string().min(1, 'Введите город'),
  district: z.string().optional(),
  price: z.preprocess((v) => Number(v), z.number().min(0, 'Укажите цену')),
  area: optNum,
  rooms: optNum,
  floor: optNum,
  total_floors: optNum,
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface PropertyFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editData?: {
    id: string
    title: string
    type: string
    status: string
    address: string
    city: string
    district: string | null
    price: number
    area: number | null
    rooms: number | null
    floor: number | null
    total_floors: number | null
    description: string | null
  } | null
}

export function PropertyForm({ open, onClose, onSaved, editData }: PropertyFormProps) {
  const { profile } = useAuth()
  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
  })

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          title: editData.title,
          type: editData.type as FormData['type'],
          status: editData.status as FormData['status'],
          address: editData.address,
          city: editData.city,
          district: editData.district || '',
          price: editData.price,
          area: editData.area ?? undefined,
          rooms: editData.rooms ?? undefined,
          floor: editData.floor ?? undefined,
          total_floors: editData.total_floors ?? undefined,
          description: editData.description || '',
        })
      } else {
        reset({
          title: '',
          type: 'apartment',
          status: 'active',
          address: '',
          city: '',
          district: '',
          price: 0,
          area: undefined,
          rooms: undefined,
          floor: undefined,
          total_floors: undefined,
          description: '',
        })
      }
    }
  }, [open, editData, reset])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        title: data.title,
        type: data.type,
        status: data.status,
        address: data.address,
        city: data.city,
        district: data.district || null,
        price: data.price,
        area: data.area || null,
        rooms: data.rooms || null,
        floor: data.floor || null,
        total_floors: data.total_floors || null,
        description: data.description || null,
      }

      if (isEdit) {
        const { error } = await supabase
          .from('properties')
          .update(payload)
          .eq('id', editData!.id)
        if (error) throw error
        toast.success('Объект обновлён')
      } else {
        const { error } = await supabase.from('properties').insert({
          ...payload,
          agency_id: profile?.agency_id,
          realtor_id: profile?.id,
        })
        if (error) throw error
        toast.success('Объект добавлен')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error('Ошибка: ' + (err instanceof Error ? err.message : 'неизвестная'))
    }
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEdit ? 'Редактировать объект' : 'Новый объект'}
      wide
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Название *"
          placeholder="2к квартира на ул. Ленина"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Тип объекта
            </label>
            <select
              {...register('type')}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            >
              <option value="apartment">Квартира</option>
              <option value="house">Дом</option>
              <option value="commercial">Коммерческая</option>
              <option value="land">Земельный участок</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Статус
            </label>
            <select
              {...register('status')}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            >
              <option value="draft">Черновик</option>
              <option value="active">В продаже</option>
              <option value="reserved">Забронирован</option>
              <option value="sold">Продан</option>
              <option value="rented">Сдан</option>
              <option value="archived">В архиве</option>
            </select>
          </div>
        </div>

        <Input
          label="Цена (₽) *"
          type="number"
          placeholder="3500000"
          error={errors.price?.message}
          {...register('price')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Адрес *"
            placeholder="ул. Ленина, д. 10"
            error={errors.address?.message}
            {...register('address')}
          />
          <Input
            label="Город *"
            placeholder="Нальчик"
            error={errors.city?.message}
            {...register('city')}
          />
        </div>

        <Input
          label="Район"
          placeholder="Центральный"
          {...register('district')}
        />

        <div className="grid grid-cols-4 gap-3">
          <Input
            label="Площадь (м²)"
            type="number"
            placeholder="65"
            {...register('area')}
          />
          <Input
            label="Комнат"
            type="number"
            placeholder="2"
            {...register('rooms')}
          />
          <Input
            label="Этаж"
            type="number"
            placeholder="5"
            {...register('floor')}
          />
          <Input
            label="Этажей"
            type="number"
            placeholder="9"
            {...register('total_floors')}
          />
        </div>

        <Textarea
          label="Описание"
          placeholder="Подробное описание объекта..."
          rows={3}
          {...register('description')}
        />

        <div className="flex gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button type="submit" loading={isSubmitting} className="flex-1">
            {isEdit ? 'Сохранить' : 'Добавить'}
          </Button>
        </div>
      </form>
    </SlideOver>
  )
}
