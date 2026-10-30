import type { ArrearsResponse, Property } from '@/types'
import type { PropertyFinancialTotals } from '../PropertyFinancialSummary'
import type { GroupedArrears, GroupedIncome } from '../types'

export function getPropertyFinancialTotals(property: Property | null): PropertyFinancialTotals {
  if (!property) {
    return { totalIncome: 0, totalCommissions: 0, pendingCommissions: 0, paidCommissions: 0 }
  }

  const commissions = property.commissions ?? []

  return {
    totalIncome: property.incomes?.reduce((total, income) => total + income.amount, 0) ?? 0,
    totalCommissions: commissions.reduce((total, commission) => total + commission.commissionAmount, 0),
    pendingCommissions: commissions
      .filter((commission) => commission.status === 'PENDING')
      .reduce((total, commission) => total + commission.commissionAmount, 0),
    paidCommissions: commissions
      .filter((commission) => commission.status === 'PAID')
      .reduce((total, commission) => total + commission.commissionAmount, 0),
  }
}

export function groupPropertyIncomeByTenant(property: Property): GroupedIncome[] {
  const grouped = (property.incomes ?? []).reduce<GroupedIncome[]>((groups, income) => {
    if (!income.tenantId) return groups

    const unit = property.units?.find((candidate) => candidate.tenant?.id === income.tenantId)
    const tenant = unit?.tenant
    if (!tenant) return groups

    const existingGroup = groups.find((group) => group.tenantId === income.tenantId)
    if (existingGroup) {
      existingGroup.incomes.push(income)
      existingGroup.totalAmount += income.amount
      return groups
    }

    groups.push({
      tenantId: income.tenantId,
      tenantName: tenant.fullName,
      tenantContact: tenant.contact || '',
      unitName: unit.type || 'Unit',
      totalAmount: income.amount,
      incomes: [income],
    })
    return groups
  }, [])

  return grouped.sort((left, right) => right.totalAmount - left.totalAmount)
}

export function groupPropertyArrearsByTenant(arrearsData: ArrearsResponse | null): GroupedArrears[] {
  const grouped = (arrearsData?.arrears ?? []).reduce<GroupedArrears[]>((groups, item) => {
    const existingGroup = groups.find((group) => group.tenantId === item.tenantId)
    if (existingGroup) {
      existingGroup.items.push(item)
      existingGroup.totalArrears += item.balance
      existingGroup.totalPaid += item.paidAmount
      return groups
    }

    groups.push({
      tenantId: item.tenantId,
      tenantName: item.tenantName,
      tenantContact: item.tenantContact,
      unitName: `${item.unitType} ${item.unitNo}`,
      totalArrears: item.balance,
      totalPaid: item.paidAmount,
      items: [item],
    })
    return groups
  }, [])

  return grouped.sort((left, right) => right.totalArrears - left.totalArrears)
}
