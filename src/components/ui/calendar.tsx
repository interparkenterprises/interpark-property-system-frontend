'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { cn } from '@/lib/utils'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function isISOCalendarDate(value?: string | null): value is string {
  if (!value || !ISO_DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day
}

export function calendarDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function calendarDateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

export function startOfCalendarMonth(value: string) {
  const { year, month } = calendarDateParts(value)
  return calendarDate(year, month, 1)
}

export function shiftCalendarDate(value: string, days: number) {
  const { year, month, day } = calendarDateParts(value)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return calendarDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

export function shiftCalendarMonth(value: string, months: number) {
  const { year, month, day } = calendarDateParts(value)
  const firstOfTarget = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDay = new Date(Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0)).getUTCDate()
  return calendarDate(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, Math.min(day, lastDay))
}

export function todayCalendarDate(timeZone?: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(new Date())
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${read('year')}-${read('month')}-${read('day')}`
}

export interface CalendarProps {
  selected?: string
  month: string
  onMonthChange: (month: string) => void
  onSelect: (date: string) => void
  min?: string
  max?: string
  disabled?: boolean
  today?: string
  showToday?: boolean
  className?: string
  'aria-label'?: string
}

function isOutsideRange(value: string, min?: string, max?: string) {
  return Boolean((min && value < min) || (max && value > max))
}

export function Calendar({
  selected,
  month,
  onMonthChange,
  onSelect,
  min,
  max,
  disabled,
  today = todayCalendarDate(),
  showToday = true,
  className,
  'aria-label': ariaLabel = 'Choose a date',
}: CalendarProps) {
  const safeMonth = isISOCalendarDate(month) ? startOfCalendarMonth(month) : startOfCalendarMonth(today)
  const { year, month: monthNumber } = calendarDateParts(safeMonth)
  const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7
  const gridStart = shiftCalendarDate(safeMonth, -firstWeekday)
  const dates = Array.from({ length: 42 }, (_, index) => shiftCalendarDate(gridStart, index))
  const currentYear = calendarDateParts(today).year
  const selectedYear = selected && isISOCalendarDate(selected) ? calendarDateParts(selected).year : currentYear
  const minimumYear = min && isISOCalendarDate(min) ? calendarDateParts(min).year : Math.min(currentYear, selectedYear) - 100
  const maximumYear = max && isISOCalendarDate(max) ? calendarDateParts(max).year : Math.max(currentYear, selectedYear) + 50
  const years = Array.from({ length: maximumYear - minimumYear + 1 }, (_, index) => minimumYear + index)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const focusDate = React.useCallback((value: string) => {
    onMonthChange(startOfCalendarMonth(value))
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLButtonElement>(`[data-date="${value}"]`)?.focus())
  }, [onMonthChange])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, value: string) => {
    const movements: Record<string, string> = {
      ArrowLeft: shiftCalendarDate(value, -1),
      ArrowRight: shiftCalendarDate(value, 1),
      ArrowUp: shiftCalendarDate(value, -7),
      ArrowDown: shiftCalendarDate(value, 7),
      Home: shiftCalendarDate(value, -(new Date(`${value}T00:00:00Z`).getUTCDay() + 6) % 7),
      End: shiftCalendarDate(value, 6 - ((new Date(`${value}T00:00:00Z`).getUTCDay() + 6) % 7)),
      PageUp: shiftCalendarMonth(value, -1),
      PageDown: shiftCalendarMonth(value, 1),
    }
    const next = movements[event.key]
    if (!next) return
    event.preventDefault()
    if (!isOutsideRange(next, min, max)) focusDate(next)
  }

  const setMonthPart = (nextMonth: number) => onMonthChange(calendarDate(year, nextMonth, 1))
  const setYearPart = (nextYear: number) => onMonthChange(calendarDate(nextYear, monthNumber, 1))
  const previousMonth = shiftCalendarMonth(safeMonth, -1)
  const nextMonth = shiftCalendarMonth(safeMonth, 1)
  const previousDisabled = disabled || Boolean(min && shiftCalendarMonth(startOfCalendarMonth(min), 0) > previousMonth)
  const nextDisabled = disabled || Boolean(max && startOfCalendarMonth(max) < nextMonth)

  return (
    <div ref={rootRef} className={cn('w-full select-none p-3', className)}>
      <div className="mb-3 flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="Previous month" disabled={previousDisabled} onClick={() => onMonthChange(startOfCalendarMonth(previousMonth))}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_5.5rem] gap-1">
          <Select value={String(monthNumber)} onValueChange={(value) => setMonthPart(Number(value))} disabled={disabled}>
            <SelectTrigger aria-label="Calendar month" className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(value) => setYearPart(Number(value))} disabled={disabled}>
            <SelectTrigger aria-label="Calendar year" className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Next month" disabled={nextDisabled} onClick={() => onMonthChange(startOfCalendarMonth(nextMonth))}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div role="grid" aria-label={ariaLabel} className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => <div key={weekday} role="columnheader" aria-label={weekday} className="flex h-7 items-center justify-center text-xs font-medium text-muted-foreground">{weekday}</div>)}
        {dates.map((date) => {
          const dateParts = calendarDateParts(date)
          const outsideMonth = dateParts.month !== monthNumber
          const unavailable = disabled || isOutsideRange(date, min, max)
          const isSelected = date === selected
          const isToday = date === today
          return (
            <Button
              key={date}
              type="button"
              variant={isSelected ? 'default' : 'ghost'}
              size="icon"
              role="gridcell"
              data-date={date}
              disabled={unavailable}
              aria-label={new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}
              aria-selected={isSelected}
              tabIndex={isSelected || (!selected && isToday) ? 0 : -1}
              className={cn('h-8 w-full min-w-8 rounded-sm p-0 text-xs font-normal', outsideMonth && 'text-muted-foreground/55', isToday && !isSelected && 'border border-primary text-primary')}
              onClick={() => onSelect(date)}
              onKeyDown={(event) => handleKeyDown(event, date)}
            >
              {dateParts.day}
            </Button>
          )
        })}
      </div>

      {showToday && (
        <div className="mt-3 border-t border-border pt-3">
          <Button type="button" variant="ghost" size="sm" className="w-full" disabled={disabled || isOutsideRange(today, min, max)} onClick={() => onSelect(today)}>
            Today
          </Button>
        </div>
      )}
    </div>
  )
}
