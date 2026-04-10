import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import '@/utils/pdfFonts'
import type { ComplexUnit, Complex, AgentSettings } from '@/types'
import { calcInstallment, calcMortgage } from '@/utils/unitCalc'

interface Props {
  unit: ComplexUnit & { complex_name?: string; complex_photos?: string[] }
  complex?: Complex
  agentSettings: AgentSettings
}

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n))

const s = StyleSheet.create({
  page: { fontFamily: 'Roboto', padding: 40, backgroundColor: '#ffffff', fontSize: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#64748b', marginBottom: 10 },
  payBadgeRow: { flexDirection: 'row', marginBottom: 14 },
  payBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  payBadgeText: { fontSize: 9, color: '#1d4ed8', fontWeight: 'bold' },
  mainPhoto: { width: '100%', height: 190, borderRadius: 10, objectFit: 'cover', marginBottom: 16 },
  thumbRow: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  thumb: { flex: 1, height: 60, borderRadius: 6, objectFit: 'cover' },
  sectionTitle: { fontSize: 8, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 10, width: '22%' },
  cellLabel: { fontSize: 8, color: '#94a3b8', marginBottom: 2 },
  cellValue: { fontSize: 10, color: '#1e293b', fontWeight: 'bold' },
  calcBox: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 14, marginTop: 4 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  calcLabel: { fontSize: 10, color: '#334155' },
  calcValue: { fontSize: 10, color: '#1e293b', fontWeight: 'bold' },
  calcDivider: { borderBottomWidth: 1, borderBottomColor: '#bbf7d0', marginVertical: 8 },
  calcTotalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calcTotalLabel: { fontSize: 11, color: '#166534', fontWeight: 'bold' },
  calcTotalValue: { fontSize: 15, color: '#166534', fontWeight: 'bold' },
  notesBox: { backgroundColor: '#fffbeb', borderRadius: 6, padding: 10, marginTop: 14 },
  notesText: { fontSize: 10, color: '#78350f', lineHeight: 1.5 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginVertical: 16 },
  agentBlock: { backgroundColor: '#1e293b', borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center' },
  agentName: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  agentAgency: { fontSize: 9, color: '#94a3b8', marginBottom: 4 },
  agentContact: { fontSize: 9, color: '#cbd5e1', marginBottom: 2 },
  socialText: { fontSize: 9, color: '#60a5fa', marginRight: 8 },
})

function getPaymentLabel(unit: ComplexUnit, complex?: Complex): string {
  if (!unit.payment_type) return ''
  if (unit.payment_type === 'cash') return 'Наличный расчёт'
  if (unit.payment_type === 'mortgage') return 'Ипотека'
  const cond = complex?.pricing_conditions?.find((c) => c.id === unit.payment_type)
  if (cond) {
    if (cond.payment_type === 'installment' && cond.installment_months) {
      const months = cond.installment_months
      const label = months % 12 === 0 ? `${months / 12} лет` : `${months} мес.`
      return `Рассрочка ${label}`
    }
    return cond.label
  }
  return ''
}

export default function UnitPdfDocument({ unit, complex, agentSettings }: Props) {
  const label = unit.title || (unit.rooms ? `${unit.rooms}-комн. квартира` : 'Объект')
  const total = unit.price_per_m2 && unit.area
    ? unit.price_per_m2 * unit.area
    : unit.price
  const cond = complex?.pricing_conditions?.find((c) => c.id === unit.payment_type)
  const photos = unit.photos?.length ? unit.photos : (unit.complex_photos ?? [])
  const paymentLabel = getPaymentLabel(unit, complex)

  let calcResult = null
  if (total && unit.payment_type) {
    if (cond?.payment_type === 'installment' && cond.installment_months != null && cond.installment_down_payment_pct != null) {
      calcResult = calcInstallment(total, cond.installment_months, cond.installment_down_payment_pct)
    } else if (unit.payment_type === 'mortgage' && unit.mortgage_rate && unit.mortgage_years && unit.mortgage_down_payment_pct != null) {
      calcResult = calcMortgage(total, unit.mortgage_rate, unit.mortgage_years, unit.mortgage_down_payment_pct)
    }
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <Text style={s.title}>{label}</Text>
        {unit.complex_name && <Text style={s.subtitle}>{unit.complex_name}</Text>}

        {paymentLabel ? (
          <View style={s.payBadgeRow}>
            <View style={s.payBadge}>
              <Text style={s.payBadgeText}>{paymentLabel}</Text>
            </View>
          </View>
        ) : null}

        {/* Photos */}
        {photos.length > 0 && <Image src={photos[0]} style={s.mainPhoto} />}
        {photos.length > 1 && (
          <View style={s.thumbRow}>
            {photos.slice(1, 4).map((url) => (
              <Image key={url} src={url} style={s.thumb} />
            ))}
          </View>
        )}

        {/* Characteristics */}
        <Text style={s.sectionTitle}>Характеристики</Text>
        <View style={s.grid}>
          {unit.area != null && (
            <View style={s.cell}>
              <Text style={s.cellLabel}>Площадь</Text>
              <Text style={s.cellValue}>{unit.area} м²</Text>
            </View>
          )}
          {unit.rooms != null && (
            <View style={s.cell}>
              <Text style={s.cellLabel}>Комнат</Text>
              <Text style={s.cellValue}>{unit.rooms}</Text>
            </View>
          )}
          {unit.floor != null && (
            <View style={s.cell}>
              <Text style={s.cellLabel}>Этаж</Text>
              <Text style={s.cellValue}>
                {unit.floor_to && unit.floor_to > unit.floor
                  ? `${unit.floor}–${unit.floor_to}`
                  : String(unit.floor)}
                {unit.total_floors ? `/${unit.total_floors}` : ''}
              </Text>
            </View>
          )}
          {unit.price_per_m2 != null && (
            <View style={s.cell}>
              <Text style={s.cellLabel}>Цена за м²</Text>
              <Text style={s.cellValue}>{fmt(unit.price_per_m2)} ₽</Text>
            </View>
          )}
        </View>

        {/* Price calculation */}
        {total != null && (
          <>
            <Text style={s.sectionTitle}>Расчёт стоимости</Text>
            <View style={s.calcBox}>
              <View style={s.calcRow}>
                <Text style={s.calcLabel}>Общая стоимость</Text>
                <Text style={s.calcValue}>{fmt(total)} ₽</Text>
              </View>
              {calcResult && (
                <>
                  <View style={s.calcRow}>
                    <Text style={s.calcLabel}>Первоначальный взнос</Text>
                    <Text style={s.calcValue}>{fmt(calcResult.downPayment)} ₽</Text>
                  </View>
                  <View style={s.calcRow}>
                    <Text style={s.calcLabel}>
                      {unit.payment_type === 'mortgage' ? 'Сумма кредита' : 'Остаток'}
                    </Text>
                    <Text style={s.calcValue}>{fmt(calcResult.remainder)} ₽</Text>
                  </View>
                  <View style={s.calcRow}>
                    <Text style={s.calcLabel}>Срок</Text>
                    <Text style={s.calcValue}>{calcResult.termMonths} мес.</Text>
                  </View>
                  <View style={s.calcDivider} />
                  <View style={s.calcTotalRow}>
                    <Text style={s.calcTotalLabel}>Ежемесячный платёж</Text>
                    <Text style={s.calcTotalValue}>{fmt(calcResult.monthlyPayment)} ₽/мес.</Text>
                  </View>
                </>
              )}
            </View>
          </>
        )}

        {unit.notes ? (
          <View style={s.notesBox}>
            <Text style={s.notesText}>{unit.notes}</Text>
          </View>
        ) : null}

        <View style={s.divider} />

        {/* Agent */}
        <View style={s.agentBlock}>
          <View style={{ flex: 1 }}>
            <Text style={s.agentName}>{agentSettings.name ?? 'Риэлтор'}</Text>
            {agentSettings.agency_name ? <Text style={s.agentAgency}>{agentSettings.agency_name}</Text> : null}
            {agentSettings.phone ? <Text style={s.agentContact}>📞 {agentSettings.phone}</Text> : null}
            {agentSettings.email ? <Text style={s.agentContact}>✉️ {agentSettings.email}</Text> : null}
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              {agentSettings.instagram ? <Text style={s.socialText}>@{agentSettings.instagram}</Text> : null}
              {agentSettings.telegram ? <Text style={s.socialText}>tg: {agentSettings.telegram}</Text> : null}
              {agentSettings.whatsapp ? <Text style={s.socialText}>wa: {agentSettings.whatsapp}</Text> : null}
            </View>
          </View>
          {agentSettings.logo_url ? (
            <Image src={agentSettings.logo_url} style={{ width: 50, height: 50, borderRadius: 8 }} />
          ) : null}
        </View>
      </Page>
    </Document>
  )
}
