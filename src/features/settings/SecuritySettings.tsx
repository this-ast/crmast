import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/auth'
import { Button, Input, Card, CardHeader } from '@/components/ui'

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type PasswordForm = z.infer<typeof passwordSchema>

export function SecuritySettings() {
  const { updatePassword } = useAuth()
  const [message, setMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = async (data: PasswordForm) => {
    setMessage('')
    const { error } = await updatePassword(data.password)
    if (error) {
      setMessage('Ошибка: ' + error.message)
    } else {
      setMessage('Пароль успешно изменён')
      reset()
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Безопасность"
        description="Смена пароля и настройки безопасности"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Новый пароль"
          type="password"
          placeholder="Минимум 6 символов"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Подтвердите новый пароль"
          type="password"
          placeholder="Повторите пароль"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
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
          <Button type="submit" loading={isSubmitting}>
            Сменить пароль
          </Button>
        </div>
      </form>
    </Card>
  )
}
