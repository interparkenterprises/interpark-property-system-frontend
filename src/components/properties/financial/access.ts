import { PermissionCode } from '@/types'

export const propertyFinancialPermissions = [
  PermissionCode.VIEW_TENANT_FINANCIALS,
  PermissionCode.VIEW_PAYMENT_REPORTS,
  PermissionCode.VIEW_COMMISSIONS,
  PermissionCode.VIEW_ARREARS,
  PermissionCode.VIEW_OVERDUE_INVOICES,
  PermissionCode.PREVIEW_PAYMENTS,
  PermissionCode.VIEW_BILL_INVOICES,
] as const

export const propertyTenantDetailsPermissions = [
  PermissionCode.VIEW_TENANT_FINANCIALS,
  PermissionCode.VIEW_INVOICES,
  PermissionCode.VIEW_PAYMENT_REPORTS,
  PermissionCode.VIEW_BILL_INVOICES,
  PermissionCode.VIEW_DEMAND_LETTERS,
  PermissionCode.VIEW_OVERDUE_INVOICES,
  PermissionCode.RECORD_PAYMENTS,
  PermissionCode.CREATE_INVOICES,
  PermissionCode.CREATE_BILL_INVOICE,
  PermissionCode.DOWNLOAD_INVOICES,
  PermissionCode.CREATE_DEMAND_LETTER,
  PermissionCode.SEND_DEMAND_LETTERS,
  PermissionCode.AUTO_GENERATE_DEMAND_LETTER,
  PermissionCode.DOWNLOAD_DEMAND_LETTER,
] as const

export function canAccessPropertyFinancialWorkspace(
  isAdmin: boolean,
  isManager: boolean,
  hasPermission: (permission: PermissionCode) => boolean,
) {
  return isAdmin || isManager || propertyFinancialPermissions.some((permission) => hasPermission(permission))
}
