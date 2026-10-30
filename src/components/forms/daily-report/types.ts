export interface DailyReportFormValues {
  reportDate: string
  overviewSummary: string
  overviewIssues: string
  overviewResolutions: string
  overviewRecommendations: string
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  occupancyRate: number
  newTenants: number
  moveOuts: number
  occupancyNotes: string
  completedTasks: number
  pendingTasks: number
  urgentIssues: number
  maintenanceNotes: string
  rentCollected: number
  pendingRent: number
  arrears: number
  expenses: number
  netIncome: number
  billsPaid: number
  pendingBills: number
  financialNotes: string
  incidents: number
  patrols: number
  accessControl: string
  cctvStatus: string
  securityNotes: string
  cleanlinessRating: number
  areasInspected: string
  cleanlinessIssues: string
  cleanlinessNotes: string
  complaintsCount: number
  resolvedCount: number
  pendingCount: number
  tenantIssuesNotes: string
  otherObservations: string
}

export interface RepairEntry {
  description: string
  status: string
  cost?: number
  notes?: string
}

export interface TenantIssueEntry {
  tenantName: string
  unit: string
  issue: string
  status: string
  dateReported: string
}

export type DailyReportSectionId =
  | 'overview'
  | 'occupancy'
  | 'maintenance'
  | 'financial'
  | 'security'
  | 'cleanliness'
  | 'tenantIssues'
  | 'observations'
