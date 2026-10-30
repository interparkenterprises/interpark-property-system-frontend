'use client'

import { useEffect, useState } from 'react'
import type { FieldErrors } from 'react-hook-form'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Banknote, Building2, ChevronLeft, ChevronRight, ClipboardList, Eye, FileText, ShieldCheck, Sparkles, Users, Wrench } from 'lucide-react'
import { dailyReportsAPI } from '@/lib/api'
import type { CreateDailyReportRequest, DailyReport, UpdateDailyReportRequest } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CleanlinessSection,
  FinancialSection,
  MaintenanceSection,
  OccupancySection,
  OtherObservationsSection,
  OverviewSection,
  SecuritySection,
  TenantIssuesSection,
} from './daily-report/DailyReportSections'
import type { DailyReportFormValues, DailyReportSectionId, RepairEntry, TenantIssueEntry } from './daily-report/types'

interface DailyReportFormProps {
  propertyId: string
  propertyName?: string
  report?: DailyReport | null
  onSuccess: () => void
  onCancel: () => void
}

const sections: Array<{ id: DailyReportSectionId; title: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', title: 'Overview', icon: ClipboardList },
  { id: 'occupancy', title: 'Occupancy', icon: Building2 },
  { id: 'maintenance', title: 'Maintenance', icon: Wrench },
  { id: 'financial', title: 'Financial', icon: Banknote },
  { id: 'security', title: 'Security', icon: ShieldCheck },
  { id: 'cleanliness', title: 'Cleanliness', icon: Sparkles },
  { id: 'tenantIssues', title: 'Tenant Issues', icon: Users },
  { id: 'observations', title: 'Other Observations', icon: Eye },
]

const fieldSections: Partial<Record<keyof DailyReportFormValues, DailyReportSectionId>> = {
  overviewSummary: 'overview', overviewIssues: 'overview', overviewResolutions: 'overview', overviewRecommendations: 'overview',
  totalUnits: 'occupancy', occupiedUnits: 'occupancy', vacantUnits: 'occupancy', occupancyRate: 'occupancy', newTenants: 'occupancy', moveOuts: 'occupancy', occupancyNotes: 'occupancy',
  completedTasks: 'maintenance', pendingTasks: 'maintenance', urgentIssues: 'maintenance', maintenanceNotes: 'maintenance',
  rentCollected: 'financial', pendingRent: 'financial', arrears: 'financial', expenses: 'financial', netIncome: 'financial', billsPaid: 'financial', pendingBills: 'financial', financialNotes: 'financial',
  incidents: 'security', patrols: 'security', accessControl: 'security', cctvStatus: 'security', securityNotes: 'security',
  cleanlinessRating: 'cleanliness', areasInspected: 'cleanliness', cleanlinessIssues: 'cleanliness', cleanlinessNotes: 'cleanliness',
  complaintsCount: 'tenantIssues', resolvedCount: 'tenantIssues', pendingCount: 'tenantIssues', tenantIssuesNotes: 'tenantIssues',
  otherObservations: 'observations',
}

