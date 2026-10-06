'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, CirclePlus, RefreshCw, UserRoundPlus, UsersRound } from 'lucide-react'
import type { Landlord } from '@/types'
import { landlordsAPI } from '@/lib/api'
import { LandlordList, LandlordListSkeleton } from '@/components/landlords/LandlordList'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonStyles } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export default function LandlordsPage() {
  const [landlords, setLandlords] = useState<Landlord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLandlords = useCallback(async () => {
    setError(null)
    try {
      const data = await landlordsAPI.getAll()
      setLandlords(data)
    } catch (fetchError) {
      console.error('Error fetching landlords:', fetchError)
      setError('Landlords could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void fetchLandlords())
    return () => window.cancelAnimationFrame(frame)
  }, [fetchLandlords])

  const retryFetch = () => {
    setLoading(true)
    void fetchLandlords()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this landlord?')) return

    try {
      await landlordsAPI.delete(id)
      await fetchLandlords()
    } catch (deleteError) {
      console.error('Error deleting landlord:', deleteError)
    }
  }

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title="Landlords"
        description="Manage and track property landlords."
        actions={
          <>
            <Link href="/landlords/create-with-property" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Create Landlord with Property
            </Link>
            <Link href="/landlords/create" className={buttonStyles({ size: 'sm' })}>
              <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
              Add Landlord
            </Link>
          </>
        }
      />

      {loading ? (
        <LandlordListSkeleton />
      ) : error ? (
        <Alert variant="destructive" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AlertTitle>Unable to load landlords</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button variant="outline" size="sm" onClick={retryFetch}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </Alert>
      ) : landlords.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No landlords found"
          description="Get started by creating your first landlord."
          action={
            <Link href="/landlords/create" className={buttonStyles({ size: 'sm' })}>
              <CirclePlus className="h-4 w-4" aria-hidden="true" />
              Create Your First Landlord
            </Link>
          }
        />
      ) : (
        <LandlordList landlords={landlords} onDelete={handleDelete} />
      )}
    </div>
  )
}
