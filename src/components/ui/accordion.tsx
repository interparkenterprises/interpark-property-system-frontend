'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionContextValue {
  value: string[]
  multiple: boolean
  toggleItem: (value: string) => void
}

interface AccordionItemContextValue {
  contentId: string
  disabled: boolean
  open: boolean
  triggerId: string
  toggle: () => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)
const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null)

function useAccordionContext(component: string) {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error(`${component} must be used inside Accordion`)
  return context
}

function useAccordionItemContext(component: string) {
  const context = React.useContext(AccordionItemContext)
  if (!context) throw new Error(`${component} must be used inside AccordionItem`)
  return context
}

export interface AccordionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  multiple?: boolean
}

export function Accordion({
  value: controlledValue,
  defaultValue = [],
  onValueChange,
  multiple = false,
  className,
  children,
  ...props
}: AccordionProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = controlledValue ?? uncontrolledValue

  const toggleItem = React.useCallback((itemValue: string) => {
    const nextValue = value.includes(itemValue)
      ? value.filter((entry) => entry !== itemValue)
      : multiple
        ? [...value, itemValue]
        : [itemValue]

    if (controlledValue === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }, [controlledValue, multiple, onValueChange, value])

  const context = React.useMemo(
    () => ({ value, multiple, toggleItem }),
    [multiple, toggleItem, value],
  )

  return (
    <AccordionContext.Provider value={context}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value: itemValue, disabled = false, className, children, ...props }, ref) => {
    const { value, toggleItem } = useAccordionContext('AccordionItem')
    const itemId = React.useId()
    const open = value.includes(itemValue)
    const triggerId = `${itemId}-trigger`
    const contentId = `${itemId}-content`

    const context = React.useMemo(
      () => ({
        contentId,
        disabled,
        open,
        triggerId,
        toggle: () => toggleItem(itemValue),
      }),
      [contentId, disabled, itemValue, open, toggleItem, triggerId],
    )

    return (
      <AccordionItemContext.Provider value={context}>
        <div
          ref={ref}
          data-state={open ? 'open' : 'closed'}
          data-disabled={disabled ? '' : undefined}
          className={cn('border-b border-border last:border-b-0', className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    )
  },
)
AccordionItem.displayName = 'AccordionItem'

export type AccordionTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { contentId, disabled, open, triggerId, toggle } = useAccordionItemContext('AccordionTrigger')

    return (
      <h3 className="flex">
        <button
          ref={ref}
          type="button"
          id={triggerId}
          aria-controls={contentId}
          aria-expanded={open}
          data-state={open ? 'open' : 'closed'}
          disabled={disabled}
          className={cn(
            'flex min-w-0 flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium outline-none transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
            className,
          )}
          onClick={(event) => {
            toggle()
            onClick?.(event)
          }}
          {...props}
        >
          <span className="min-w-0 flex-1">{children}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </button>
      </h3>
    )
  },
)
AccordionTrigger.displayName = 'AccordionTrigger'

export type AccordionContentProps = React.HTMLAttributes<HTMLDivElement>

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { contentId, open, triggerId } = useAccordionItemContext('AccordionContent')

    return (
      <div
        ref={ref}
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        data-state={open ? 'open' : 'closed'}
        hidden={!open}
        className={cn('pb-4 text-sm text-muted-foreground', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
AccordionContent.displayName = 'AccordionContent'
