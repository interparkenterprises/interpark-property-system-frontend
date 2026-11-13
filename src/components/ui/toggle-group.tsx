'use client'

import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cn } from '@/lib/utils'
import { toggleStyles, type ToggleSize, type ToggleVariant } from './toggle'

const ToggleGroupContext = React.createContext<{ variant: ToggleVariant; size: ToggleSize }>({ variant: 'default', size: 'default' })

type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
  variant?: ToggleVariant
  size?: ToggleSize
  spacing?: number
}

export const ToggleGroup = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Root>, ToggleGroupProps>(
  ({ className, variant = 'default', size = 'default', spacing = 0, children, style, ...props }, ref) => (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn('flex w-fit items-center', spacing === 0 && '[&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*+*]:-ml-px', className)}
      style={{ gap: spacing, ...style }}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  ),
)
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

export const ToggleGroupItem = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Item>, React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & { variant?: ToggleVariant; size?: ToggleSize }>(
  ({ className, variant, size, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext)
    return <ToggleGroupPrimitive.Item ref={ref} className={toggleStyles({ variant: variant ?? context.variant, size: size ?? context.size, className })} {...props} />
  },
)
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName
