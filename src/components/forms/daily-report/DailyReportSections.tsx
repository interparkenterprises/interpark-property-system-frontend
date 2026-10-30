'use client'

import { Plus, Star, Trash2 } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { DailyReportFormValues, RepairEntry, TenantIssueEntry } from './types'

interface SectionShellProps {
  title: string
  description: string
  children: React.ReactNode
}

function SectionShell({ title, description, children }: SectionShellProps) {
  return (
    <section className="space-y-6 rounded-lg border border-border bg-card p-4 sm:p-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function OverviewSection() {
  const { register, formState: { errors } } = useFormContext<DailyReportFormValues>()
  return (
    <SectionShell title="Overview" description="Summarize the day, the issues encountered and recommended follow-up.">
      <Textarea label="Daily summary" required error={errors.overviewSummary?.message} rows={4} placeholder="Provide a brief summary of today's operations..." {...register('overviewSummary', { required: 'Summary is required' })} />
      <Textarea label="Issues encountered" rows={3} placeholder="List any issues or challenges encountered today..." {...register('overviewIssues')} />
      <Textarea label="Resolutions" rows={3} placeholder="Describe how issues were resolved..." {...register('overviewResolutions')} />
      <Textarea label="Recommendations" rows={3} placeholder="Provide recommendations for improvement..." {...register('overviewRecommendations')} />
    </SectionShell>
  )
}

export function OccupancySection() {
  const { register, formState: { errors } } = useFormContext<DailyReportFormValues>()
  return (
    <SectionShell title="Occupancy" description="Record the current unit position and tenant movement for the day.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Input type="number" label="Total units" required min={0} error={errors.totalUnits?.message} {...register('totalUnits', { required: 'Total units is required', min: 0 })} />
        <Input type="number" label="Occupied units" required min={0} error={errors.occupiedUnits?.message} {...register('occupiedUnits', { required: 'Occupied units is required', min: 0 })} />
        <Input type="number" label="Vacant units" disabled {...register('vacantUnits')} />
        <Input type="number" label="Occupancy rate (%)" disabled className="font-semibold text-primary" {...register('occupancyRate')} />
        <Input type="number" label="New tenants" min={0} {...register('newTenants', { min: 0 })} />
        <Input type="number" label="Move-outs" min={0} {...register('moveOuts', { min: 0 })} />
      </div>
      <Textarea label="Occupancy notes" rows={3} placeholder="Additional notes about occupancy status..." {...register('occupancyNotes')} />
    </SectionShell>
  )
}

interface MaintenanceSectionProps {
  repairs: RepairEntry[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: <K extends keyof RepairEntry>(index: number, field: K, value: RepairEntry[K]) => void
}

export function MaintenanceSection({ repairs, onAdd, onRemove, onUpdate }: MaintenanceSectionProps) {
  const { register } = useFormContext<DailyReportFormValues>()
  return (
    <SectionShell title="Maintenance" description="Capture maintenance workload, urgent items and individual repair activity.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Input type="number" label="Completed tasks" min={0} {...register('completedTasks', { min: 0 })} />
        <Input type="number" label="Pending tasks" min={0} {...register('pendingTasks', { min: 0 })} />
        <Input type="number" label="Urgent issues" min={0} {...register('urgentIssues', { min: 0 })} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Repair details</h4>
            <p className="text-xs text-muted-foreground">Add each repair handled or still requiring attention.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAdd}><Plus className="size-4" />Add repair</Button>
        </div>
        {repairs.map((repair, index) => (
          <div key={index} className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">Repair {index + 1}</span>
              {repairs.length > 1 && (
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove repair ${index + 1}`} onClick={() => onRemove(index)} className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <Input label="Description" value={repair.description} onChange={(event) => onUpdate(index, 'description', event.target.value)} placeholder="Description of repair" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`repair-status-${index}`}>Status</Label>
                <select id={`repair-status-${index}`} value={repair.status} onChange={(event) => onUpdate(index, 'status', event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25">
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <Input type="number" label="Cost (KES)" min={0} value={repair.cost || ''} onChange={(event) => onUpdate(index, 'cost', Number(event.target.value))} />
            </div>
            <Input label="Notes" value={repair.notes || ''} onChange={(event) => onUpdate(index, 'notes', event.target.value)} placeholder="Additional notes" />
          </div>
        ))}
      </div>
      <Textarea label="Maintenance notes" rows={3} placeholder="Additional maintenance notes..." {...register('maintenanceNotes')} />
    </SectionShell>
  )
}

export function FinancialSection() {
  const { register } = useFormContext<DailyReportFormValues>()
  return (
    <SectionShell title="Financial" description="Record the operational figures reported for this day.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input type="number" step="0.01" min={0} label="Rent collected (KES)" {...register('rentCollected', { min: 0 })} />
        <Input type="number" step="0.01" min={0} label="Pending rent (KES)" {...register('pendingRent', { min: 0 })} />
        <Input type="number" step="0.01" min={0} label="Arrears (KES)" {...register('arrears', { min: 0 })} />
        <Input type="number" step="0.01" min={0} label="Expenses (KES)" {...register('expenses', { min: 0 })} />
        <Input type="number" step="0.01" min={0} label="Bills paid" {...register('billsPaid', { min: 0 })} />
        <Input type="number" step="0.01" min={0} label="Pending bills" {...register('pendingBills', { min: 0 })} />
        <Input type="number" step="0.01" label="Net income (KES)" disabled className="font-semibold text-success" {...register('netIncome')} />
      </div>
      <Textarea label="Financial notes" rows={3} placeholder="Additional financial notes..." {...register('financialNotes')} />
    </SectionShell>
  )
}

export function SecuritySection() {
  const { register } = useFormContext<DailyReportFormValues>()
  return (
    <SectionShell title="Security" description="Document incidents, patrol activity and the status of security controls.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input type="number" label="Incidents" min={0} {...register('incidents', { min: 0 })} />
        <Input type="number" label="Patrols conducted" min={0} {...register('patrols', { min: 0 })} />
        <Input label="Access control status" placeholder="For example: All gates functional" {...register('accessControl')} />
        <div className="space-y-1.5">
          <Label htmlFor="cctv-status">CCTV status</Label>
          <select id="cctv-status" {...register('cctvStatus')} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25">
            <option value="OPERATIONAL">Operational</option>
            <option value="PARTIAL">Partially operational</option>
            <option value="DOWN">Down</option>
          </select>
        </div>
      </div>
      <Textarea label="Security notes" rows={3} placeholder="Additional security notes..." {...register('securityNotes')} />
    </SectionShell>
  )
}

export function CleanlinessSection() {
  const { control, register } = useFormContext<DailyReportFormValues>()
  const ratingValue = Number(useWatch({ control, name: 'cleanlinessRating' }))
  return (
    <SectionShell title="Cleanliness" description="Rate overall cleanliness and record the areas inspected and issues found.">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Rating (1–5)</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${ratingValue === rating ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
              <input type="radio" value={rating} {...register('cleanlinessRating')} className="sr-only" />
              <span>{rating}</span><Star className="size-4" fill={ratingValue >= rating ? 'currentColor' : 'none'} aria-hidden="true" />
            </label>
          ))}
        </div>
      </fieldset>
      <Input label="Areas inspected" helperText="Separate multiple areas with commas." placeholder="Lobby, Corridors, Parking, Common areas" {...register('areasInspected')} />
      <Input label="Issues found" helperText="Separate multiple issues with commas." placeholder="Overflowing bins, Stairwell graffiti" {...register('cleanlinessIssues')} />
      <Textarea label="Cleanliness notes" rows={3} placeholder="Additional cleanliness notes..." {...register('cleanlinessNotes')} />
    </SectionShell>
  )
}

interface TenantIssuesSectionProps {
  issues: TenantIssueEntry[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: <K extends keyof TenantIssueEntry>(index: number, field: K, value: TenantIssueEntry[K]) => void
}

export function TenantIssuesSection({ issues, onAdd, onRemove, onUpdate }: TenantIssuesSectionProps) {
  const { register } = useFormContext<DailyReportFormValues>()
  return (
    <SectionShell title="Tenant Issues" description="Track complaint totals and the individual tenant issues reported today.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Input type="number" label="Total complaints" min={0} {...register('complaintsCount', { min: 0 })} />
        <Input type="number" label="Resolved" min={0} {...register('resolvedCount', { min: 0 })} />
        <Input type="number" label="Pending" min={0} {...register('pendingCount', { min: 0 })} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Issue details</h4>
            <p className="text-xs text-muted-foreground">Add each tenant issue that requires tracking.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAdd}><Plus className="size-4" />Add issue</Button>
        </div>
        {issues.map((issue, index) => (
          <div key={index} className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">Issue {index + 1}</span>
              {issues.length > 1 && (
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove issue ${index + 1}`} onClick={() => onRemove(index)} className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Tenant name" value={issue.tenantName} onChange={(event) => onUpdate(index, 'tenantName', event.target.value)} />
              <Input label="Unit" value={issue.unit} onChange={(event) => onUpdate(index, 'unit', event.target.value)} />
              <div className="sm:col-span-2">
                <Input label="Issue description" value={issue.issue} onChange={(event) => onUpdate(index, 'issue', event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`tenant-issue-status-${index}`}>Status</Label>
                <select id={`tenant-issue-status-${index}`} value={issue.status} onChange={(event) => onUpdate(index, 'status', event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25">
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <Input type="date" label="Date reported" value={issue.dateReported} onChange={(event) => onUpdate(index, 'dateReported', event.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <Textarea label="Tenant issues notes" rows={3} placeholder="Additional notes about tenant issues..." {...register('tenantIssuesNotes')} />
    </SectionShell>
  )
}

export function OtherObservationsSection() {
  const { register } = useFormContext<DailyReportFormValues>()
  return (
    <SectionShell title="Other Observations" description="Add any operational observations that do not fit the earlier sections.">
      <Textarea label="Additional observations and comments" rows={8} placeholder="Any other observations, concerns, or notes about today's operations..." {...register('otherObservations')} />
    </SectionShell>
  )
}
