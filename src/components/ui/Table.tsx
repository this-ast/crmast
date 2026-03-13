import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Column<T> {
  key: string
  title: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRowClick?: (item: T) => void
  emptyMessage?: string
  loading?: boolean
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  emptyMessage = 'Нет данных',
  loading,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-secondary">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left font-medium text-text-secondary',
                  col.sortable && 'cursor-pointer select-none hover:text-text-primary',
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.title}
                  {col.sortable && sortKey === col.key && (
                    sortDir === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                Загрузка...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-hover'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3', col.className)}>
                    {col.render
                      ? col.render(item)
                      : (item[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-text-secondary">
        Страница {page} из {totalPages}
      </p>
      <div className="flex gap-1">
        <button
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Назад
        </button>
        <button
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Вперёд
        </button>
      </div>
    </div>
  )
}
