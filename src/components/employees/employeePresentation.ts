import type { EmployeeStatus } from '@/types'

const currencyFormatter = new Intl.NumberFormat('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

export function formatEmployeeCurrency(amount: number) {
  return `KES ${currencyFormatter.format(amount)}`
}

export function employeeStatusAppearance(status: EmployeeStatus) {
  switch (status) {
    case 'ACTIVE': return 'success' as const
    case 'ON_LEAVE': return 'warning' as const
    case 'TERMINATED': return 'destructive' as const
    default: return 'neutral' as const
  }
}

export function paymentStatusAppearance(status?: string) {
  return status === 'PAID' ? 'success' as const : 'warning' as const
}

