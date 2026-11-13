'use client'

import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cn } from '@/lib/utils'

export type ToggleVariant = 'default' | 'outline'
export type ToggleSize = 'sm' | 'default' | 'lg'

export function toggleStyles({ variant = 'default', size = 'default', className }: { variant?: ToggleVariant; size?: ToggleSize; className?: string } = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary/12 data-[state=on]:text-primary data-[state=on]:shadow-xs [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4',
    variant === 'outline' && 'border border-border bg-background shadow-xs hover:bg-muted',
    size === 'sm' && 'h-8 min-w-8 px-2',
    size === 'default' && 'h-9 min-w-9 px-2.5',
    size === 'lg' && 'h-10 min-w-10 px-3',
    className,
  )
}

export const Toggle = React.forwardRef<React.ElementRef<typeof TogglePrimitive.Root>, React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & { variant?: ToggleVariant; size?: ToggleSize }>(
  ({ className, variant, size, ...props }, ref) => <TogglePrimitive.Root ref={ref} className={toggleStyles({ variant, size, className })} {...props} />,
)
Toggle.displayName = TogglePrimitive.Root.displayName
