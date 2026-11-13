'use client'

import { FileSpreadsheet } from 'lucide-react'
import type { ExportSection } from '@/lib/excelGenerator'
import type { Property } from '@/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getPropertyStatementSectionAvailability } from '../utils/propertyStatementExport'

interface PropertyStatementExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property
  sections: ExportSection[]
  allSectionsSelected: boolean
  onToggleAll: () => void
  onToggleSection: (sectionId: string) => void
  exporting: boolean
  onCancel: () => void
  onExport: () => Promise<void>
}

export function PropertyStatementExportDialog({
  open,
  onOpenChange,
  property,
  sections,
  allSectionsSelected,
  onToggleAll,
  onToggleSection,
  exporting,
  onCancel,
  onExport,
}: PropertyStatementExportDialogProps) {
  const availableSections = sections.filter((section) => getPropertyStatementSectionAvailability(section.id, property).available)
  const selectedSectionCount = availableSections.filter((section) => section.selected).length

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!exporting) onOpenChange(nextOpen) }}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Export Property Collection Statement</DialogTitle>
          <DialogDescription>Choose the sections to include in your Excel workbook.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60dvh] space-y-4 overflow-y-auto px-5 py-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-muted/25 px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50">
            <Checkbox checked={allSectionsSelected} onChange={onToggleAll} disabled={exporting || availableSections.length === 0} />
            <span>Select All Sections</span>
          </label>

          <div className="space-y-2">
            {sections.map((section) => {
              const { available, itemCount } = getPropertyStatementSectionAvailability(section.id, property)
              return (
                <label
                  key={section.id}
                  className={`flex items-center gap-3 rounded-md border px-3 py-3 transition-colors ${
                    section.selected && available ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
                  } ${available ? 'cursor-pointer hover:bg-muted/30' : 'cursor-not-allowed opacity-60'}`}
                >
                  <Checkbox
                    checked={available && section.selected}
                    onChange={() => available && onToggleSection(section.id)}
                    disabled={!available || exporting}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{section.label}</span>
                    {!available && <span className="mt-0.5 block text-xs text-muted-foreground">No data available</span>}
                    {available && itemCount > 0 && <span className="mt-0.5 block text-xs text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{selectedSectionCount}</span> of {availableSections.length} available sections selected</p>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button type="button" onClick={onCancel} variant="outline" disabled={exporting}>Cancel</Button>
            <Button type="button" onClick={() => void onExport()} disabled={selectedSectionCount === 0} loading={exporting}>
              {!exporting && <FileSpreadsheet className="size-4" aria-hidden="true" />}
              {exporting ? 'Exporting…' : 'Export to Excel'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
