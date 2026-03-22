import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CalendarDays, FileText, Phone, User, X,
  Pencil, Trash2, ChevronRight, ExternalLink, Download,
} from 'lucide-react'
import { useComplex, useDeleteComplex } from '@/hooks/useComplexes'
import { useComplexStore } from '@/store/useComplexStore'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import { formatPriceShort } from '@/utils/format'
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_COLORS, PROPERTY_STATUS_LABELS } from '@/types'
import toast from 'react-hot-toast'
import PropertyTypeIcon from '@/components/properties/PropertyTypeIcon'
import ComplexPdfButton from '@/components/pdf/ComplexPdfButton'

interface ComplexDetailProps {
  complexId: string
  onClose: () => void
}

const DOC_TYPE_LABELS = {
  permit: 'Разрешение на строительство',
  developer: 'Документы застройщика',
  other: 'Документ',
}

export default function ComplexDetail({ complexId, onClose }: ComplexDetailProps) {
  const { data: complex, isLoading } = useComplex(complexId)
  const { data: agentSettings } = useAgentSettings()
  const deleteComplex = useDeleteComplex()
  const { openForm } = useComplexStore()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)

  const handleEdit = () => {
    onClose()
    setTimeout(() => openForm(complexId), 150)
  }

  const handleDelete = async () => {
    try {
      await deleteComplex.mutateAsync(complexId)
      toast.success('ЖК удалён')
      onClose()
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const handlePropertyClick = (propertyId: string) => {
    onClose()
    setTimeout(() => navigate(`/properties?open=${propertyId}`), 150)
  }

  if (isLoading || !complex) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const properties = (complex as unknown as { properties?: typeof complex & { properties: [] } }).properties
    ? (complex as unknown as { properties: Record<string, unknown>[] }).properties
    : []

  const charEntries = Object.entries(complex.characteristics ?? {})

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{complex.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {complex.developer && (
                <span className="text-xs text-slate-500">{complex.developer}</span>
              )}
              {complex.completion_date && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  <CalendarDays size={11} />
                  Сдача: {complex.completion_date}
                </span>
              )}
              {(properties as unknown[]).length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {(properties as unknown[]).length} объект{
                    (properties as unknown[]).length === 1 ? '' :
                    (properties as unknown[]).length < 5 ? 'а' : 'ов'
                  }
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <ComplexPdfButton complex={complex} properties={properties as never} agentSettings={agentSettings ?? {}} />
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Редактировать"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Удалить"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mx-6 mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm font-medium text-red-700 mb-3">Удалить этот ЖК?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteComplex.isPending}
              className="flex-1 py-1.5 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Photos gallery */}
        {complex.photos.length > 0 && (
          <div>
            <div className="w-full h-48 rounded-xl overflow-hidden mb-2 bg-slate-100">
              <img
                src={complex.photos[activePhotoIdx]}
                alt={complex.name}
                className="w-full h-full object-cover"
              />
            </div>
            {complex.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {complex.photos.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setActivePhotoIdx(i)}
                    className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      activePhotoIdx === i ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {complex.description && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Описание</h3>
            <p className="text-sm text-slate-700 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {complex.description}
            </p>
          </div>
        )}

        {/* Purchase conditions */}
        {complex.purchase_conditions && (
          <div className="bg-emerald-50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
              Условия покупки
            </h3>
            <p className="text-sm text-emerald-800" style={{ whiteSpace: 'pre-wrap' }}>
              {complex.purchase_conditions}
            </p>
          </div>
        )}

        {/* Structural building characteristics */}
        {(complex.floors_total || complex.building_type || complex.elevator ||
          (complex.yard_features?.length ?? 0) > 0 || (complex.parking?.length ?? 0) > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Характеристики здания
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {complex.floors_total && (
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">Этажность</p>
                  <p className="text-sm font-medium text-slate-800">{complex.floors_total}</p>
                </div>
              )}
              {complex.building_type && (
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">Тип дома</p>
                  <p className="text-sm font-medium text-slate-800">{complex.building_type}</p>
                </div>
              )}
              {complex.elevator && (
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">Лифт</p>
                  <p className="text-sm font-medium text-slate-800">{complex.elevator}</p>
                </div>
              )}
              {(complex.yard_features?.length ?? 0) > 0 && (
                <div className="bg-slate-50 rounded-lg p-2.5 col-span-2">
                  <p className="text-xs text-slate-400 mb-1.5">Двор</p>
                  <div className="flex flex-wrap gap-1.5">
                    {complex.yard_features!.map((f) => (
                      <span key={f} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {(complex.parking?.length ?? 0) > 0 && (
                <div className="bg-slate-50 rounded-lg p-2.5 col-span-2">
                  <p className="text-xs text-slate-400 mb-1.5">Парковка</p>
                  <div className="flex flex-wrap gap-1.5">
                    {complex.parking!.map((p) => (
                      <span key={p} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Free-form characteristics */}
        {charEntries.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Дополнительно
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {charEntries.map(([key, value]) => (
                <div key={key} className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">{key}</p>
                  <p className="text-sm font-medium text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        {(complex.developer_phones.length > 0 || complex.manager_names.length > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Контакты
            </h3>
            <div className="space-y-2">
              {complex.developer_phones.map((phone, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Телефон застройщика</p>
                    <p className="text-sm font-medium text-slate-800">{phone}</p>
                  </div>
                </div>
              ))}
              {complex.manager_names.map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">Менеджер</p>
                    <p className="text-sm font-medium text-slate-800">{name}</p>
                  </div>
                  {complex.manager_phones[i] && (
                    <p className="text-xs text-slate-500 font-mono">{complex.manager_phones[i]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {complex.documents.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Документы
            </h3>
            <div className="space-y-2">
              {complex.documents.map((doc) => (
                <a
                  key={doc.url}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FileText size={14} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">{DOC_TYPE_LABELS[doc.type]}</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                  </div>
                  <Download size={14} className="text-blue-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Properties in this complex */}
        {(properties as unknown[]).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Объекты в ЖК
            </h3>
            <div className="space-y-2">
              {(properties as Record<string, unknown>[]).map((p) => (
                <button
                  key={p.id as string}
                  onClick={() => handlePropertyClick(p.id as string)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all text-left group"
                >
                  <PropertyTypeIcon type={p.type as never} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {p.rooms ? `${p.rooms}-комн. ` : ''}
                        {PROPERTY_TYPE_LABELS[p.type as keyof typeof PROPERTY_TYPE_LABELS]}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${PROPERTY_STATUS_COLORS[p.status as keyof typeof PROPERTY_STATUS_COLORS]}`}>
                        {PROPERTY_STATUS_LABELS[p.status as keyof typeof PROPERTY_STATUS_LABELS]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{p.article as string}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatPriceShort(p.price as number)}
                    </p>
                    {p.area != null && (
                      <p className="text-xs text-slate-400">{p.area as number} м²</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
