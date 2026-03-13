import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Home, Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button, Input } from '@/components/ui'

const resetSchema = z
  .object({
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type ResetForm = z.infer<typeof resetSchema>

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetForm) => {
    setServerError('')
    const { error } = await updatePassword(data.password)
    if (error) {
      setServerError(error.message)
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
              <Home className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Новый пароль
          </h1>
          <p className="mt-1 text-text-secondary">
            Введите новый пароль для вашего аккаунта
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700 dark:bg-red-950 dark:text-red-300">
                {serverError}
              </div>
            )}

            <Input
              label="Новый пароль"
              type="password"
              placeholder="Минимум 6 символов"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Подтвердите пароль"
              type="password"
              placeholder="Повторите пароль"
              icon={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Сохранить пароль
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
