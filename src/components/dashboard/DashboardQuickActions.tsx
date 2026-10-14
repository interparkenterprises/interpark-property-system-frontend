import Link from 'next/link'
import { Activity, Building2, FilePlus2, HandCoins } from 'lucide-react'
import { buttonStyles, Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardQuickActionsProps {
  canCreateProperty: boolean
  canCreateOffer: boolean
  canViewCommissions: boolean
}

export function DashboardQuickActions({ canCreateProperty, canCreateOffer, canViewCommissions }: DashboardQuickActionsProps) {
  const hasActions = canCreateProperty || canCreateOffer || canViewCommissions

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Common property and income tasks.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {canCreateProperty && (
            <Link href="/properties/create" className={buttonStyles()}><Building2 className="h-4 w-4" />Add property</Link>
          )}
          {canCreateOffer && (
            <Link href="/offers/create" className={buttonStyles({ variant: 'outline' })}><FilePlus2 className="h-4 w-4" />Create offer letter</Link>
          )}
          {canViewCommissions && (
            <Link href="/myIncome" className={buttonStyles({ variant: 'outline' })}><HandCoins className="h-4 w-4" />View my income</Link>
          )}
          {!hasActions && <p className="text-sm text-muted-foreground">No additional actions are available for your current role.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Portfolio events and updates will appear here when this feature is enabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled><Activity className="h-4 w-4" />Recent activity unavailable</Button>
        </CardContent>
      </Card>
    </div>
  )
}
