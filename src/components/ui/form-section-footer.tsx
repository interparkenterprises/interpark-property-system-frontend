'use client'

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormActions } from '@/components/ui/form-actions'
import { cn } from '@/lib/utils'

interface FormSectionFooterProps<SectionId extends string> {
  sections: readonly SectionId[]
  activeSection: SectionId
  onSectionChange: (section: SectionId) => void
  onCancel?: () => void
  onSaveDraft?: () => void | Promise<void>
  finalAction: ReactNode
  cancelLabel?: string
  saveDraftLabel?: string
  backLabel?: string
  nextLabel?: string
  disabled?: boolean
  draftLoading?: boolean
  className?: string
}

export function FormSectionFooter<SectionId extends string>({
  sections,
  activeSection,
  onSectionChange,
  onCancel,
  onSaveDraft,
  finalAction,
  cancelLabel = 'Cancel',
  saveDraftLabel = 'Save Draft',
  backLabel = 'Back',
  nextLabel = 'Next',
  disabled = false,
  draftLoading = false,
  className,
}: FormSectionFooterProps<SectionId>) {
  const resolvedIndex = sections.indexOf(activeSection)
  const activeIndex = resolvedIndex >= 0 ? resolvedIndex : 0
  const previousSection = activeIndex > 0 ? sections[activeIndex - 1] : undefined
  const nextSection = activeIndex < sections.length - 1 ? sections[activeIndex + 1] : undefined
  const isFinalSection = sections.length > 0 && activeIndex === sections.length - 1

  return (
    <FormActions
      aria-label="Form section navigation"
      className={cn(
        'flex-col gap-3 rounded-lg border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5',
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
            {cancelLabel}
          </Button>
        )}
        {onSaveDraft && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onSaveDraft()}
            loading={draftLoading}
            disabled={disabled}
          >
            {!draftLoading && <Save className="h-4 w-4" aria-hidden="true" />}
            {saveDraftLabel}
          </Button>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {previousSection && (
          <Button type="button" variant="outline" onClick={() => onSectionChange(previousSection)} disabled={disabled}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Button>
        )}
        {nextSection && (
          <Button type="button" onClick={() => onSectionChange(nextSection)} disabled={disabled}>
            {nextLabel}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {isFinalSection && finalAction}
      </div>
    </FormActions>
  )
}
