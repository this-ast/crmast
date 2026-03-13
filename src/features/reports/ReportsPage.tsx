import { BarChart3 } from 'lucide-react'
import { EmptyState } from '@/components/ui'

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Отчёты и аналитика</h1>
        <p className="mt-1 text-text-secondary">
          Аналитика деятельности и финансовые отчёты
        </p>
      </div>

      <EmptyState
        icon={<BarChart3 className="h-12 w-12" />}
        title="Отчёты в разработке"
        description="Модуль отчётов будет доступен в следующем обновлении. Здесь вы увидите статистику по объектам, клиентам и сделкам."
      />
    </div>
  )
}
