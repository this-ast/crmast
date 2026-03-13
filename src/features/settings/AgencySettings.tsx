import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button, Input, Card, CardHeader } from '@/components/ui'
import type { Agency } from '@/types'

const agencySchema = z.object({
  name: z.string().min(2, 'Введите название'),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
})

type AgencyForm = z.infer<typeof agencySchema>

export function AgencySettings() {
  const { profile, refreshProfile } = useAuth()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgencyForm>({
    resolver: zodResolver(agencySchema),
  })

  useEffect(() => {
    async function loadAgency() {
      if (!profile?.agency_id) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', profile.agency_id)
        .single()

      if (data) {
        setAgency(data as Agency)
        reset({
          name: data.name,
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
        })
      }
      setLoading(false)
    }
    loadAgency()
  }, [profile?.agency_id, reset])

  const onSubmit = async (data: AgencyForm) => {
    if (!agency) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('agencies')
      .update({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
      })
      .eq('id', agency.id)

    if (error) {
      setMessage('Ошибка сохранения: ' + error.message)
    } else {
      setMessage('Настройки агентства сохранены')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-surface-hover" />
          <div className="h-10 rounded bg-surface-hover" />
          <div className="h-10 rounded bg-surface-hover" />
        </div>
      </Card>
    )
  }

  const handleCreateAgency = useCallback(async () => {
    if (!profile) return
    setSaving(true)
    setMessage('')
    const { data: newAgency, error } = await supabase
      .from('agencies')
      .insert({ name: 'Моё агентство' })
      .select()
      .single()
    if (error || !newAgency) {
      setMessage('Ошибка создания: ' + (error?.message || 'неизвестная ошибка'))
      setSaving(false)
      return
    }
    await supabase
      .from('profiles')
      .update({ agency_id: newAgency.id })
      .eq('id', profile.id)
    await refreshProfile()
    setAgency(newAgency as Agency)
    reset({
      name: newAgency.name,
      phone: newAgency.phone || '',
      email: newAgency.email || '',
      address: newAgency.address || '',
      city: newAgency.city || '',
    })
    setSaving(false)
    setMessage('Агентство создано! Заполните данные.')
    setTimeout(() => setMessage(''), 3000)
  }, [profile, reset, refreshProfile])

  if (!agency && !loading) {
    return (
      <Card>
        <CardHeader
          title="Агентство"
          description="У вас пока нет привязанного агентства"
        />
        <Button onClick={handleCreateAgency} loading={saving}>
          Создать агентство
        </Button>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Профиль агентства"
        description="Информация о вашем агентстве"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Название агентства"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Телефон"
            placeholder="+7 (999) 123-45-67"
            {...register('phone')}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <Input
          label="Город"
          placeholder="Москва"
          {...register('city')}
        />

        <Input
          label="Адрес офиса"
          placeholder="ул. Примерная, д. 1, оф. 100"
          {...register('address')}
        />

        {message && (
          <div
            className={`rounded-lg p-3 text-sm ${
              message.startsWith('Ошибка')
                ? 'bg-danger-50 text-danger-700 dark:bg-red-950 dark:text-red-300'
                : 'bg-success-50 text-success-700 dark:bg-green-950 dark:text-green-300'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Сохранить
          </Button>
        </div>
      </form>
    </Card>
  )
}
