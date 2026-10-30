'use client'

import { useState } from 'react'
import { ArrowRight, Building2, CirclePlus, FileText, Home, Inbox, Save, Search, UserRound } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { EmptyState } from '@/components/ui/empty-state'
import { FileUpload } from '@/components/ui/file-upload'
import { FormActions } from '@/components/ui/form-actions'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { Progress } from '@/components/ui/progress'
import { RankedComparison } from '@/components/ui/ranked-comparison'
import { SectionHeader } from '@/components/ui/section-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatCard } from '@/components/ui/stat-card'
import { Switch } from '@/components/ui/Switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

const collectionData = [
  { month: 'May', collected: 680000, outstanding: 120000 },
  { month: 'Jun', collected: 742000, outstanding: 98000 },
  { month: 'Jul', collected: 715000, outstanding: 135000 },
  { month: 'Aug', collected: 804000, outstanding: 76000 },
  { month: 'Sep', collected: 836000, outstanding: 64000 },
  { month: 'Oct', collected: 872000, outstanding: 48000 },
]

const collectionConfig = {
  collected: {
    label: 'Collected',
    color: 'var(--chart-1)',
  },
  outstanding: {
    label: 'Outstanding',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

const occupancyData = [
  { month: 'May', occupied: 18, vacant: 6 },
  { month: 'Jun', occupied: 19, vacant: 5 },
  { month: 'Jul', occupied: 19, vacant: 5 },
  { month: 'Aug', occupied: 20, vacant: 4 },
  { month: 'Sep', occupied: 20, vacant: 4 },
  { month: 'Oct', occupied: 21, vacant: 3 },
]

const occupancyConfig = {
  occupied: {
    label: 'Occupied',
    color: 'var(--chart-2)',
  },
  vacant: {
    label: 'Vacant',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

const rankedPropertyData = [
  { id: 'riverside', label: 'Riverside Apartments', billed: 820000, allocated: 742000 },
  { id: 'kilimani', label: 'Kilimani Heights', billed: 690000, allocated: 624000 },
  { id: 'westlands', label: 'Westlands Court', billed: 560000, allocated: 486000 },
  { id: 'parklands', label: 'Parklands Plaza', billed: 440000, allocated: 371000 },
  { id: 'langata', label: 'Langata Gardens', billed: 315000, allocated: 268000 },
]

export default function ComponentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [tabsExample, setTabsExample] = useState('overview')
  const [fileUploadExample, setFileUploadExample] = useState<File | null>(null)

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
            <div className="md:col-span-2">
              <FileUpload
                value={fileUploadExample}
                onValueChange={setFileUploadExample}
                title="Drop a supporting document here"
                description="PDF, spreadsheet, image, or document"
                buttonLabel="Select document"
              />
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

      <ShowcaseSection title="Charts" description="Responsive trends and ranked comparisons using shared themes, values and legends.">
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly collections</CardTitle>
              <CardDescription>Collected and outstanding rent for the last six months.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={collectionConfig} className="h-[280px] w-full aspect-auto">
                <AreaChart accessibilityLayer data={collectionData} margin={{ left: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="fillCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-collected)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-collected)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillOutstanding" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-outstanding)" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="var(--color-outstanding)" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    dataKey="collected"
                    type="natural"
                    fill="url(#fillCollected)"
                    fillOpacity={0.4}
                    stroke="var(--color-collected)"
                    stackId="a"
                  />
                  <Area
                    dataKey="outstanding"
                    type="natural"
                    fill="url(#fillOutstanding)"
                    fillOpacity={0.4}
                    stroke="var(--color-outstanding)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Occupancy trend</CardTitle>
              <CardDescription>Occupied and vacant units over the last six months.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={occupancyConfig} className="h-[280px] w-full aspect-auto">
                <AreaChart accessibilityLayer data={occupancyData} margin={{ left: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="fillOccupied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-occupied)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-occupied)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillVacant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-vacant)" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="var(--color-vacant)" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    dataKey="occupied"
                    type="natural"
                    fill="url(#fillOccupied)"
                    fillOpacity={0.4}
                    stroke="var(--color-occupied)"
                  />
                  <Area
                    dataKey="vacant"
                    type="natural"
                    fill="url(#fillVacant)"
                    fillOpacity={0.4}
                    stroke="var(--color-vacant)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Ranked comparison</CardTitle>
              <CardDescription>Compact category comparison for properties and other long-label datasets.</CardDescription>
            </CardHeader>
            <CardContent>
              <RankedComparison
                items={rankedPropertyData.map(item => ({
                  id: item.id,
                  label: item.label,
                  values: {
                    billed: { value: item.billed, display: `Ksh ${(item.billed / 1000).toFixed(0)}K`, title: `Ksh ${item.billed.toLocaleString('en-KE')}` },
                    allocated: { value: item.allocated, display: `Ksh ${(item.allocated / 1000).toFixed(0)}K`, title: `Ksh ${item.allocated.toLocaleString('en-KE')}` },
                    rate: { value: (item.allocated / item.billed) * 100, display: `${((item.allocated / item.billed) * 100).toFixed(1)}%` },
                  },
                }))}
                columns={[{ key: 'billed', label: 'Billed' }, { key: 'allocated', label: 'Allocated', emphasized: true }, { key: 'rate', label: 'Rate' }]}
                bars={[{ key: 'billed', color: 'color-mix(in srgb, var(--primary) 22%, transparent)' }, { key: 'allocated', color: 'var(--primary)' }]}
                labelHeading="Property"
              />
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Tabs" description="Accessible layered navigation with keyboard selection and responsive overflow.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Default</CardTitle><CardDescription>Compact muted list with a surface-backed active tab.</CardDescription></CardHeader>
            <CardContent>
              <Tabs value={tabsExample} onValueChange={setTabsExample}>
                <TabsList aria-label="Dashboard sections">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="overview"><p className="text-sm text-muted-foreground">View key metrics and recent project activity.</p></TabsContent>
                <TabsContent value="analytics"><p className="text-sm text-muted-foreground">Review performance and portfolio trends.</p></TabsContent>
                <TabsContent value="reports"><p className="text-sm text-muted-foreground">Generate and export operational reports.</p></TabsContent>
                <TabsContent value="settings"><p className="text-sm text-muted-foreground">Manage workspace preferences.</p></TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Line</CardTitle><CardDescription>Transparent list with a restrained active indicator.</CardDescription></CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList variant="line" aria-label="Report sections">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="overview"><p className="text-sm text-muted-foreground">Summary report content.</p></TabsContent>
                <TabsContent value="analytics"><p className="text-sm text-muted-foreground">Analytics report content.</p></TabsContent>
                <TabsContent value="reports"><p className="text-sm text-muted-foreground">Saved report content.</p></TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Overflow</CardTitle><CardDescription>Long labels remain on one scrollable line on narrow screens.</CardDescription></CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList aria-label="Operations sections">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="leases">Lease Portfolio</TabsTrigger>
                  <TabsTrigger value="collections">Rent Collection</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance Requests</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
                  <TabsTrigger value="settings">Account Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="overview"><p className="text-sm text-muted-foreground">Operational workspace overview.</p></TabsContent>
                <TabsContent value="leases"><p className="text-sm text-muted-foreground">Lease portfolio content.</p></TabsContent>
                <TabsContent value="collections"><p className="text-sm text-muted-foreground">Rent collection content.</p></TabsContent>
                <TabsContent value="maintenance"><p className="text-sm text-muted-foreground">Maintenance request content.</p></TabsContent>
                <TabsContent value="compliance"><p className="text-sm text-muted-foreground">Compliance report content.</p></TabsContent>
                <TabsContent value="settings"><p className="text-sm text-muted-foreground">Account settings content.</p></TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Vertical</CardTitle><CardDescription>The same primitive supports vertical orientation.</CardDescription></CardHeader>
            <CardContent>
              <Tabs defaultValue="account" orientation="vertical">
                <TabsList aria-label="Account sections">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
                <TabsContent value="account"><p className="text-sm text-muted-foreground">Manage account details.</p></TabsContent>
                <TabsContent value="password"><p className="text-sm text-muted-foreground">Update password settings.</p></TabsContent>
                <TabsContent value="notifications"><p className="text-sm text-muted-foreground">Choose notification preferences.</p></TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Property Summary" description="Reusable statistics, section introductions, details and progress indicators.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Units" value="24" description="Across three blocks" icon={<Building2 className="h-5 w-5" />} tone="primary" />
          <StatCard label="Occupied" value="21" description="Three units available" icon={<Home className="h-5 w-5" />} tone="success" />
          <StatCard label="Occupancy Rate" value="87.5%" description="Up 2.5% this month" icon={<ArrowRight className="h-5 w-5" />} tone="info" />
          <StatCard label="Open Actions" value="4" description="Two require approval" icon={<FileText className="h-5 w-5" />} tone="warning" />
        </div>
        <Card>
          <CardHeader>
            <SectionHeader
              title="Property information"
              description="Registered identity, usage and ownership details."
              leading={<div className="rounded-md bg-primary/10 p-2 text-primary"><Building2 className="h-5 w-5" /></div>}
              actions={<Button size="sm" variant="outline">Edit details</Button>}
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <DetailList>
              <DetailItem label="Address">Riverside Drive, Nairobi</DetailItem>
              <DetailItem label="LR Number">LR-DEMO-201</DetailItem>
              <DetailItem label="Landlord">Amina Holdings Ltd</DetailItem>
              <DetailItem label="Usage"><StatusBadge status="RESIDENTIAL" appearance="neutral" /></DetailItem>
            </DetailList>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm"><span className="font-medium">Occupancy</span><span className="text-muted-foreground">87.5%</span></div>
              <Progress value={87.5} label="Property occupancy" />
            </div>
          </CardContent>
        </Card>
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
