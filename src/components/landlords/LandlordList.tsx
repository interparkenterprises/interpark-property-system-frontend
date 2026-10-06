import Link from 'next/link'
import { Building2, Eye, FileText, Pencil, Trash2 } from 'lucide-react'
import type { Landlord } from '@/types'
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

interface LandlordListProps {
  landlords: Landlord[]
  onDelete: (id: string) => void
}

function CountBadge({ count, singular, plural }: { count: number; singular: string; plural: string }) {
  return (
    <Badge variant={count > 0 ? 'secondary' : 'neutral'}>
      {count} {count === 1 ? singular : plural}
    </Badge>
  )
}

function ContactDetails({ landlord }: { landlord: Landlord }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/landlords/${landlord.id}`}
        className="block truncate font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {landlord.name}
      </Link>
      {(landlord.phone || landlord.email) && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[landlord.phone, landlord.email].filter(Boolean).join(' · ')}
        </p>
      )}
      {landlord.address && <p className="mt-1 truncate text-xs text-muted-foreground/80">{landlord.address}</p>}
    </div>
  )
}

function LandlordActions({ landlord, onDelete }: { landlord: Landlord; onDelete: (id: string) => void }) {
  const propertyCount = landlord.properties?.length ?? 0
  const offerCount = landlord.offerLetters?.length ?? 0

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={`/landlords/${landlord.id}`} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        View
      </Link>
      <Link href={`/landlords/${landlord.id}/edit`} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        Edit
      </Link>
      {propertyCount > 0 && (
        <Link href={`/properties?landlordId=${landlord.id}`} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          Properties
        </Link>
      )}
      {offerCount > 0 && (
        <Link href={`/offer-letters?landlordId=${landlord.id}`} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Offers
        </Link>
      )}
      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(landlord.id)}>
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        Delete
      </Button>
    </div>
  )
}

export function LandlordList({ landlords, onDelete }: LandlordListProps) {
  return (
    <div className="space-y-3">
      <div className="hidden md:block">
        <Table className="min-w-[880px]">
          <TableHead>
            <TableHeader>Contact Info</TableHeader>
            <TableHeader className="hidden xl:table-cell">ID Number</TableHeader>
            <TableHeader>Properties</TableHeader>
            <TableHeader className="hidden 2xl:table-cell">Offer Letters</TableHeader>
            <TableHeader className="hidden lg:table-cell">Created</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableHead>
          <TableBody>
            {landlords.map((landlord) => {
              const propertyCount = landlord.properties?.length ?? 0
              const offerCount = landlord.offerLetters?.length ?? 0
              return (
                <TableRow key={landlord.id}>
                  <TableCell className="min-w-60 whitespace-normal"><ContactDetails landlord={landlord} /></TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {landlord.idNumber || <span className="text-muted-foreground">Not provided</span>}
                  </TableCell>
                  <TableCell><CountBadge count={propertyCount} singular="property" plural="properties" /></TableCell>
                  <TableCell className="hidden 2xl:table-cell"><CountBadge count={offerCount} singular="offer" plural="offers" /></TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{dateFormatter.format(new Date(landlord.createdAt))}</TableCell>
                  <TableCell className="min-w-[340px]"><LandlordActions landlord={landlord} onDelete={onDelete} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {landlords.map((landlord) => {
          const propertyCount = landlord.properties?.length ?? 0
          const offerCount = landlord.offerLetters?.length ?? 0
          return (
            <Card key={landlord.id}>
              <CardHeader className="pb-3">
                <ContactDetails landlord={landlord} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <CountBadge count={propertyCount} singular="property" plural="properties" />
                  <CountBadge count={offerCount} singular="offer" plural="offers" />
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">ID Number</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{landlord.idNumber || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{dateFormatter.format(new Date(landlord.createdAt))}</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter className="px-3 py-2">
                <LandlordActions landlord={landlord} onDelete={onDelete} />
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {landlords.length} landlord{landlords.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export function LandlordListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading landlords" aria-busy="true">
      <div className="rounded-md border border-border p-4">
        <Skeleton className="h-4 w-40" />
        <div className="mt-5 space-y-5">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="grid grid-cols-[minmax(0,1fr)_7rem] gap-6 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_7rem_12rem]">
              <div className="space-y-2"><Skeleton className="h-4 w-44 max-w-full" /><Skeleton className="h-3 w-64 max-w-full" /></div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="hidden h-8 w-44 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
