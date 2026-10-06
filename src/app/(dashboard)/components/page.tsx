'use client'

import { useState } from 'react'
import { ArrowRight, Building2, CirclePlus, FileText, Inbox, Save, Search, UserRound } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { FormActions } from '@/components/ui/form-actions'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/Switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

function ShowcaseSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

const surfaces = [
  { name: 'Background', className: 'bg-background text-foreground border-border' },
  { name: 'Card', className: 'bg-card text-card-foreground border-border' },
  { name: 'Muted', className: 'bg-muted text-muted-foreground border-border' },
  { name: 'Primary', className: 'bg-primary text-primary-foreground border-primary' },
  { name: 'Secondary', className: 'bg-secondary text-secondary-foreground border-border' },
  { name: 'Success', className: 'bg-success text-white border-success' },
  { name: 'Warning', className: 'bg-warning text-white border-warning' },
  { name: 'Destructive', className: 'bg-destructive text-white border-destructive' },
]

export default function ComponentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  return (
    <div className="space-y-10 pb-12">
      <PageHeader
        title="UI Components"
        description="Interpark ERP component system and visual reference."
        actions={<Button><CirclePlus className="h-4 w-4" />Example action</Button>}
      />

      <ShowcaseSection title="Foundations" description="Semantic colours and type styles shared by light and dark themes.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {surfaces.map((surface) => (
            <div key={surface.name} className={`rounded-md border p-4 ${surface.className}`}>
              <p className="text-sm font-medium">{surface.name}</p>
              <p className="mt-1 text-xs opacity-75">Semantic token</p>
            </div>
          ))}
        </div>
        <Card>
          <CardContent className="grid gap-6 pt-5 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Typography</p>
              <p className="text-2xl font-semibold tracking-tight">Property portfolio overview</p>
              <p className="text-base font-medium">Monthly collection statement</p>
              <p className="text-sm text-muted-foreground">Inter is inherited throughout the application.</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Shape and spacing</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="h-10 w-20 rounded-sm border border-border bg-muted" />
                <div className="h-12 w-24 rounded-md border border-border bg-muted" />
                <div className="h-14 w-28 rounded-lg border border-border bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>
      </ShowcaseSection>

      <Separator />

      <ShowcaseSection title="Buttons" description="Action hierarchy, sizes and interaction states.">
        <Card>
          <CardContent className="space-y-5 pt-5">
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">View invoice</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Search"><Search className="h-4 w-4" /></Button>
              <Button><Save className="h-4 w-4" />Save property</Button>
              <Button loading>Saving</Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>
      </ShowcaseSection>

      <ShowcaseSection title="Form Controls" description="Consistent labels, descriptions, errors and disabled states.">
        <Card>
          <CardContent className="grid gap-5 pt-5 md:grid-cols-2">
            <Input label="Property name" placeholder="e.g. Riverside Apartments" required helperText="Use the registered property name." />
            <Input label="Landlord email" type="email" defaultValue="accounts@riverside.co.ke" />
            <Input label="Disabled reference" defaultValue="PROP-0048" disabled />
            <Input label="Invoice amount" defaultValue="125000" error="Amount exceeds the approved limit." />
            <Textarea label="Management notes" placeholder="Add internal notes for the property team..." helperText="Visible to authorised managers only." />
            <FormField label="Property manager" htmlFor="manager" description="The manager responsible for rent collection." required>
              <Select defaultValue="grace">
                <SelectTrigger id="manager"><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grace">Grace Wanjiku</SelectItem>
                  <SelectItem value="daniel">Daniel Otieno</SelectItem>
                  <SelectItem value="amina">Amina Hassan</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Tenant phone" htmlFor="tenant-phone" error="Enter a valid Kenyan phone number." required>
              <Input id="tenant-phone" defaultValue="0712 34" aria-invalid="true" className="border-destructive" />
            </FormField>
            <div className="space-y-3">
              <Label htmlFor="notifications">Payment notifications</Label>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Email receipts</p>
                  <p className="text-xs text-muted-foreground">Send receipts after a payment is recorded.</p>
                </div>
                <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
            </div>
          </CardContent>
        </Card>
      </ShowcaseSection>

      <ShowcaseSection title="Cards" description="Restrained containers for related ERP information.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Riverside Apartments</CardTitle><CardDescription>Westlands, Nairobi</CardDescription></CardHeader>
            <CardContent><p className="text-2xl font-semibold">KES 842,500</p><p className="mt-1 text-sm text-muted-foreground">Collected this month</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle>Occupancy</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-semibold">92%</p><p className="mt-1 text-sm text-muted-foreground">23 of 25 units occupied</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Invoice INV-2048</CardTitle><CardDescription>Due 15 October 2026</CardDescription></CardHeader>
            <CardContent><StatusBadge status="PENDING" appearance="warning" /></CardContent>
            <CardFooter className="justify-end"><Button variant="outline" size="sm">Open invoice <ArrowRight className="h-3.5 w-3.5" /></Button></CardFooter>
          </Card>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Badges & Status" description="General labels and semantic ERP statuses.">
        <Card>
          <CardContent className="flex flex-wrap gap-2 pt-5">
            <Badge>Default</Badge><Badge variant="secondary">Secondary</Badge><Badge variant="outline">Outline</Badge>
            <StatusBadge status="ACTIVE" appearance="success" />
            <StatusBadge status="PENDING" appearance="warning" />
            <StatusBadge status="PAID" appearance="info" />
            <StatusBadge status="OVERDUE" appearance="destructive" />
            <StatusBadge status="VACANT" appearance="neutral" />
          </CardContent>
        </Card>
      </ShowcaseSection>

      <ShowcaseSection title="Tables" description="Presentation primitives for tabular ERP content.">
        <Table>
          <TableHead><TableHeader>Property</TableHeader><TableHeader>Tenant</TableHeader><TableHeader>Rent</TableHeader><TableHeader>Status</TableHeader></TableHead>
          <TableBody>
            <TableRow><TableCell className="font-medium">Riverside A-12</TableCell><TableCell>Mary Njeri</TableCell><TableCell>KES 45,000</TableCell><TableCell><StatusBadge status="PAID" appearance="success" /></TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Garden Court B-04</TableCell><TableCell>Peter Kamau</TableCell><TableCell>KES 32,500</TableCell><TableCell><StatusBadge status="PENDING" appearance="warning" /></TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Park View C-08</TableCell><TableCell>Asha Ali</TableCell><TableCell>KES 58,000</TableCell><TableCell><StatusBadge status="OVERDUE" appearance="destructive" /></TableCell></TableRow>
          </TableBody>
        </Table>
      </ShowcaseSection>

      <ShowcaseSection title="Feedback" description="System messages, loading states and empty results.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Alert variant="info"><AlertTitle>Invoice ready for review</AlertTitle><AlertDescription>Confirm the billing period before sending it to the tenant.</AlertDescription></Alert>
            <Alert variant="success"><AlertTitle>Payment recorded</AlertTitle><AlertDescription>KES 45,000 was allocated to invoice INV-2048.</AlertDescription></Alert>
            <Alert variant="warning"><AlertTitle>Lease ending soon</AlertTitle><AlertDescription>This tenancy expires in 21 days.</AlertDescription></Alert>
            <Alert variant="destructive"><AlertTitle>Payment failed</AlertTitle><AlertDescription>The transaction could not be confirmed.</AlertDescription></Alert>
          </div>
          <div className="space-y-4">
            <Card><CardContent className="space-y-3 pt-5"><Spinner label="Loading tenant account" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-20 w-full" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
            <EmptyState icon={Inbox} title="No invoices found" description="Invoices created for this tenant will appear here." action={<Button size="sm"><CirclePlus className="h-4 w-4" />Create invoice</Button>} />
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Dialogs" description="Accessible modal treatment using the preferred Dialog system.">
        <Card><CardContent className="pt-5"><Button variant="outline" onClick={() => setDialogOpen(true)}><FileText className="h-4 w-4" />Open example dialog</Button></CardContent></Card>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate tenant invoice</DialogTitle><DialogDescription>Create the October 2026 rent invoice for Mary Njeri.</DialogDescription></DialogHeader>
            <div className="space-y-4 p-5"><Input label="Amount" defaultValue="45000" /><Textarea label="Invoice note" defaultValue="Monthly rent for Riverside Apartments, unit A-12." /></div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => setDialogOpen(false)}>Generate invoice</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </ShowcaseSection>

      <ShowcaseSection title="Page Patterns" description="Composition patterns for page introductions and long ERP forms.">
        <Card>
          <CardContent className="space-y-6 pt-5">
            <PageHeader title="Property details" description="Review property information, landlord details and assigned manager." leading={<div className="rounded-md bg-primary/10 p-2 text-primary"><Building2 className="h-5 w-5" /></div>} actions={<><Button variant="outline">Export</Button><Button>Edit property</Button></>} />
            <FormSection title="Tenant information" description="Primary contact and lease details for this tenancy." footer={<FormActions><Button variant="outline">Cancel</Button><Button><Save className="h-4 w-4" />Save tenant</Button></FormActions>}>
              <div className="grid gap-4 md:grid-cols-2"><Input label="Full name" defaultValue="Mary Njeri" /><Input label="Phone number" defaultValue="+254 712 345 678" /><Input label="Unit" defaultValue="A-12" disabled /><Input label="Monthly rent" defaultValue="45,000" /></div>
            </FormSection>
            <EmptyState icon={UserRound} title="No service provider assigned" description="Assign a provider when maintenance work is scheduled." />
          </CardContent>
        </Card>
      </ShowcaseSection>
    </div>
  )
}
