import { RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

interface DashboardHeaderProps {
  userName?: string
  roleName?: string | null
  isAdmin: boolean
  isManager: boolean
  assignedPropertyCount: number
  generatedAt: string | null
  showAdminPanel: boolean
  isRefreshingPermissions: boolean
  isRefreshingData: boolean
  filters: React.ReactNode
  onToggleAdminPanel: () => void
  onRefreshData: () => void
  onRefreshPermissions: () => void
}

export function DashboardHeader({
  userName,
  roleName,
  isAdmin,
  isManager,
  assignedPropertyCount,
  generatedAt,
  showAdminPanel,
  isRefreshingPermissions,
  isRefreshingData,
  filters,
  onToggleAdminPanel,
  onRefreshData,
  onRefreshPermissions,
}: DashboardHeaderProps) {
  const refreshedLabel = generatedAt
    ? `Data updated ${new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(generatedAt))}`
    : 'Live portfolio overview'

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back${userName ? `, ${userName}` : ''}. ${refreshedLabel}.`}
        leading={<div className="rounded-lg bg-primary/10 p-2 text-primary"><ShieldCheck className="h-5 w-5" /></div>}
        actions={(
          <>
            {filters}
            {isAdmin && (
              <Button size="icon" variant={showAdminPanel ? 'secondary' : 'outline'} onClick={onToggleAdminPanel} aria-label={showAdminPanel ? 'Hide user management' : 'Manage users'} title={showAdminPanel ? 'Hide user management' : 'Manage users'}>
                <Users className="h-4 w-4" />
              </Button>
            )}
            {(isManager || !isAdmin) && (
              <Button variant="outline" loading={isRefreshingPermissions} onClick={onRefreshPermissions}>
                <RefreshCw className="h-4 w-4" />
                Refresh permissions
              </Button>
            )}
            <Button size="icon" loading={isRefreshingData} disabled={isRefreshingData} onClick={onRefreshData} aria-label="Refresh dashboard data" title="Refresh dashboard data">
              {!isRefreshingData && <RefreshCw className="h-4 w-4" />}
            </Button>
          </>
        )}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary">{roleName || 'User'}</Badge>
        {!isAdmin && <Badge variant="outline">{assignedPropertyCount} assigned properties</Badge>}
      </div>
    </div>
  )
}
