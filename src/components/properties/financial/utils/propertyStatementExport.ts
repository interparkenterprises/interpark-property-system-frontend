import type { ExportSection } from '@/lib/excelGenerator'
import type { Property } from '@/types'

export function getPropertyStatementSectionAvailability(sectionId: string, property: Property) {
  if (sectionId === 'unitsAndTenants') return { available: (property.units?.length || 0) > 0, itemCount: property.units?.length || 0 }
  if (sectionId === 'incomeRecords') return { available: (property.incomes?.length || 0) > 0, itemCount: property.incomes?.length || 0 }
  if (sectionId === 'commissionRecords') return { available: (property.commissions?.length || 0) > 0, itemCount: property.commissions?.length || 0 }
  if (sectionId === 'serviceProviders') return { available: (property.serviceProviders?.length || 0) > 0, itemCount: property.serviceProviders?.length || 0 }
  return { available: true, itemCount: 0 }
}

export function normalizePropertyStatementSections(sections: ExportSection[], property: Property) {
  return sections.map((section) => ({
    ...section,
    selected: getPropertyStatementSectionAvailability(section.id, property).available && section.selected,
  }))
}

export function toggleAllPropertyStatementSections(sections: ExportSection[], property: Property) {
  const availableSections = sections.filter((section) => getPropertyStatementSectionAvailability(section.id, property).available)
  const allSelected = availableSections.length > 0 && availableSections.every((section) => section.selected)
  return sections.map((section) => ({
    ...section,
    selected: getPropertyStatementSectionAvailability(section.id, property).available ? !allSelected : false,
  }))
}

export function getSelectedPropertyStatementSectionIds(sections: ExportSection[], property: Property) {
  return sections
    .filter((section) => section.selected && getPropertyStatementSectionAvailability(section.id, property).available)
    .map((section) => section.id)
}
