'use client'

import { motion } from 'framer-motion'
import type { ExportSection } from '@/lib/excelGenerator'
import type { Property } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  const selectedSectionCount = sections.filter((section) => section.selected).length

  return (
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Export Property Collection Statement</DialogTitle>
      <DialogDescription>Select the sections to include in the spreadsheet.</DialogDescription>
    </DialogHeader>

        {/* Modal Body */}
        <div className="max-h-[65dvh] overflow-y-auto p-5">
          {/* Select All Option */}
          <div className="mb-6 pb-4 border-b-2 border-border">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={allSectionsSelected}
                  onChange={onToggleAll}
                  className="w-6 h-6 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                />
                {allSectionsSelected && (
                  <svg
                    className="absolute top-1 left-1 w-4 h-4 text-white pointer-events-none"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Select All Sections
              </span>
            </label>
          </div>

          {/* Individual Sections */}
          <div className="space-y-3">
            {sections.map((section) => {
              // Check if section has data
              let hasData = true;
              let itemCount = 0;

              if (section.id === 'unitsAndTenants') {
                hasData = (property.units?.length || 0) > 0;
                itemCount = property.units?.length || 0;
              } else if (section.id === 'incomeRecords') {
                hasData = (property.incomes?.length || 0) > 0;
                itemCount = property.incomes?.length || 0;
              } else if (section.id === 'commissionRecords') {
                hasData = (property.commissions?.length || 0) > 0;
                itemCount = property.commissions?.length || 0;
              } else if (section.id === 'serviceProviders') {
                hasData = (property.serviceProviders?.length || 0) > 0;
                itemCount = property.serviceProviders?.length || 0;
              }

              return (
                <motion.label
                  key={section.id}
                  whileHover={{ x: 4 }}
                  className={`flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    section.selected
                      ? 'bg-primary/5 border-primary'
                      : 'bg-muted/50 border-border hover:border-border'
                  } ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={section.selected}
                        onChange={() => hasData && onToggleSection(section.id)}
                        disabled={!hasData}
                        className="w-5 h-5 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer disabled:cursor-not-allowed"
                      />
                      {section.selected && (
                        <svg
                          className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <span
                        className={`font-semibold ${
                          section.selected ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {section.label}
                      </span>
                      {!hasData && (
                        <p className="text-xs text-muted-foreground mt-0.5">No data available</p>
                      )}
                      {hasData && itemCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </p>
                      )}
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-colors ${
                      section.selected ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.label>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {selectedSectionCount}
            </span>{' '}
            of {sections.length} sections selected
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={onExport}
              disabled={selectedSectionCount === 0 || exporting}
            >
              <span className="flex items-center gap-2">
                {exporting ? (
                  <>
                    <motion.svg
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </motion.svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export to Excel
                  </>
                )}
              </span>
            </Button>
          </div>
        </DialogFooter>
  </DialogContent>
</Dialog>
  )
}
