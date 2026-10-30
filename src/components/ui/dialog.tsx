'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogContextValue {
  close: () => void
  titleId: string
  descriptionId: string
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const titleId = React.useId()
  const descriptionId = React.useId()

  React.useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <DialogContext.Provider value={{ close: () => onOpenChange(false), titleId, descriptionId }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          className="absolute inset-0 cursor-default bg-black/55"
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
          tabIndex={-1}
        />
        <div className="relative z-10 w-full">{children}</div>
      </div>
    </DialogContext.Provider>,
    document.body,
  )
}

export const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, forwardedRef) => {
    const context = React.useContext(DialogContext)
    const localRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement)

    React.useEffect(() => {
      localRef.current?.focus()
    }, [])

    return (
      <div
        ref={localRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={context?.titleId}
        aria-describedby={context?.descriptionId}
        tabIndex={-1}
        className={cn('relative mx-auto w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-lg border border-border bg-card text-card-foreground shadow-lg outline-none', className)}
        {...props}
      >
        {children}
        <button
          type="button"
          onClick={context?.close}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  },
)
DialogContent.displayName = 'DialogContent'

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1.5 border-b border-border px-5 py-4 pr-12', className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const context = React.useContext(DialogContext)
  return <h2 id={context?.titleId} className={cn('text-lg font-semibold leading-none', className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const context = React.useContext(DialogContext)
  return <p id={context?.descriptionId} className={cn('text-sm leading-5 text-muted-foreground', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse gap-2 border-t border-border bg-muted/35 px-5 py-4 sm:flex-row sm:justify-end', className)} {...props} />
}
