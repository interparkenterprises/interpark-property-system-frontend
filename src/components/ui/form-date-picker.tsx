'use client'

import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { Button } from './button'
import { Calendar, isISOCalendarDate, startOfCalendarMonth, todayCalendarDate } from './calendar'
import { Label } from './label'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

export function normalizeFormDateValue(value?: string | null) {
  const calendarPart = value?.trim().slice(0, 10) ?? ''
  return isISOCalendarDate(calendarPart) ? calendarPart : ''
}

export function formatFormDate(value: string, locale = 'en-GB') {
  const normalized = normalizeFormDateValue(value)
  if (!normalized) return ''
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${normalized}T00:00:00Z`))
}

export interface FormDatePickerProps {
  value?: string
  onChange: (value: string) => void
  label: string
  id?: string
  min?: string
  max?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  error?: string
  helperText?: string
  className?: string
  locale?: string
  timeZone?: string
  formatValue?: (value: string) => string
}

export function FormDatePicker({
  value,
  onChange,
  label,
  id,
  min,
  max,
  disabled,
  required,
  placeholder = 'Select a date',
  error,
  helperText,
  className,
  locale = 'en-GB',
  timeZone,
  formatValue,
}: FormDatePickerProps) {
  const generatedId = React.useId()
  const triggerId = id ?? generatedId
  const messageId = `${triggerId}-message`
  const normalizedValue = normalizeFormDateValue(value)
  const today = todayCalendarDate(timeZone)
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState(startOfCalendarMonth(normalizedValue || today))

  const displayValue = normalizedValue
    ? (formatValue ? formatValue(normalizedValue) : formatFormDate(normalizedValue, locale))
    : placeholder

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      <Label htmlFor={triggerId} required={required}>{label}</Label>
      <Popover open={open} onOpenChange={(nextOpen) => {
        if (nextOpen) setMonth(startOfCalendarMonth(normalizedValue || today))
        setOpen(nextOpen)
      }}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-required={required || undefined}
            aria-describedby={error || helperText ? messageId : undefined}
            className={cn(
              'w-full justify-start px-3 text-left font-normal',
              !normalizedValue && 'text-muted-foreground',
              error && 'border-destructive focus-visible:ring-destructive/20',
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{displayValue}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={12} className="w-[min(20rem,calc(100vw-2rem))] p-0">
          <Calendar
            selected={normalizedValue || undefined}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              onChange(date)
              setOpen(false)
            }}
            min={normalizeFormDateValue(min) || undefined}
            max={normalizeFormDateValue(max) || undefined}
            disabled={disabled}
            today={today}
          />
        </PopoverContent>
      </Popover>
      {(error || helperText) && <p id={messageId} className={cn('text-xs text-muted-foreground', error && 'text-destructive')}>{error || helperText}</p>}
    </div>
  )
}
