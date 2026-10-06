import Link from 'next/link'
import { Eye, Trash2 } from 'lucide-react'
import type { Lead } from '@/types'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

interface LeadListProps {
  leads: Lead[]
  isAdmin: boolean
  deletingLead: string | null
  onDelete: (id: string) => Promise<void>
}

function LeadIdentity({ lead }: { lead: Lead }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/leads/${lead.id}`}
        className="block truncate font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {lead.name}
      </Link>
      {lead.email && <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.email}</p>}
    </div>
  )
}

function LeadActions({
  lead,
  deletingLead,
  onDelete,
}: {
  lead: Lead
  deletingLead: string | null
  onDelete: (id: string) => Promise<void>
}) {
  const isDeleting = deletingLead === lead.id

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={`/leads/${lead.id}`} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        View
      </Link>
      <PermissionGuard module="leads" action="delete">
        <Button
          variant="ghost"
          size="sm"
          loading={isDeleting}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => void onDelete(lead.id)}
        >
          {!isDeleting && <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </PermissionGuard>
    </div>
  )
}

export function LeadList({ leads, isAdmin, deletingLead, onDelete }: LeadListProps) {
  return (
    <div className="space-y-3">
      <div className="hidden md:block">
        <Table className="min-w-[900px]">
          <TableHead>
            <TableHeader>Name</TableHeader>
            <TableHeader className="hidden 2xl:table-cell">Phone</TableHeader>
            <TableHeader className="hidden lg:table-cell">Nature of Lead</TableHeader>
            <TableHeader>Property</TableHeader>
            <TableHeader className="hidden xl:table-cell">Created</TableHeader>
            {isAdmin && <TableHeader className="hidden 2xl:table-cell">Created By</TableHeader>}
            <TableHeader>Actions</TableHeader>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="min-w-52 whitespace-normal">
                  <LeadIdentity lead={lead} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground 2xl:table-cell">{lead.phone}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant="neutral">{lead.natureOfLead || 'Not specified'}</Badge>
                </TableCell>
                <TableCell className="min-w-44 whitespace-normal font-medium">
                  {lead.property?.name || 'Not assigned'}
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {dateFormatter.format(new Date(lead.createdAt))}
                </TableCell>
                {isAdmin && (
                  <TableCell className="hidden max-w-56 truncate text-muted-foreground 2xl:table-cell">
                    {lead.createdById || 'Unknown'}
                  </TableCell>
                )}
                <TableCell className="min-w-44">
                  <LeadActions lead={lead} deletingLead={deletingLead} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {leads.map((lead) => (
          <Card key={lead.id}>
            <CardHeader className="pb-3">
              <LeadIdentity lead={lead} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">{lead.natureOfLead || 'Nature not specified'}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{lead.phone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Property</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{lead.property?.name || 'Not assigned'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {dateFormatter.format(new Date(lead.createdAt))}
                  </dd>
                </div>
                {isAdmin && (
                  <div>
                    <dt className="text-muted-foreground">Created By</dt>
                    <dd className="mt-0.5 break-all font-medium text-foreground">{lead.createdById || 'Unknown'}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
            <CardFooter className="px-3 py-2">
              <LeadActions lead={lead} deletingLead={deletingLead} onDelete={onDelete} />
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {leads.length} lead{leads.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export function LeadListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading leads" aria-busy="true">
      <div className="rounded-md border border-border p-4">
        <Skeleton className="h-4 w-40" />
        <div className="mt-5 space-y-5">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="grid grid-cols-[minmax(0,1fr)_7rem] gap-6 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_8rem_10rem]"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-44 max-w-full" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="hidden h-8 w-32 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
