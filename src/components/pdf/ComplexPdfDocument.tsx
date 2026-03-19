import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import '@/utils/pdfFonts'
import type { Complex, AgentSettings } from '@/types'
import type { PropertyWithOwner } from '@/types'
import { PROPERTY_TYPE_LABELS } from '@/types'
import { formatPriceShort } from '@/utils/format'

interface Props {
  complex: Complex
  properties: PropertyWithOwner[]
  agentSettings: AgentSettings
}

const s = StyleSheet.create({
  page: { fontFamily: 'Roboto', padding: 40, backgroundColor: '#ffffff', fontSize: 10 },
  cover: { marginBottom: 24 },
  bigTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  developer: { fontSize: 11, color: '#64748b', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 9, color: '#1d4ed8', fontWeight: 'bold' },
  mainPhoto: { width: '100%', height: 200, borderRadius: 10, objectFit: 'cover', marginBottom: 4 },
  thumbRow: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  thumb: { flex: 1, height: 60, borderRadius: 6, objectFit: 'cover' },
  sectionTitle: { fontSize: 8, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  bodyText: { fontSize: 10, color: '#334155', lineHeight: 1.6 },
  condBox: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12 },
  condText: { fontSize: 10, color: '#166534', lineHeight: 1.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, width: '22%' },
  cellLabel: { fontSize: 8, color: '#94a3b8', marginBottom: 2 },
  cellValue: { fontSize: 9, color: '#1e293b', fontWeight: 'bold' },
  contactRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  contactCard: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, minWidth: 120 },
  contactName: { fontSize: 9, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  contactPhone: { fontSize: 9, color: '#3b82f6' },
  propRow: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#f8fafc', borderRadius: 6, marginBottom: 4 },
  propTitle: { flex: 1, fontSize: 9, color: '#1e293b', fontWeight: 'bold' },
  propPrice: { fontSize: 9, color: '#1d4ed8', fontWeight: 'bold' },
  propArea: { fontSize: 8, color: '#94a3b8', marginLeft: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginVertical: 14 },
  agentBlock: { backgroundColor: '#1e293b', borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center' },
  agentName: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  agentAgency: { fontSize: 9, color: '#94a3b8', marginBottom: 4 },
  agentContact: { fontSize: 9, color: '#cbd5e1', marginBottom: 2 },
  socialText: { fontSize: 9, color: '#60a5fa', marginRight: 8 },
})

export default function ComplexPdfDocument({ complex, properties, agentSettings }: Props) {
  const charEntries = Object.entries(complex.characteristics ?? {})
  const activeProps = properties.filter((p) => p.status === 'active')

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Cover */}
        <View style={s.cover}>
          <Text style={s.bigTitle}>{complex.name}</Text>
          {complex.developer && <Text style={s.developer}>{complex.developer}</Text>}
          <View style={s.badgeRow}>
            {complex.completion_date && (
              <View style={s.badge}>
                <Text style={s.badgeText}>Сдача: {complex.completion_date}</Text>
              </View>
            )}
            {activeProps.length > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{activeProps.length} активных объектов</Text>
              </View>
            )}
          </View>

          {/* Photos */}
          {complex.photos.length > 0 && (
            <Image src={complex.photos[0]} style={s.mainPhoto} />
          )}
          {complex.photos.length > 1 && (
            <View style={s.thumbRow}>
              {complex.photos.slice(1, 4).map((url) => (
                <Image key={url} src={url} style={s.thumb} />
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        {complex.description && (
          <>
            <Text style={s.sectionTitle}>О комплексе</Text>
            <Text style={s.bodyText}>{complex.description}</Text>
          </>
        )}

        {/* Purchase conditions */}
        {complex.purchase_conditions && (
          <>
            <Text style={s.sectionTitle}>Условия покупки</Text>
            <View style={s.condBox}>
              <Text style={s.condText}>{complex.purchase_conditions}</Text>
            </View>
          </>
        )}

        {/* Characteristics */}
        {charEntries.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Характеристики</Text>
            <View style={s.grid}>
              {charEntries.map(([key, value]) => (
                <View key={key} style={s.cell}>
                  <Text style={s.cellLabel}>{key}</Text>
                  <Text style={s.cellValue}>{value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Contacts */}
        {(complex.developer_phones.length > 0 || complex.manager_names.length > 0) && (
          <>
            <Text style={s.sectionTitle}>Контакты</Text>
            <View style={s.contactRow}>
              {complex.developer_phones.map((phone, i) => (
                <View key={i} style={s.contactCard}>
                  <Text style={s.contactName}>Застройщик</Text>
                  <Text style={s.contactPhone}>{phone}</Text>
                </View>
              ))}
              {complex.manager_names.map((name, i) => (
                <View key={i} style={s.contactCard}>
                  <Text style={s.contactName}>{name}</Text>
                  <Text style={s.contactPhone}>{complex.manager_phones[i] ?? ''}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Properties list */}
        {activeProps.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Доступные объекты</Text>
            {activeProps.slice(0, 10).map((p) => (
              <View key={p.id} style={s.propRow}>
                <Text style={s.propTitle}>
                  {p.rooms ? `${p.rooms}-комн. ` : ''}
                  {PROPERTY_TYPE_LABELS[p.type]}
                  {p.floor && p.total_floors ? `, ${p.floor}/${p.total_floors} эт.` : ''}
                </Text>
                <Text style={s.propArea}>{p.area} м²</Text>
                <Text style={s.propPrice}>{formatPriceShort(p.price)}</Text>
              </View>
            ))}
            {activeProps.length > 10 && (
              <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
                + ещё {activeProps.length - 10} объектов
              </Text>
            )}
          </>
        )}

        <View style={s.divider} />

        {/* Agent */}
        <View style={s.agentBlock}>
          <View style={{ flex: 1 }}>
            <Text style={s.agentName}>{agentSettings.name ?? 'Риэлтор'}</Text>
            {agentSettings.agency_name && <Text style={s.agentAgency}>{agentSettings.agency_name}</Text>}
            {agentSettings.phone && <Text style={s.agentContact}>📞 {agentSettings.phone}</Text>}
            {agentSettings.email && <Text style={s.agentContact}>✉️ {agentSettings.email}</Text>}
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
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
