import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Home, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button, Input } from '@/components/ui'

const forgotSchema = z.object({
  email: z.string().email('Введите корректный email'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    setServerError('')
    const { error } = await resetPassword(data.email)
    if (error) {
      setServerError(error.message)
    } else {
      setSent(true)
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
            Восстановление пароля
          </h1>
          <p className="mt-1 text-text-secondary">
            Введите email для получения ссылки на сброс пароля
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="rounded-lg bg-success-50 p-4 text-sm text-success-700 dark:bg-green-950 dark:text-green-300">
                Письмо со ссылкой для сброса пароля отправлено на указанный email.
              </div>
              <Link
                to="/login"
                className="mt-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Вернуться ко входу
              </Link>
            </div>
          ) : (
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

              <Button type="submit" className="w-full" loading={isSubmitting}>
                Отправить ссылку
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-text-secondary">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Вернуться ко входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
