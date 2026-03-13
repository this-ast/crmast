import { useEffect, useState } from 'react'
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
  client_id: z.string().min(1, 'Выберите клиента'),
  property_id: z.string().optional(),
  type: z.enum(['sale', 'rent']),
  status: z.enum(['active', 'completed', 'cancelled']),
  price: z.preprocess((v) => Number(v), z.number().min(0, 'Укажите сумму')),
  commission_percent: optNum,
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Option { id: string; label: string }

interface DealFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editData?: {
    id: string
    client_id: string | null
    property_id: string | null
    type: string
    status: string
    price: number
    commission_percent: number | null
    notes: string | null
  } | null
}

export function DealForm({ open, onClose, onSaved, editData }: DealFormProps) {
  const { profile } = useAuth()
  const isEdit = !!editData
  const [clients, setClients] = useState<Option[]>([])
  const [properties, setProperties] = useState<Option[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
  })

  useEffect(() => {
    if (!open) return
    supabase.from('clients').select('id, full_name').order('full_name').then(({ data }) => {
      setClients((data || []).map((c) => ({ id: c.id, label: c.full_name })))
    })
    supabase.from('properties').select('id, title').order('title').then(({ data }) => {
      setProperties((data || []).map((p) => ({ id: p.id, label: p.title })))
    })
  }, [open])

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          client_id: editData.client_id || '',
          property_id: editData.property_id || '',
          type: editData.type as FormData['type'],
          status: editData.status as FormData['status'],
          price: editData.price,
          commission_percent: editData.commission_percent ?? undefined,
          notes: editData.notes || '',
        })
      } else {
        reset({
          client_id: '',
          property_id: '',
          type: 'sale',
          status: 'active',
          price: 0,
          commission_percent: undefined,
          notes: '',
        })
      }
    }
  }, [open, editData, reset])

  const onSubmit = async (data: FormData) => {
    try {
      const pct = data.commission_percent != null ? data.commission_percent : null
      const commAmount = pct ? Math.round(data.price * pct / 100) : null

      const payload = {
        client_id: data.client_id,
        property_id: data.property_id || null,
        type: data.type,
        status: data.status,
        price: data.price,
        commission_percent: pct,
        commission_amount: commAmount,
        notes: data.notes || null,
      }

      if (isEdit) {
        const { error } = await supabase
          .from('deals')
          .update(payload)
          .eq('id', editData!.id)
        if (error) throw error
        toast.success('Сделка обновлена')
      } else {
        const { error } = await supabase.from('deals').insert({
          ...payload,
          agency_id: profile?.agency_id,
          realtor_id: profile?.id,
        })
        if (error) throw error
        toast.success('Сделка создана')
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
      title={isEdit ? 'Редактировать сделку' : 'Новая сделка'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Клиент *
          </label>
          <select
            {...register('client_id')}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          >
            <option value="">— Выберите клиента —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          {errors.client_id && (
            <p className="mt-1 text-xs text-red-600">{errors.client_id.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Объект (необязательно)
          </label>
          <select
            {...register('property_id')}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
          >
            <option value="">— Без объекта —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Тип сделки
            </label>
            <select
              {...register('type')}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            >
              <option value="sale">Купля-продажа</option>
              <option value="rent">Аренда</option>
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
              <option value="active">Активная</option>
              <option value="completed">Завершена</option>
              <option value="cancelled">Отменена</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Сумма сделки (₽) *"
            type="number"
            placeholder="3500000"
            error={errors.price?.message}
            {...register('price')}
          />
          <Input
            label="Комиссия (%)"
            type="number"
            placeholder="3"
            {...register('commission_percent')}
          />
        </div>

        <Textarea
          label="Заметки"
          placeholder="Детали сделки..."
          rows={3}
          {...register('notes')}
        />

        <div className="flex gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button type="submit" loading={isSubmitting} className="flex-1">
            {isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </SlideOver>
  )
}
