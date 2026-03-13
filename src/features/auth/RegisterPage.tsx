import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Home, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button, Input } from '@/components/ui'

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Введите ваше имя'),
    email: z.string().email('Введите корректный email'),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setServerError('')
    const { error } = await signUp(data.email, data.password, {
      full_name: data.full_name,
      role: 'agency_owner',
    })
    if (error) {
      setServerError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
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
            Регистрация
          </h1>
          <p className="mt-1 text-text-secondary">
            Создайте аккаунт для работы с CRM
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {success ? (
            <div className="text-center">
              <div className="rounded-lg bg-success-50 p-4 text-sm text-success-700 dark:bg-green-950 dark:text-green-300">
                Регистрация прошла успешно! Проверьте email для подтверждения.
                Перенаправление...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700 dark:bg-red-950 dark:text-red-300">
                  {serverError}
                </div>
              )}

              <Input
                label="Полное имя"
                type="text"
                placeholder="Иван Иванов"
                icon={<User className="h-4 w-4" />}
                error={errors.full_name?.message}
                {...register('full_name')}
              />

              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Пароль"
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
                Зарегистрироваться
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-text-secondary">
            Уже есть аккаунт?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Войдите
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
