import { Calendar } from 'lucide-react'
import { EmptyState } from '@/components/ui'

export function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Календарь</h1>
        <p className="mt-1 text-text-secondary">
          Планирование встреч, показов и событий
        </p>
      </div>

      <EmptyState
        icon={<Calendar className="h-12 w-12" />}
        title="Календарь в разработке"
        description="Модуль календаря будет доступен в следующем обновлении. Здесь вы сможете планировать показы, встречи и другие события."
      />
    </div>
  )
}
