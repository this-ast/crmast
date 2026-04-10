import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import UnitPdfDocument from './UnitPdfDocument'
import type { ComplexUnit, Complex, AgentSettings } from '@/types'

interface Props {
  unit: ComplexUnit & { complex_name?: string; complex_photos?: string[] }
  complex?: Complex
  agentSettings: AgentSettings
  className?: string
}

export default function UnitPdfButton({ unit, complex, agentSettings, className }: Props) {
  const label = unit.title || (unit.rooms ? `${unit.rooms}-комн` : 'объект')
  const cxName = unit.complex_name ?? complex?.name ?? 'ЖК'
  const fileName = `${cxName}-${label}.pdf`.replace(/[^а-яёa-z0-9\-\.]/gi, '_')

  return (
    <PDFDownloadLink
      document={<UnitPdfDocument unit={unit} complex={complex} agentSettings={agentSettings} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          className={className ?? 'p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors'}
          title="Скачать PDF-презентацию"
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        </button>
      )}
    </PDFDownloadLink>
  )
}
