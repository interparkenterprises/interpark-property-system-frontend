'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface PropertyImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string | null
  propertyName: string
  propertyAddress: string
}

export function PropertyImageDialog({ open, onOpenChange, imageUrl, propertyName, propertyAddress }: PropertyImageDialogProps) {
  return (
    <Dialog open={open && Boolean(imageUrl)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{propertyName}</DialogTitle>
          <DialogDescription>{propertyAddress}</DialogDescription>
        </DialogHeader>
        {imageUrl && (
          <div className="flex max-h-[75dvh] items-center justify-center bg-muted/30 p-4">
            {/* Blob URLs from the property image endpoint cannot use the Next image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={propertyName} className="max-h-[70dvh] max-w-full object-contain" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
