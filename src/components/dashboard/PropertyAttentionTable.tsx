import Link from 'next/link'
import { Building2 } from 'lucide-react'
import type { PropertyRevenue } from '@/types/analytics'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface PropertyAttentionTableProps {
  data: PropertyRevenue[]
  authorized: boolean
  loading: boolean
  error: string | null
}

export function PropertyAttentionTable({ data, authorized, loading, error }: PropertyAttentionTableProps) {
  if (!authorized) return null

  const ranked = [...data].sort((left, right) => right.outstanding - left.outstanding).slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Properties requiring attention</CardTitle>
        <CardDescription>Properties ranked by outstanding rent within the selected period.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive"><AlertTitle>Property performance unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
        ) : loading ? (
          <Skeleton className="h-64 w-full" />
        ) : ranked.length === 0 ? (
          <EmptyState icon={Building2} title="No property balances found" description="Property-level collection performance will appear when invoices exist in this period." />
        ) : (
          <Table>
            <TableHead>
              <TableHeader>Property</TableHeader>
              <TableHeader className="text-right">Billed</TableHeader>
              <TableHeader className="text-right">Outstanding</TableHeader>
              <TableHeader className="text-right">Collection rate</TableHeader>
            </TableHead>
            <TableBody>
              {ranked.map(property => (
                <TableRow key={property.propertyId}>
                  <TableCell className="font-medium">
                    <Link href={`/properties/${property.propertyId}`} className="text-primary hover:underline">{property.propertyName}</Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums" title={formatExactKes(property.billed)}>{formatCompactKes(property.billed)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums" title={formatExactKes(property.outstanding)}>{formatCompactKes(property.outstanding)}</TableCell>
                  <TableCell className="text-right">{property.collectionRate == null ? '—' : `${property.collectionRate.toFixed(1)}%`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
