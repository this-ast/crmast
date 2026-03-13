import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Handshake,
  TrendingUp,
  Plus,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Card, Spinner } from '@/components/ui'
import { cn, formatPrice, formatDateShort } from '@/lib/utils'

interface DashboardMetrics {
  totalClients: number
  totalProperties: number
  totalDeals: number
  activeDeals: number
  totalRevenue: number
}

interface ActivityItem {
  id: string
  action: string
  entity_type: string
  details: { description?: string } | null
  created_at: string
}

export function DashboardPage() {
  const { profile } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [clientsRes, propsRes, dealsRes, activityRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase.from('deals').select('id, status, commission_amount'),
        supabase
          .from('activity_log')
          .select('id, action, entity_type, details, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      const deals = dealsRes.data || []
      const activeDeals = deals.filter((d) => d.status === 'active').length
      const totalRevenue = deals
        .filter((d) => d.status === 'completed')
        .reduce((sum, d) => sum + (d.commission_amount || 0), 0)

      setMetrics({
        totalClients: clientsRes.count || 0,
        totalProperties: propsRes.count || 0,
        totalDeals: deals.length,
        activeDeals,
        totalRevenue,
      })
      setActivity((activityRes.data as ActivityItem[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const cards = [
    {
      title: 'Объекты',
      value: String(metrics?.totalProperties || 0),
      icon: Building2,
      color: 'text-primary-600 bg-primary-50 dark:bg-primary-950',
      href: '/properties',
    },
    {
      title: 'Клиенты',
      value: String(metrics?.totalClients || 0),
      icon: Users,
      color: 'text-accent-600 bg-accent-50 dark:bg-orange-950',
      href: '/clients',
    },
    {
      title: 'Сделки',
      value: String(metrics?.totalDeals || 0),
      subtitle: `${metrics?.activeDeals || 0} активных`,
      icon: Handshake,
      color: 'text-success-600 bg-success-50 dark:bg-green-950',
      href: '/deals',
    },
    {
      title: 'Комиссия',
      value: formatPrice(metrics?.totalRevenue || 0),
      subtitle: 'за все время',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
      href: '/reports',
    },
  ]

  const quickActions = [
    { label: 'Добавить объект', href: '/properties', icon: Building2 },
    { label: 'Добавить клиента', href: '/clients', icon: Users },
    { label: 'Новая сделка', href: '/deals', icon: Handshake },
  ]

  const ENTITY_LABELS: Record<string, string> = {
    client: 'Клиент',
    property: 'Объект',
    deal: 'Сделка',
    agency: 'Агентство',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Добро пожаловать{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="mt-1 text-text-secondary">Обзор вашей деятельности</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card hover className="group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{card.title}</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="mt-0.5 text-sm text-text-muted">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    card.color
                  )}
                >
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              Последние действия
            </h2>
          </div>
          {activity.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-muted">
              Нет записей активности
            </p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-secondary">
                    <Clock className="h-4 w-4 text-text-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {item.details?.description || `${item.action} ${ENTITY_LABELS[item.entity_type] || item.entity_type}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-text-muted">
                    {formatDateShort(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Быстрые действия
          </h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-hover"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
