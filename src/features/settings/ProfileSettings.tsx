import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button, Input, Textarea, Card, CardHeader, Avatar } from '@/components/ui'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Введите имя'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export function ProfileSettings() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Файл слишком большой (макс. 2MB)')
      return
    }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${profile.id}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (uploadErr) {
      setMessage('Ошибка загрузки: ' + uploadErr.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', profile.id)
    await refreshProfile()
    setUploading(false)
    setMessage('Фото обновлено')
    setTimeout(() => setMessage(''), 3000)
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      specialization: profile?.specialization || '',
    },
  })

  const onSubmit = async (data: ProfileForm) => {
    if (!profile) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        specialization: data.specialization || null,
      })
      .eq('id', profile.id)

    if (error) {
      setMessage('Ошибка сохранения: ' + error.message)
    } else {
      await refreshProfile()
      setMessage('Профиль сохранён')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader
        title="Личный профиль"
        description="Ваша персональная информация"
      />

      <div className="mb-6 flex items-center gap-4">
        <Avatar
          src={profile?.avatar_url}
          name={profile?.full_name || 'Пользователь'}
          size="xl"
        />
        <div>
          <p className="text-sm font-medium text-text-primary">
            Фото профиля
          </p>
          <p className="text-sm text-text-muted">
            JPG, PNG. Максимум 2MB.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Загрузить фото
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Полное имя"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Input
          label="Email"
          value={profile?.email || ''}
          disabled
          hint="Email нельзя изменить"
        />

        <Input
          label="Телефон"
          placeholder="+7 (999) 123-45-67"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Textarea
          label="Специализация"
          placeholder="Например: жилая недвижимость, коммерческая недвижимость"
          {...register('specialization')}
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
