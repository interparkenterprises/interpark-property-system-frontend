import type { PaymentPolicy } from '@/types'

export interface BillingPeriodOption {
  value: string
  label: string
  startDate: string
  endDate: string
}

const pad = (value: number) => String(value).padStart(2, '0')
const toDateOnly = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const parseDateOnly = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function buildBillingPeriods(policy: PaymentPolicy, rentStart: string, count = 12): BillingPeriodOption[] {
  const anchor = parseDateOnly(rentStart)
  const months = policy === 'ANNUAL' ? 12 : policy === 'QUARTERLY' ? 3 : 1
  const formatter = new Intl.DateTimeFormat('en-KE', { month: 'short', year: 'numeric' })

  return Array.from({ length: count }, (_, index) => {
    const start = new Date(anchor)
    start.setMonth(anchor.getMonth() + index * months)
    const end = new Date(start)
    end.setMonth(start.getMonth() + months)
    end.setDate(end.getDate() - 1)
    const startDate = toDateOnly(start)
    const endDate = toDateOnly(end)
    return {
      value: startDate,
      startDate,
      endDate,
      label: months === 1 ? formatter.format(start) : `${formatter.format(start)} – ${formatter.format(end)}`,
    }
  })
}

export function normalizePaymentPeriod(value: string, policy: PaymentPolicy, rentStart: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`

  const options = buildBillingPeriods(policy, rentStart, 60)
  const exact = options.find((option) => option.value === value)
  if (exact) return exact.startDate

  const quarter = value.match(/^(\d{4})-Q(\d+)$/)
  if (quarter) {
    const year = Number(quarter[1])
    const quarterNumber = Number(quarter[2])
    const candidate = options.find((option) => {
      const date = parseDateOnly(option.startDate)
      return date.getFullYear() === year && Math.floor(date.getMonth() / 3) + 1 === quarterNumber
    })
    if (candidate) return candidate.startDate
  }

  if (/^\d{4}$/.test(value)) {
    const candidate = options.find((option) => parseDateOnly(option.startDate).getFullYear() === Number(value))
    if (candidate) return candidate.startDate
  }

  throw new Error('Select a valid billing period')
}
