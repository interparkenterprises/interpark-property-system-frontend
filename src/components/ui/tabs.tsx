'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type TabsOrientation = 'horizontal' | 'vertical'
type TabsListVariant = 'default' | 'line'

interface TabsContextValue {
  baseId: string
  orientation: TabsOrientation
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)
const TabsListVariantContext = React.createContext<TabsListVariant>('default')

function useTabsContext(component: string) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error(`${component} must be used inside Tabs`)
  return context
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: TabsOrientation
}

export function Tabs({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  orientation = 'horizontal',
  className,
  children,
  ...props
}: TabsProps) {
  const baseId = React.useId()
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = controlledValue ?? uncontrolledValue

  const setValue = React.useCallback((nextValue: string) => {
    if (controlledValue === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }, [controlledValue, onValueChange])

  const context = React.useMemo(
    () => ({ baseId, orientation, value, setValue }),
    [baseId, orientation, setValue, value],
  )

  return (
    <TabsContext.Provider value={context}>
      <div
        data-orientation={orientation}
        className={cn(
          'flex w-full gap-2 data-[orientation=horizontal]:flex-col',
          orientation === 'vertical' && 'flex-row items-start',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TabsListVariant
}

export function TabsList({ variant = 'default', className, onKeyDown, children, ...props }: TabsListProps) {
  const { orientation } = useTabsContext('TabsList')

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
    const previousKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
    if (![nextKey, previousKey, 'Home', 'End'].includes(event.key)) return

    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'))
    const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (tabs.length === 0) return

    event.preventDefault()
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : event.key === nextKey
          ? (currentIndex + 1 + tabs.length) % tabs.length
          : (currentIndex - 1 + tabs.length) % tabs.length

    tabs[nextIndex]?.focus()
    tabs[nextIndex]?.click()
  }

  return (
    <TabsListVariantContext.Provider value={variant}>
      <div
        role="tablist"
        aria-orientation={orientation}
        data-orientation={orientation}
        data-variant={variant}
        className={cn(
          'inline-flex h-9 w-fit max-w-full shrink-0 items-center justify-start overflow-x-auto text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          orientation === 'vertical' && 'h-auto w-fit flex-col items-stretch overflow-visible',
          variant === 'default' && 'rounded-lg bg-muted p-[3px]',
          variant === 'line' && 'justify-start gap-1 border-b border-border bg-transparent p-0',
          variant === 'line' && orientation === 'vertical' && 'border-b-0 border-l',
          className,
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    </TabsListVariantContext.Provider>
  )
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className, onClick, ...props }, ref) => {
    const { baseId, orientation, value: activeValue, setValue } = useTabsContext('TabsTrigger')
    const variant = React.useContext(TabsListVariantContext)
    const active = activeValue === value

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${baseId}-trigger-${value}`}
        aria-controls={`${baseId}-content-${value}`}
        aria-selected={active}
        data-state={active ? 'active' : 'inactive'}
        data-orientation={orientation}
        tabIndex={active ? 0 : -1}
        className={cn(
          'relative inline-flex h-[calc(100%-1px)] min-h-8 flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border border-transparent px-2.5 py-1 text-sm font-medium text-muted-foreground outline-none transition-[color,box-shadow,background-color] hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs',
          variant === 'line' && 'rounded-none bg-transparent shadow-none after:absolute after:bg-transparent after:transition-colors data-[state=active]:text-foreground data-[state=active]:after:bg-primary',
          variant === 'line' && orientation === 'horizontal' && 'after:inset-x-2 after:-bottom-px after:h-0.5',
          variant === 'line' && orientation === 'vertical' && 'after:inset-y-1 after:-left-px after:w-0.5',
          orientation === 'vertical' && 'w-full justify-start',
          className,
        )}
        onClick={(event) => {
          setValue(value)
          onClick?.(event)
        }}
        {...props}
      />
    )
  },
)
TabsTrigger.displayName = 'TabsTrigger'

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, ...props }, ref) => {
    const { baseId, value: activeValue } = useTabsContext('TabsContent')
    const active = activeValue === value

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`${baseId}-content-${value}`}
        aria-labelledby={`${baseId}-trigger-${value}`}
        data-state={active ? 'active' : 'inactive'}
        hidden={!active}
        tabIndex={0}
        className={cn('min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50', className)}
        {...props}
      />
    )
  },
)
TabsContent.displayName = 'TabsContent'
