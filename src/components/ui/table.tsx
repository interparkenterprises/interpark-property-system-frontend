import * as React from 'react'
import { cn } from '@/lib/utils'

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-md border border-border">
      <table ref={ref} className={cn('w-full min-w-160 caption-bottom text-sm', className)} {...props} />
    </div>
  ),
)
Table.displayName = 'Table'

export const TableHead = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ children, className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-muted/60 [&_tr]:border-b', className)} {...props}>
      <tr>{children}</tr>
    </thead>
  ),
)
TableHead.displayName = 'TableHead'

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />,
)
TableBody.displayName = 'TableBody'

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => <tr ref={ref} className={cn('border-b border-border transition-colors hover:bg-muted/40', className)} {...props} />,
)
TableRow.displayName = 'TableRow'

export const TableHeader = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => <th ref={ref} className={cn('h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground', className)} {...props} />,
)
TableHeader.displayName = 'TableHeader'

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => <td ref={ref} className={cn('whitespace-nowrap px-4 py-3 align-middle text-foreground', className)} {...props} />,
)
TableCell.displayName = 'TableCell'

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => <caption ref={ref} className={cn('mt-3 text-sm text-muted-foreground', className)} {...props} />,
)
TableCaption.displayName = 'TableCaption'
