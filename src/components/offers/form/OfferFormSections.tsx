'use client'

import { Badge } from '@/components/ui/badge'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { OfferBasicInformationProps, OfferSectionProps } from './types'

export function OfferBasicInformation({
  formData,
  onFieldChange,
  leads,
  properties,
  units,
  selectedProperty,
  selectedUnit,
  isMixedUse,
  optionsLoading,
  unitsLoading,
  isManagedUser,
}: OfferBasicInformationProps) {
  const unitPlaceholder = !formData.propertyId
    ? 'Select a property first'
    : unitsLoading
      ? 'Loading vacant units...'
      : units.length === 0
        ? 'No vacant units available'
        : 'Select a unit'

  return (
    <FormSection title="Basic information" description="Choose the lead, property, unit, and applicable letter type.">
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Lead" htmlFor="offer-lead" required description={isManagedUser && leads.length === 0 ? 'No eligible leads are available for your assigned properties.' : undefined}>
          <Select value={formData.leadId} onValueChange={(value) => onFieldChange('leadId', value)} required>
            <SelectTrigger id="offer-lead" disabled={optionsLoading}><SelectValue placeholder={optionsLoading ? 'Loading leads...' : 'Select a lead'} /></SelectTrigger>
            <SelectContent>
              {leads.map((lead) => <SelectItem key={lead.id} value={lead.id}>{lead.name} · {lead.phone}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Property" htmlFor="offer-property" required description={selectedProperty ? formatUsage(selectedProperty.usage) : isManagedUser && properties.length === 0 ? 'No accessible properties are available.' : undefined}>
          <Select value={formData.propertyId} onValueChange={(value) => onFieldChange('propertyId', value)} required>
            <SelectTrigger id="offer-property" disabled={optionsLoading}><SelectValue placeholder={optionsLoading ? 'Loading properties...' : 'Select a property'} /></SelectTrigger>
            <SelectContent>
              {properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name} · {property.address}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Unit" htmlFor="offer-unit" optional description={formData.propertyId && !unitsLoading ? `${units.length} vacant unit${units.length === 1 ? '' : 's'} available.` : undefined}>
          <Select value={formData.unitId || undefined} onValueChange={(value) => onFieldChange('unitId', value)}>
            <SelectTrigger id="offer-unit" disabled={!formData.propertyId || unitsLoading || units.length === 0}><SelectValue placeholder={unitPlaceholder} /></SelectTrigger>
            <SelectContent>
              {units.map((unit) => <SelectItem key={unit.id} value={unit.id}>Unit {unit.unitNo} · {unit.sizeSqFt} sq ft · KES {unit.rentAmount.toLocaleString()}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>

        {isMixedUse && (
          <FormField label="Letter type" htmlFor="offer-letter-type" required>
            <Select value={formData.letterType} onValueChange={(value) => onFieldChange('letterType', value)} required>
              <SelectTrigger id="offer-letter-type"><SelectValue placeholder="Select letter type" /></SelectTrigger>
              <SelectContent><SelectItem value="COMMERCIAL">Commercial</SelectItem><SelectItem value="RESIDENTIAL">Residential</SelectItem></SelectContent>
            </Select>
          </FormField>
        )}
      </div>

      {selectedUnit && (
        <div className="mt-5 rounded-lg border border-border bg-muted/25 px-4 py-2">
          <DetailList className="grid divide-y-0 sm:grid-cols-2 sm:gap-x-6 xl:grid-cols-4">
            <DetailItem label="Unit">{selectedUnit.unitNo || 'N/A'}</DetailItem>
            <DetailItem label="Size">{selectedUnit.sizeSqFt} sq ft</DetailItem>
            <DetailItem label="Type"><Badge variant="neutral">{selectedUnit.unitType}</Badge></DetailItem>
            <DetailItem label="Status"><Badge variant="success">{selectedUnit.status}</Badge></DetailItem>
          </DetailList>
          {selectedUnit.calculationInfo?.formula && <p className="pb-2 text-xs text-muted-foreground">Formula: {selectedUnit.calculationInfo.formula}</p>}
          {selectedUnit.calculationInfo?.ratePerSqFt && <p className="pb-2 text-xs text-muted-foreground">Rate: KES {selectedUnit.calculationInfo.ratePerSqFt}/sq ft</p>}
        </div>
      )}
    </FormSection>
  )
}

export function OfferFinancialTerms({ formData, onFieldChange, selectedUnit }: OfferSectionProps & { selectedUnit: OfferBasicInformationProps['selectedUnit'] }) {
  return (
    <FormSection title="Financial terms" description="Enter the exact rent, deposit, and service charge values for the offer.">
      <div className="grid gap-5 md:grid-cols-3">
        <Input label="Rent Amount (KES)" name="rentAmount" type="number" min="0" step="0.01" value={formData.rentAmount} onChange={(event) => onFieldChange('rentAmount', event.target.value)} helperText={selectedUnit ? `Based on unit: KES ${selectedUnit.rentAmount.toLocaleString()}` : undefined} required />
        <Input label="Deposit (KES)" name="deposit" type="number" min="0" step="0.01" value={formData.deposit} onChange={(event) => onFieldChange('deposit', event.target.value)} helperText={selectedUnit ? `Suggested: KES ${(selectedUnit.rentAmount * 2).toLocaleString()} (2 months rent)` : undefined} required />
        <Input label="Service Charge (KES)" name="serviceCharge" type="number" min="0" step="0.01" value={formData.serviceCharge} onChange={(event) => onFieldChange('serviceCharge', event.target.value)} />
      </div>
    </FormSection>
  )
}

export function OfferCommercialTerms({ formData, onFieldChange, selectedUnit }: OfferSectionProps & { selectedUnit: OfferBasicInformationProps['selectedUnit'] }) {
  return (
    <FormSection title="Commercial terms" description="Record the existing commercial pricing and occupancy conditions.">
      <div className="grid gap-5 md:grid-cols-3">
        <Input label="Rent per Sq Ft (KES)" name="rentPerSqFt" type="number" min="0" step="0.01" value={formData.rentPerSqFt} onChange={(event) => onFieldChange('rentPerSqFt', event.target.value)} helperText={selectedUnit?.rentType === 'PER_SQFT' && selectedUnit.calculationInfo?.ratePerSqFt ? `Unit rate: KES ${selectedUnit.calculationInfo.ratePerSqFt}/sq ft` : undefined} />
        <Input label="Service Charge per Sq Ft (KES)" name="serviceChargePerSqFt" type="number" min="0" step="0.01" value={formData.serviceChargePerSqFt} onChange={(event) => onFieldChange('serviceChargePerSqFt', event.target.value)} />
        <Input label="Fit-Out Period (Months)" name="fitOutPeriodMonths" type="number" min="0" step="1" value={formData.fitOutPeriodMonths} onChange={(event) => onFieldChange('fitOutPeriodMonths', event.target.value)} />
        <div className="md:col-span-3"><Input label="Use of Premises" name="useOfPremises" value={formData.useOfPremises} onChange={(event) => onFieldChange('useOfPremises', event.target.value)} helperText={selectedUnit?.usage ? `Unit usage: ${selectedUnit.usage}` : undefined} /></div>
        <Input label="Deposit (Months)" name="depositMonths" type="number" min="0" step="1" value={formData.depositMonths} onChange={(event) => onFieldChange('depositMonths', event.target.value)} />
        <Input label="Advance Rent (Months)" name="advanceRentMonths" type="number" min="0" step="1" value={formData.advanceRentMonths} onChange={(event) => onFieldChange('advanceRentMonths', event.target.value)} />
      </div>
    </FormSection>
  )
}

export function OfferLeaseTerms({ formData, onFieldChange, showResidentialFrequency }: OfferSectionProps & { showResidentialFrequency: boolean }) {
  return (
    <FormSection title="Lease terms" description="Set the lease duration, escalation terms, and offer expiry date.">
      <div className="grid gap-5 md:grid-cols-3">
        <Input label="Lease Term" name="leaseTerm" value={formData.leaseTerm} onChange={(event) => onFieldChange('leaseTerm', event.target.value)} placeholder="12 months, 2 years, etc." required />
        <Input label="Escalation Rate (%)" name="escalationRate" type="number" min="0" step="0.01" value={formData.escalationRate} onChange={(event) => onFieldChange('escalationRate', event.target.value)} />
        {showResidentialFrequency && (
          <FormField label="Escalation Frequency" htmlFor="offer-escalation-frequency" optional>
            <Select value={formData.escalationFrequency || undefined} onValueChange={(value) => onFieldChange('escalationFrequency', value)}>
              <SelectTrigger id="offer-escalation-frequency"><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent><SelectItem value="ANNUALLY">Annually</SelectItem><SelectItem value="BI_ANNUALLY">Bi-Annually</SelectItem></SelectContent>
            </Select>
          </FormField>
        )}
        <Input label="Offer Expiry Date" name="expiryDate" type="date" value={formData.expiryDate} onChange={(event) => onFieldChange('expiryDate', event.target.value)} />
      </div>
    </FormSection>
  )
}

export function OfferAdditionalInformation({ formData, onFieldChange }: OfferSectionProps) {
  return (
    <FormSection title="Additional information" description="Capture special conditions and internal context without truncating the submitted text.">
      <div className="space-y-5">
        <Textarea label="Additional Terms" name="additionalTerms" value={formData.additionalTerms} onChange={(event) => onFieldChange('additionalTerms', event.target.value)} rows={5} className="min-h-36" />
        <Textarea label="Internal Notes" name="notes" value={formData.notes} onChange={(event) => onFieldChange('notes', event.target.value)} rows={4} className="min-h-28" helperText="Internal notes are not visible to the client." />
      </div>
    </FormSection>
  )
}

function formatUsage(usage: string) {
  return usage === 'MIXED_USE' ? 'Mixed Use Property' : `${usage.replaceAll('_', ' ')} Property`
}
