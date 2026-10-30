import type { ActivationType, VATType } from '@/types'

export interface ActivationFormData {
  companyName: string
  postalAddress: string
  telephone: string
  contactPerson: string
  alternativeContact: string
  designation: string
  email: string
  mobileNo: string
  activationType: ActivationType
  startDate: string
  setupTime: string
  endDate: string
  tearDownTime: string
  description: string
  expectedVisitors: string
  soundSystem: boolean
  licenseFeePerDay: string
  numberOfDays: string
  proposedBudget: string
  vatType: VATType
  vat: string
  bankName: string
  bankBranch: string
  accountName: string
  accountNumber: string
  swiftCode: string
  paybillNumber: string
  mpesaAccount: string
  managerName: string
  managerDesignation: string
}

export interface ActivationVatDetails {
  baseAmount: number
  vatAmount: number
  totalAmount: number
}

export interface ActivationManualOverrides {
  numberOfDays: boolean
  proposedBudget: boolean
}

export type ActivationSectionId = 'company' | 'activation' | 'financial' | 'vat' | 'payment' | 'manager'

export type ActivationChangeHandler = (
  event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
) => void
