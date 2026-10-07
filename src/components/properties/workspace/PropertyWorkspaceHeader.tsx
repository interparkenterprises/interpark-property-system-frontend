'use client'

import { Building2, Expand, MapPin, Pencil, Trash2 } from 'lucide-react'
import type { Property } from '@/types'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PropertyWorkspaceHeaderProps {
  property: Property
  imageUrl: string | null
  imageLoading: boolean
  onImageOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

export function PropertyWorkspaceHeader({
  property,
  imageUrl,
  imageLoading,
  onImageOpen,
  onEdit,
  onDelete,
}: PropertyWorkspaceHeaderProps) {
  return (
    <header className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <button
          type="button"
          onClick={onImageOpen}
          disabled={!imageUrl}
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default sm:h-24 sm:w-24"
          aria-label={imageUrl ? `View image for ${property.name}` : 'No property image available'}
        >
          {imageLoading ? (
            <div className="h-full w-full animate-pulse bg-muted" />
          ) : imageUrl ? (
            <>
              {/* Blob URLs from the property image endpoint cannot use the Next image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
            </>
          ) : (
            <Building2 className="h-8 w-8" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{property.name}</h1>
            {property.form && <Badge variant="secondary">{property.form.replaceAll('_', ' ')}</Badge>}
          </div>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{property.address}</span>
          </p>
          {property.lrNumber && <p className="mt-2 text-xs text-muted-foreground">LR No. {property.lrNumber}</p>}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <PermissionGuard module="properties" action="edit">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit Property
          </Button>
        </PermissionGuard>
        <PermissionGuard module="properties" action="delete">
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </PermissionGuard>
      </div>
    </header>
  )
}
