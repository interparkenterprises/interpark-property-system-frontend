'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, ShieldX, UserRoundPlus, UsersRound } from 'lucide-react'
import type { Lead } from '@/types'
import { leadsAPI } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { LeadList, LeadListSkeleton } from '@/components/leads/LeadList'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonStyles } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export default function LeadsPage() {
  const { user, userId } = useAuth()
  const {
    canViewLeads,
    canCreateLead,
    canDeleteLead,
    isAdmin,
    isManager,
    getAccessiblePropertyIds,
  } = useGlobalPermissions()

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingLead, setDeletingLead] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let data = await leadsAPI.getAll()

      if (isManager && userId) {
        data = data.filter((lead) => lead.createdById === userId)
      } else if (!isAdmin && !isManager) {
        const accessiblePropertyIds = getAccessiblePropertyIds()
        data = data.filter((lead) =>
          lead.propertyId ? accessiblePropertyIds.includes(lead.propertyId) : false,
        )
      }

      setLeads(data)
    } catch (fetchError) {
      console.error('Error fetching leads:', fetchError)
      setError(fetchError instanceof Error ? fetchError.message : 'Leads could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [getAccessiblePropertyIds, isAdmin, isManager, userId])

  useEffect(() => {
    if (!user || !canViewLeads) return

    const frame = window.requestAnimationFrame(() => void fetchLeads())
    return () => window.cancelAnimationFrame(frame)
  }, [canViewLeads, fetchLeads, user])

  const handleDelete = async (id: string) => {
    if (!canDeleteLead) {
      window.alert("You don't have permission to delete leads.")
      return
    }

    if (!window.confirm('Are you sure you want to delete this lead?')) return

    try {
      setDeletingLead(id)
      await leadsAPI.delete(id)
      await fetchLeads()
    } catch (deleteError) {
      console.error('Error deleting lead:', deleteError)
    } finally {
      setDeletingLead(null)
    }
  }

  if (!canViewLeads) {
    return (
      <EmptyState
        icon={ShieldX}
        title="Access Denied"
        description="You don't have permission to view leads. Please contact an administrator."
        className="min-h-64"
      />
    )
  }

  const description = isAdmin
    ? 'Manage all leads.'
    : isManager
      ? 'Manage the leads you created.'
      : 'View leads for your assigned properties.'

  const emptyDescription = isAdmin
    ? 'No leads are available yet.'
    : isManager
      ? "You haven't created any leads yet."
      : 'No leads were found for your assigned properties.'

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title="Leads"
        description={description}
        actions={
          canCreateLead ? (
            <PermissionGuard module="leads" action="create">
              <Link href="/leads/create" className={buttonStyles({ size: 'sm' })}>
                <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
                Add Lead
              </Link>
            </PermissionGuard>
          ) : undefined
        }
      />

      {loading ? (
        <LeadListSkeleton />
      ) : error ? (
        <Alert variant="destructive" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AlertTitle>Unable to load leads</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchLeads()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </Alert>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No leads found"
          description={emptyDescription}
          action={
            canCreateLead ? (
              <PermissionGuard module="leads" action="create">
                <Link href="/leads/create" className={buttonStyles({ size: 'sm' })}>
                  <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
                  Add Lead
                </Link>
              </PermissionGuard>
            ) : undefined
          }
        />
      ) : (
        <LeadList
          leads={leads}
          isAdmin={isAdmin}
          deletingLead={deletingLead}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
