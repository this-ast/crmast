import { cn } from '@/utils/cn'
import type { PropertyType } from '@/types'
import { PROPERTY_TYPE_ICONS, PROPERTY_TYPE_LABELS } from '@/types'

interface PropertyTypeIconProps {
  type: PropertyType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-7 h-7 text-lg',
  md: 'w-9 h-9 text-xl',
  lg: 'w-12 h-12 text-2xl',
}

const bgClasses: Record<PropertyType, string> = {
  apartment: 'bg-blue-50',
  house: 'bg-green-50',
  land: 'bg-emerald-50',
  commercial: 'bg-purple-50',
}

export default function PropertyTypeIcon({
  type,
  size = 'md',
  showLabel = false,
  className,
}: PropertyTypeIconProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-xl flex items-center justify-center shrink-0',
          sizeClasses[size],
          bgClasses[type]
        )}
      >
        <span>{PROPERTY_TYPE_ICONS[type]}</span>
      </div>
      {showLabel && (
        <span className="text-sm text-slate-600 font-medium">{PROPERTY_TYPE_LABELS[type]}</span>
      )}
    </div>
  )
}
