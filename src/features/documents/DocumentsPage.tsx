import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui'

export function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Документы</h1>
        <p className="mt-1 text-text-secondary">
          Шаблоны и сгенерированные документы
        </p>
      </div>

      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="Документы в разработке"
        description="Модуль документов будет доступен в следующем обновлении. Здесь вы сможете создавать договоры, акты и другие документы."
      />
    </div>
  )
}
