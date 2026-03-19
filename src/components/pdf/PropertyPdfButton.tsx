import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import PropertyPdfDocument from './PropertyPdfDocument'
import type { PropertyWithOwner, AgentSettings } from '@/types'

interface Props {
  property: PropertyWithOwner
  agentSettings: AgentSettings
}

export default function PropertyPdfButton({ property, agentSettings }: Props) {
  const fileName = `${property.article}-${property.address.replace(/[^а-яa-z0-9]/gi, '_').slice(0, 30)}.pdf`

  return (
    <PDFDownloadLink
      document={<PropertyPdfDocument property={property} agentSettings={agentSettings} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Скачать PDF"
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        </button>
      )}
    </PDFDownloadLink>
  )
}
