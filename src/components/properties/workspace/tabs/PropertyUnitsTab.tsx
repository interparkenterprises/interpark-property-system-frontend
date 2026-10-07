'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Unit } from '@/types'
import { unitsAPI } from '@/lib/api'
import UnitForm from '@/components/forms/UnitForm'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'

interface PropertyUnitsTabProps {
  propertyId: string
  units: Unit[]
  onPropertyChanged: () => Promise<void> | void
}

export function PropertyUnitsTab({ propertyId, units, onPropertyChanged }: PropertyUnitsTabProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null)

  const closeForm = () => {
    setShowForm(false)
    setEditingUnit(null)
  }

  const handleSuccess = async () => {
    closeForm()
    await onPropertyChanged()
  }

  const handleDelete = async (unitId: string) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return
    setDeletingUnitId(unitId)
    try {
      await unitsAPI.delete(unitId)
      await onPropertyChanged()
    } catch (error) {
      console.error('Error deleting unit:', error)
    } finally {
      setDeletingUnitId(null)
    }
  }

  if (showForm) {
    return (
      <PermissionGuard module="units" action={editingUnit ? 'edit' : 'create'}>
        <Card>
          <CardHeader className="border-b border-border">
            <SectionHeader
              title={editingUnit ? 'Edit Unit' : 'Add New Unit'}
              description={editingUnit ? 'Update unit information.' : 'Create a new unit for this property.'}
              actions={<Button variant="outline" onClick={closeForm}>Cancel</Button>}
            />
          </CardHeader>
          <CardContent className="pt-5">
            <UnitForm unit={editingUnit ?? undefined} onSuccess={handleSuccess} onCancel={closeForm} defaultPropertyId={propertyId} />
          </CardContent>
        </Card>
      </PermissionGuard>
    )
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Property Units"
        description="Manage residential and commercial units attached to this property."
        actions={
          <PermissionGuard module="units" action="create">
            <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Add Unit</Button>
          </PermissionGuard>
        }
      />
      {units.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No units yet"
          description="Start by adding a unit to this property."
          action={<PermissionGuard module="units" action="create"><Button onClick={() => setShowForm(true)}>Add Your First Unit</Button></PermissionGuard>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {units.map((unit) => (
            <Card key={unit.id}>
              <CardHeader className="flex-row items-start justify-between border-b border-border">
                <div>
                  <h3 className="font-semibold text-foreground">{unit.unitNo ? `Unit ${unit.unitNo}` : unit.type || 'Unit'}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{unit.floor || `ID: ${unit.id.slice(0, 8)}`}</p>
                </div>
                <Badge variant={unit.status === 'VACANT' ? 'success' : 'info'}>{unit.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <UnitDetail label="Type" value={unit.unitType.replaceAll('_', ' ')} />
                  <UnitDetail label="Size" value={`${unit.sizeSqFt.toLocaleString()} sq ft`} />
                  {unit.unitType === 'RESIDENTIAL' ? (
                    <UnitDetail label="Rooms" value={`${unit.bedrooms ?? 0} bed · ${unit.bathrooms ?? 0} bath`} />
                  ) : (
                    <UnitDetail label="Usage" value={unit.usage || 'N/A'} />
                  )}
                  <UnitDetail label="Rent" value={`Ksh ${unit.rentAmount.toLocaleString()} / ${unit.rentType.toLowerCase()}`} />
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <PermissionGuard module="units" action="edit">
                    <Button size="sm" variant="outline" onClick={() => { setEditingUnit(unit); setShowForm(true) }}><Pencil className="h-4 w-4" />Edit</Button>
                  </PermissionGuard>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/properties/${unit.id}/unit-details`)}><Eye className="h-4 w-4" />View Details</Button>
                  <PermissionGuard module="units" action="delete">
                    <Button size="sm" variant="outline" className="text-destructive" loading={deletingUnitId === unit.id} onClick={() => handleDelete(unit.id)}><Trash2 className="h-4 w-4" />Delete</Button>
                  </PermissionGuard>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function UnitDetail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-foreground">{value}</p></div>
}
