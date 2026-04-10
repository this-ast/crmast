export interface PaymentCalcResult {
  total: number
  downPayment: number
  remainder: number
  monthlyPayment: number
  termMonths: number
}

export function calcInstallment(
  total: number,
  months: number,
  downPaymentPct: number,
): PaymentCalcResult {
  const downPayment = Math.round(total * (downPaymentPct / 100))
  const remainder = total - downPayment
  const monthly = months > 0 ? Math.round(remainder / months) : 0
  return { total, downPayment, remainder, monthlyPayment: monthly, termMonths: months }
}

export function calcMortgage(
  total: number,
  ratePct: number,
  years: number,
  downPaymentPct: number,
): PaymentCalcResult {
  const downPayment = Math.round(total * (downPaymentPct / 100))
  const L = total - downPayment
  const n = years * 12
  const i = ratePct / 12 / 100
  let monthly = 0
  if (n > 0) {
    if (i === 0) {
      monthly = Math.round(L / n)
    } else {
      monthly = Math.round(L * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1))
    }
  }
  return { total, downPayment, remainder: L, monthlyPayment: monthly, termMonths: n }
}
