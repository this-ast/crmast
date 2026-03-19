import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import '@/utils/pdfFonts'
import type { PropertyWithOwner, AgentSettings } from '@/types'
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from '@/types'

interface Props {
  property: PropertyWithOwner
  agentSettings: AgentSettings
}

const s = StyleSheet.create({
  page: { fontFamily: 'Roboto', padding: 40, backgroundColor: '#ffffff', fontSize: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  titleBlock: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b' },
  article: { fontSize: 9, color: '#94a3b8', fontFamily: 'Roboto', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 9, fontWeight: 'bold' },
  priceBlock: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 14, marginBottom: 16 },
  priceLabel: { fontSize: 9, color: '#3b82f6', marginBottom: 3 },
  price: { fontSize: 22, fontWeight: 'bold', color: '#1d4ed8' },
  sectionTitle: { fontSize: 8, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, width: '30%' },
  cellLabel: { fontSize: 8, color: '#94a3b8', marginBottom: 2 },
  cellValue: { fontSize: 9, color: '#1e293b', fontWeight: 'bold' },
  descText: { fontSize: 10, color: '#334155', lineHeight: 1.6 },
  conditionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  condBadge: { backgroundColor: '#f1f5f9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  condText: { fontSize: 8, color: '#475569' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginVertical: 14 },
  agentBlock: { marginTop: 'auto', backgroundColor: '#1e293b', borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center' },
  agentName: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  agentAgency: { fontSize: 9, color: '#94a3b8', marginBottom: 6 },
  agentContact: { fontSize: 9, color: '#cbd5e1', marginBottom: 2 },
  agentSocial: { flexDirection: 'row', gap: 10, marginTop: 4 },
  socialText: { fontSize: 9, color: '#60a5fa' },
})

function statusColor(status: string) {
  const map: Record<string, string> = {
    active: '#d1fae5',
    sold: '#f1f5f9',
    reserved: '#fef9c3',
    withdrawn: '#fee2e2',
  }
  return map[status] ?? '#f1f5f9'
}

function statusTextColor(status: string) {
  const map: Record<string, string> = {
    active: '#065f46',
    sold: '#475569',
    reserved: '#92400e',
    withdrawn: '#991b1b',
  }
  return map[status] ?? '#475569'
}

export default function PropertyPdfDocument({ property, agentSettings }: Props) {
  const p = property
  const conditions = [
    p.has_mortgage && '🏦 Ипотека',
    p.has_installment && '📅 Рассрочка',
    p.has_trade_in && '🔄 Трейд-ин',
    p.has_maternal_cap && '👶 Маткапитал',
    p.has_military_mort && '🎖 Воен. ипотека',
  ].filter(Boolean) as string[]

  const typeLabel = p.rooms
    ? `${p.rooms}-комн. ${PROPERTY_TYPE_LABELS[p.type]}`
    : PROPERTY_TYPE_LABELS[p.type]

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.titleBlock}>
            <Text style={s.title}>{typeLabel}</Text>
            {p.complex_name && <Text style={s.subtitle}>ЖК {p.complex_name}</Text>}
            <Text style={s.subtitle}>{p.address}</Text>
            <Text style={s.article}>{p.article}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: statusColor(p.status) }]}>
            <Text style={[s.badgeText, { color: statusTextColor(p.status) }]}>
              {PROPERTY_STATUS_LABELS[p.status]}
            </Text>
          </View>
        </View>

        {/* Price */}
        <View style={s.priceBlock}>
          <Text style={s.priceLabel}>{p.deal_type === 'rent' ? 'Аренда в месяц' : 'Стоимость'}</Text>
          <Text style={s.price}>{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(p.price)}</Text>
        </View>

        {/* Main characteristics */}
        <Text style={s.sectionTitle}>Характеристики</Text>
        <View style={s.grid}>
          <View style={s.cell}>
            <Text style={s.cellLabel}>Площадь</Text>
            <Text style={s.cellValue}>{p.area} м²</Text>
          </View>
          {p.rooms && (
            <View style={s.cell}>
              <Text style={s.cellLabel}>Комнат</Text>
              <Text style={s.cellValue}>{p.rooms}</Text>
            </View>
          )}
          {p.floor && p.total_floors && (
            <View style={s.cell}>
              <Text style={s.cellLabel}>Этаж</Text>
              <Text style={s.cellValue}>{p.floor} из {p.total_floors}</Text>
            </View>
          )}
          {p.area_sotki && (
            <View style={s.cell}>
              <Text style={s.cellLabel}>Участок</Text>
              <Text style={s.cellValue}>{p.area_sotki} сот.</Text>
            </View>
          )}
          {p.market_type && (
            <View style={s.cell}>
              <Text style={s.cellLabel}>Рынок</Text>
              <Text style={s.cellValue}>{p.market_type === 'secondary' ? 'Вторичка' : 'Новострой'}</Text>
            </View>
          )}
          {p.view && (
            <View style={s.cell}>
              <Text style={s.cellLabel}>Вид из окон</Text>
              <Text style={s.cellValue}>{p.view}</Text>
            </View>
          )}
        </View>

        {/* Deal conditions */}
        {conditions.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Условия сделки</Text>
            <View style={s.conditionRow}>
              {conditions.map((c) => (
                <View key={c} style={s.condBadge}>
                  <Text style={s.condText}>{c}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Description */}
        {p.description && (
          <>
            <Text style={s.sectionTitle}>Описание</Text>
            <Text style={s.descText}>{p.description}</Text>
          </>
        )}

        <View style={s.divider} />

        {/* Agent block */}
        <View style={s.agentBlock}>
          <View style={{ flex: 1 }}>
            <Text style={s.agentName}>{agentSettings.name ?? 'Риэлтор'}</Text>
            {agentSettings.agency_name && <Text style={s.agentAgency}>{agentSettings.agency_name}</Text>}
            {agentSettings.phone && <Text style={s.agentContact}>📞 {agentSettings.phone}</Text>}
            {agentSettings.email && <Text style={s.agentContact}>✉️ {agentSettings.email}</Text>}
            <View style={s.agentSocial}>
              {agentSettings.instagram && <Text style={s.socialText}>@{agentSettings.instagram}</Text>}
              {agentSettings.telegram && <Text style={s.socialText}>tg: {agentSettings.telegram}</Text>}
              {agentSettings.whatsapp && <Text style={s.socialText}>wa: {agentSettings.whatsapp}</Text>}
            </View>
          </View>
          {agentSettings.logo_url && (
            <Image src={agentSettings.logo_url} style={{ width: 50, height: 50, borderRadius: 8 }} />
          )}
        </View>
      </Page>
    </Document>
  )
}
