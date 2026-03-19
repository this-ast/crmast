import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import ComplexPdfDocument from './ComplexPdfDocument'
import type { Complex, AgentSettings, PropertyWithOwner } from '@/types'

interface Props {
  complex: Complex
  properties: PropertyWithOwner[]
  agentSettings: AgentSettings
}

export default function ComplexPdfButton({ complex, properties, agentSettings }: Props) {
  const fileName = `ЖК-${complex.name.replace(/[^а-яa-z0-9]/gi, '_').slice(0, 40)}.pdf`

  return (
    <PDFDownloadLink
      document={<ComplexPdfDocument complex={complex} properties={properties} agentSettings={agentSettings} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60"
          title="Скачать PDF презентацию ЖК"
          disabled={loading}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
          {loading ? 'Генерация...' : 'PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
