import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Textarea, SlideOver } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const schema = z.object({
  full_name: z.string().min(2, 'Введите имя (мин. 2 символа)'),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  type: z.enum(['buyer', 'seller', 'tenant', 'landlord']),
  status: z.enum(['new', 'contacted', 'negotiation', 'deal', 'lost']),
  priority: z.enum(['high', 'medium', 'low']),
  source: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ClientFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editData?: {
    id: string
    full_name: string
    phone: string | null
    email: string | null
    type: string
    status: string
    priority: string
    source: string | null
    notes: string | null
  } | null
}

export function ClientForm({ open, onClose, onSaved, editData }: ClientFormProps) {
  const { profile } = useAuth()
  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      type: 'buyer',
      status: 'new',
      priority: 'medium',
      source: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          full_name: editData.full_name,
          phone: editData.phone || '',
          email: editData.email || '',
          type: editData.type as FormData['type'],
          status: editData.status as FormData['status'],
          priority: (editData.priority || 'medium') as FormData['priority'],
          source: editData.source || '',
          notes: editData.notes || '',
        })
      } else {
        reset({
          full_name: '',
          phone: '',
          email: '',
          type: 'buyer',
          status: 'new',
          priority: 'medium',
          source: '',
          notes: '',
        })
      }
    }
  }, [open, editData, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        const { error } = await supabase
          .from('clients')
          .update({
            full_name: data.full_name,
            phone: data.phone || null,
            email: data.email || null,
            type: data.type,
            status: data.status,
            priority: data.priority,
            source: data.source || null,
            notes: data.notes || null,
          })
          .eq('id', editData!.id)
        if (error) throw error
        toast.success('Клиент обновлён')
      } else {
        const { error } = await supabase.from('clients').insert({
          full_name: data.full_name,
          phone: data.phone || null,
          email: data.email || null,
          type: data.type,
          status: data.status,
          priority: data.priority,
          source: data.source || null,
          notes: data.notes || null,
          agency_id: profile?.agency_id,
          realtor_id: profile?.id,
        })
        if (error) throw error
        toast.success('Клиент добавлен')
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
      title={isEdit ? 'Редактировать клиента' : 'Новый клиент'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Полное имя *"
          placeholder="Иван Иванов"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Телефон"
            placeholder="+7 (999) 123-45-67"
            {...register('phone')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Тип клиента
            </label>
            <select
              {...register('type')}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            >
              <option value="buyer">Покупатель</option>
              <option value="seller">Продавец</option>
              <option value="tenant">Арендатор</option>
              <option value="landlord">Арендодатель</option>
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
              <option value="new">Новый</option>
              <option value="contacted">Контакт установлен</option>
              <option value="negotiation">Переговоры</option>
              <option value="deal">Сделка</option>
              <option value="lost">Потерян</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Приоритет
            </label>
            <select
              {...register('priority')}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            >
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
          <Input
            label="Источник"
            placeholder="Авито, рекомендация..."
            {...register('source')}
          />
        </div>

        <Textarea
          label="Заметки"
          placeholder="Дополнительная информация..."
          rows={3}
          {...register('notes')}
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
