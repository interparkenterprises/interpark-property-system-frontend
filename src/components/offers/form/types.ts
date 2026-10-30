import type { Lead, LetterType, Property, Unit } from '@/types'

export type OfferFormSection = 'basic' | 'financial' | 'commercial' | 'lease' | 'additional'

export interface OfferFormData {
  leadId: string
  propertyId: string
  unitId: string
  letterType: LetterType | ''
  rentAmount: string
  deposit: string
  leaseTerm: string
  serviceCharge: string
  escalationRate: string
  expiryDate: string
  additionalTerms: string
  notes: string
  rentPerSqFt: string
  serviceChargePerSqFt: string
  useOfPremises: string
  fitOutPeriodMonths: string
  depositMonths: string
  advanceRentMonths: string
  escalationFrequency: 'ANNUALLY' | 'BI_ANNUALLY' | ''
}

export interface OfferSubmissionPayload {
  leadId: string
  propertyId: string
  letterType?: LetterType
  unitId?: string
  rentAmount?: number
  deposit?: number
  leaseTerm?: string
  serviceCharge?: number
  escalationRate?: number
  expiryDate?: string
  additionalTerms?: string
  notes?: string
  rentPerSqFt?: number
  serviceChargePerSqFt?: number
  useOfPremises?: string
  fitOutPeriodMonths?: number
  depositMonths?: number
  advanceRentMonths?: number
  escalationFrequency?: 'ANNUALLY' | 'BI_ANNUALLY'
}

export interface OfferSectionProps {
  formData: OfferFormData
  onFieldChange: (name: keyof OfferFormData, value: string) => void
}

export interface OfferBasicInformationProps extends OfferSectionProps {
  leads: Lead[]
  properties: Property[]
  units: Unit[]
  selectedProperty: Property | null
  selectedUnit: Unit | null
  isMixedUse: boolean
  optionsLoading: boolean
  unitsLoading: boolean
  isManagedUser: boolean
}

export const emptyOfferFormData = (): OfferFormData => ({
  leadId: '',
  propertyId: '',
  unitId: '',
  letterType: '',
  rentAmount: '',
  deposit: '',
  leaseTerm: '',
  serviceCharge: '',
  escalationRate: '',
  expiryDate: '',
  additionalTerms: '',
  notes: '',
  rentPerSqFt: '',
  serviceChargePerSqFt: '',
  useOfPremises: '',
  fitOutPeriodMonths: '',
  depositMonths: '',
  advanceRentMonths: '',
  escalationFrequency: '',
})
