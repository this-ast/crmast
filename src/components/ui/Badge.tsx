import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
  success: 'bg-success-50 text-success-700 dark:bg-green-950 dark:text-green-300',
  warning: 'bg-warning-50 text-warning-600 dark:bg-yellow-950 dark:text-yellow-300',
  danger: 'bg-danger-50 text-danger-700 dark:bg-red-950 dark:text-red-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    draft: { label: 'Черновик', variant: 'default' },
    active: { label: 'Активный', variant: 'success' },
    reserved: { label: 'Забронирован', variant: 'warning' },
    sold: { label: 'Продан', variant: 'primary' },
    rented: { label: 'Сдан', variant: 'info' },
    archived: { label: 'Архив', variant: 'default' },
    new: { label: 'Новый', variant: 'info' },
    contacted: { label: 'Контакт', variant: 'primary' },
    negotiation: { label: 'Переговоры', variant: 'warning' },
    deal: { label: 'Сделка', variant: 'success' },
    lost: { label: 'Потерян', variant: 'danger' },
    completed: { label: 'Завершена', variant: 'success' },
    cancelled: { label: 'Отменена', variant: 'danger' },
  }

  const { label, variant } = config[status] ?? { label: status, variant: 'default' as BadgeVariant }

  return <Badge variant={variant}>{label}</Badge>
}