export default function DailyReportForm({ propertyId, propertyName, report, onSuccess, onCancel }: DailyReportFormProps) {
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<DailyReportSectionId>('overview')
  const [submitting, setSubmitting] = useState(false)
  const [repairs, setRepairs] = useState<RepairEntry[]>(report?.maintenance?.repairs || [{ description: '', status: 'PENDING', cost: 0, notes: '' }])
  const [tenantIssues, setTenantIssues] = useState<TenantIssueEntry[]>(report?.tenantIssues?.issues || [{ tenantName: '', unit: '', issue: '', status: 'PENDING', dateReported: today() }])

  const form = useForm<DailyReportFormValues>({ shouldUnregister: false, defaultValues: createDefaultValues(report) })
  const { handleSubmit, register, setFocus, setValue, formState: { errors } } = form
  const [totalUnits, occupiedUnits, rentCollected, expenses] = useWatch({
    control: form.control,
    name: ['totalUnits', 'occupiedUnits', 'rentCollected', 'expenses'],
  })

  useEffect(() => {
    if (totalUnits > 0) {
      setValue('occupancyRate', Math.round((occupiedUnits / totalUnits) * 100))
      setValue('vacantUnits', totalUnits - occupiedUnits)
    }
  }, [occupiedUnits, setValue, totalUnits])

  useEffect(() => { setValue('netIncome', rentCollected - expenses) }, [expenses, rentCollected, setValue])

  const addRepair = () => setRepairs((current) => [...current, { description: '', status: 'PENDING', cost: 0, notes: '' }])
  const removeRepair = (index: number) => setRepairs((current) => current.filter((_, itemIndex) => itemIndex !== index))
  const updateRepair = <K extends keyof RepairEntry>(index: number, field: K, value: RepairEntry[K]) => {
    setRepairs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }
  const addTenantIssue = () => setTenantIssues((current) => [...current, { tenantName: '', unit: '', issue: '', status: 'PENDING', dateReported: today() }])
  const removeTenantIssue = (index: number) => setTenantIssues((current) => current.filter((_, itemIndex) => itemIndex !== index))
  const updateTenantIssue = <K extends keyof TenantIssueEntry>(index: number, field: K, value: TenantIssueEntry[K]) => {
    setTenantIssues((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  const onSubmit = async (data: DailyReportFormValues) => {
    try {
      setLoading(true)
      const reportData = createReportPayload(propertyId, data, repairs, tenantIssues)
      if (report) await dailyReportsAPI.update(report.id, reportData)
      else await dailyReportsAPI.create(reportData as CreateDailyReportRequest)
      onSuccess()
    } catch (error) {
      console.error('Error saving daily report:', error)
      window.alert(error instanceof Error ? error.message : 'Failed to save daily report')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReport = async (data: DailyReportFormValues) => {
    try {
      setSubmitting(true)
      await onSubmit(data)
      if (report) await dailyReportsAPI.submit(report.id)
      window.alert('Report submitted successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error submitting report:', error)
      window.alert(error instanceof Error ? error.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInvalid = (validationErrors: FieldErrors<DailyReportFormValues>) => {
    const firstField = Object.keys(validationErrors)[0] as keyof DailyReportFormValues | undefined
    if (!firstField) return
    const section = fieldSections[firstField]
    if (section) setActiveSection(section)
    window.setTimeout(() => setFocus(firstField), 0)
  }

  const activeIndex = sections.findIndex((section) => section.id === activeSection)
  const previousSection = activeIndex > 0 ? sections[activeIndex - 1] : null
  const nextSection = activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null
  const canEditDraft = !report || report.status === 'DRAFT'

  return (
    <FormProvider {...form}>
      <form className="min-w-0 space-y-4" onSubmit={handleSubmit(onSubmit, handleInvalid)} noValidate>
        <Card>
          <CardHeader className="gap-4 border-b border-border sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><FileText className="size-4" aria-hidden="true" />Managers DOR</div>
              <CardTitle className="mt-2">{report ? 'Edit Daily Operations Report' : 'Create Daily Operations Report'}</CardTitle>
              <CardDescription className="mt-1">{propertyName || report?.property?.name || 'Current property'} · One report with eight operational sections.</CardDescription>
            </div>
            <div className="w-full sm:w-52">
              <Input type="date" label="Report date" required error={errors.reportDate?.message} {...register('reportDate', { required: 'Report date is required' })} />
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5">
            <Tabs orientation="vertical" value={activeSection} onValueChange={(value) => setActiveSection(value as DailyReportSectionId)} className="flex-col gap-4 md:flex-row md:gap-6">
              <TabsList aria-label="Daily report sections" className="max-h-52 w-full overflow-y-auto md:max-h-none md:w-60 md:overflow-visible">
                {sections.map(({ id, title, icon: Icon }) => <TabsTrigger key={id} value={id} className="min-h-9 justify-start gap-2 px-3"><Icon className="size-4" aria-hidden="true" />{title}</TabsTrigger>)}
              </TabsList>
              <div className="min-w-0 flex-1">
                <TabsContent value="overview"><OverviewSection /></TabsContent>
                <TabsContent value="occupancy"><OccupancySection /></TabsContent>
                <TabsContent value="maintenance"><MaintenanceSection repairs={repairs} onAdd={addRepair} onRemove={removeRepair} onUpdate={updateRepair} /></TabsContent>
                <TabsContent value="financial"><FinancialSection /></TabsContent>
                <TabsContent value="security"><SecuritySection /></TabsContent>
                <TabsContent value="cleanliness"><CleanlinessSection /></TabsContent>
                <TabsContent value="tenantIssues"><TenantIssuesSection issues={tenantIssues} onAdd={addTenantIssue} onRemove={removeTenantIssue} onUpdate={updateTenantIssue} /></TabsContent>
                <TabsContent value="observations"><OtherObservationsSection /></TabsContent>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button type="button" variant="outline" disabled={!previousSection} onClick={() => previousSection && setActiveSection(previousSection.id)}><ChevronLeft className="size-4" />Previous</Button>
                  <span className="text-xs text-muted-foreground">Section {activeIndex + 1} of {sections.length}</span>
                  <Button type="button" variant="outline" disabled={!nextSection} onClick={() => nextSection && setActiveSection(nextSection.id)}>Next<ChevronRight className="size-4" /></Button>
                </div>
              </div>
            </Tabs>
          </CardContent>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 px-4 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-5">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading || submitting}>Cancel</Button>
            {canEditDraft && <>
              <Button type="button" variant="secondary" loading={loading} disabled={submitting} onClick={handleSubmit(onSubmit, handleInvalid)}>{report ? 'Update Draft' : 'Save as Draft'}</Button>
              <Button type="button" loading={submitting} disabled={loading} onClick={handleSubmit(handleSubmitReport, handleInvalid)}>{report ? 'Submit Report' : 'Create & Submit'}</Button>
            </>}
          </div>
        </Card>
      </form>
    </FormProvider>
  )
}

function today() { return new Date().toISOString().split('T')[0] }

function createDefaultValues(report?: DailyReport | null): DailyReportFormValues {
  return {
    reportDate: report?.reportDate?.split('T')[0] || today(),
    overviewSummary: report?.overview?.summary || '', overviewIssues: report?.overview?.issuesEncountered || '', overviewResolutions: report?.overview?.resolutions || '', overviewRecommendations: report?.overview?.recommendations || '',
    totalUnits: report?.occupancy?.totalUnits || 0, occupiedUnits: report?.occupancy?.occupiedUnits || 0, vacantUnits: report?.occupancy?.vacantUnits || 0, occupancyRate: report?.occupancy?.occupancyRate || 0, newTenants: report?.occupancy?.newTenants || 0, moveOuts: report?.occupancy?.moveOuts || 0, occupancyNotes: report?.occupancy?.notes || '',
    completedTasks: report?.maintenance?.completedTasks || 0, pendingTasks: report?.maintenance?.pendingTasks || 0, urgentIssues: report?.maintenance?.urgentIssues || 0, maintenanceNotes: report?.maintenance?.notes || '',
    rentCollected: report?.financial?.rentCollected || 0, pendingRent: report?.financial?.pendingRent || 0, arrears: report?.financial?.arrears || 0, expenses: report?.financial?.expenses || 0, netIncome: report?.financial?.netIncome || 0, billsPaid: report?.financial?.billsPaid || 0, pendingBills: report?.financial?.pendingBills || 0, financialNotes: report?.financial?.notes || '',
    incidents: report?.security?.incidents || 0, patrols: report?.security?.patrols || 0, accessControl: report?.security?.accessControl || '', cctvStatus: report?.security?.cctvStatus || 'OPERATIONAL', securityNotes: report?.security?.notes || '',
    cleanlinessRating: report?.cleanliness?.rating || 5, areasInspected: report?.cleanliness?.areasInspected?.join(', ') || '', cleanlinessIssues: report?.cleanliness?.issues?.join(', ') || '', cleanlinessNotes: report?.cleanliness?.notes || '',
    complaintsCount: report?.tenantIssues?.complaints || 0, resolvedCount: report?.tenantIssues?.resolved || 0, pendingCount: report?.tenantIssues?.pending || 0, tenantIssuesNotes: report?.tenantIssues?.notes || '',
    otherObservations: report?.otherObservations || '',
  }
}

function createReportPayload(propertyId: string, data: DailyReportFormValues, repairs: RepairEntry[], tenantIssues: TenantIssueEntry[]): CreateDailyReportRequest | UpdateDailyReportRequest {
  return {
    propertyId,
    reportDate: data.reportDate,
    overview: { summary: data.overviewSummary, issuesEncountered: data.overviewIssues, resolutions: data.overviewResolutions, recommendations: data.overviewRecommendations },
    occupancy: { totalUnits: Number(data.totalUnits), occupiedUnits: Number(data.occupiedUnits), vacantUnits: Number(data.vacantUnits), occupancyRate: Number(data.occupancyRate), newTenants: Number(data.newTenants) || 0, moveOuts: Number(data.moveOuts) || 0, notes: data.occupancyNotes },
    maintenance: { completedTasks: Number(data.completedTasks) || 0, pendingTasks: Number(data.pendingTasks) || 0, urgentIssues: Number(data.urgentIssues) || 0, repairs: repairs.filter((repair) => repair.description), notes: data.maintenanceNotes },
    financial: { rentCollected: Number(data.rentCollected) || 0, pendingRent: Number(data.pendingRent) || 0, arrears: Number(data.arrears) || 0, expenses: Number(data.expenses) || 0, netIncome: Number(data.netIncome) || 0, billsPaid: Number(data.billsPaid) || 0, pendingBills: Number(data.pendingBills) || 0, notes: data.financialNotes },
    security: { incidents: Number(data.incidents) || 0, patrols: Number(data.patrols) || 0, accessControl: data.accessControl, cctvStatus: data.cctvStatus, notes: data.securityNotes },
    cleanliness: { rating: Number(data.cleanlinessRating) || 5, areasInspected: splitCommaSeparated(data.areasInspected), issues: splitCommaSeparated(data.cleanlinessIssues), notes: data.cleanlinessNotes },
    tenantIssues: { complaints: Number(data.complaintsCount) || 0, resolved: Number(data.resolvedCount) || 0, pending: Number(data.pendingCount) || 0, issues: tenantIssues.filter((issue) => issue.tenantName && issue.issue), notes: data.tenantIssuesNotes },
    otherObservations: data.otherObservations,
  }
}

function splitCommaSeparated(value: string) { return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [] }
