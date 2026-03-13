import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Home, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button, Input } from '@/components/ui'

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setServerError('')
    try {
      const { error } = await signIn(data.email, data.password)
      if (error) {
        setServerError(error.message || 'Неверный email или пароль')
      } else {
        navigate(from, { replace: true })
      }
    } catch (e) {
      setServerError('Ошибка соединения: ' + (e instanceof Error ? e.message : String(e)))
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
            CRM Недвижимость
          </h1>
          <p className="mt-1 text-text-secondary">Войдите в свой аккаунт</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700 dark:bg-red-950 dark:text-red-300">
                {serverError}
              </div>
            )}

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
              placeholder="Введите пароль"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Забыли пароль?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Войти
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Нет аккаунта?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Зарегистрируйтесь
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
