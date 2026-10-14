'use client'

import * as React from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export interface DateRangeValue {
  from: string
  to: string
}

export interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  disabled?: boolean
  min?: string
  max?: string
  className?: string
  'aria-label'?: string
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
function parts(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

function dateString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function utcDate(value: string) {
  const { year, month, day } = parts(value)
  return new Date(Date.UTC(year, month - 1, day))
}

function shiftDays(value: string, amount: number) {
  const date = utcDate(value)
  date.setUTCDate(date.getUTCDate() + amount)
  return dateString(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

function shiftMonths(value: string, amount: number) {
  const { year, month } = parts(value)
  const date = new Date(Date.UTC(year, month - 1 + amount, 1))
  return dateString(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
}

function shiftMonthsSameDay(value: string, amount: number) {
  const { year, month, day } = parts(value)
  const target = new Date(Date.UTC(year, month - 1 + amount, 1))
  const targetMonth = dateString(target.getUTCFullYear(), target.getUTCMonth() + 1, 1)
  return dateString(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(day, daysInMonth(targetMonth)))
}

function monthStart(value: string) {
  const { year, month } = parts(value)
  return dateString(year, month, 1)
}

function daysInMonth(value: string) {
  const { year, month } = parts(value)
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function mondayIndex(value: string) {
  return (utcDate(value).getUTCDay() + 6) % 7
}

function todayInNairobi() {
  const dateParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const read = (type: Intl.DateTimeFormatPartTypes) => dateParts.find(part => part.type === type)?.value ?? ''
  return `${read('year')}-${read('month')}-${read('day')}`
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(utcDate(value))
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(utcDate(value))
}

function presetRanges(today: string): Array<{ label: string; value: DateRangeValue }> {
  const { year, month } = parts(today)
  const weekStart = shiftDays(today, -mondayIndex(today))
  const currentMonthStart = dateString(year, month, 1)
  const previousMonthStart = shiftMonths(currentMonthStart, -1)
  return [
    { label: 'Today', value: { from: today, to: today } },
    { label: 'Yesterday', value: { from: shiftDays(today, -1), to: shiftDays(today, -1) } },
    { label: 'This Week', value: { from: weekStart, to: today } },
    { label: 'Last 7 Days', value: { from: shiftDays(today, -6), to: today } },
    { label: 'Last 28 Days', value: { from: shiftDays(today, -27), to: today } },
    { label: 'This Month', value: { from: currentMonthStart, to: today } },
    { label: 'Last Month', value: { from: previousMonthStart, to: shiftDays(currentMonthStart, -1) } },
    { label: 'This Year', value: { from: dateString(year, 1, 1), to: today } },
  ]
}

function clampRange(value: DateRangeValue, min?: string, max?: string) {
  let from = value.from
  let to = value.to
  if (from > to) [from, to] = [to, from]
  if (min) {
    from = from < min ? min : from
    to = to < min ? min : to
  }
  if (max) {
    from = from > max ? max : from
    to = to > max ? max : to
  }
  return { from, to }
}

export function DateRangePicker({ value, onChange, disabled, min, max, className, 'aria-label': ariaLabel = 'Select reporting date range' }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [phase, setPhase] = React.useState<'start' | 'end'>('start')
  const [draftStart, setDraftStart] = React.useState<string | null>(null)
  const [hoverDate, setHoverDate] = React.useState<string | null>(null)
  const [viewMonth, setViewMonth] = React.useState(monthStart(value.from))
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const today = todayInNairobi()

  React.useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLButtonElement>(`[data-date="${value.from}"]`)?.focus())
  }, [open, value.from])

  const firstOffset = mondayIndex(viewMonth)
  const totalDays = daysInMonth(viewMonth)
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstOffset + 1
    return day >= 1 && day <= totalDays ? dateString(parts(viewMonth).year, parts(viewMonth).month, day) : null
  })

  const selectDate = (date: string) => {
    if (phase === 'start') {
      setDraftStart(date)
      setHoverDate(null)
      setPhase('end')
      return
    }
    if (!draftStart) return
    onChange(clampRange({ from: draftStart, to: date }, min, max))
    setPhase('start')
    setDraftStart(null)
    setHoverDate(null)
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const focusDate = (date: string) => {
    setViewMonth(monthStart(date))
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus())
  }

  const handleDayKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, date: string) => {
    const moves: Record<string, string> = {
      ArrowLeft: shiftDays(date, -1), ArrowRight: shiftDays(date, 1),
      ArrowUp: shiftDays(date, -7), ArrowDown: shiftDays(date, 7),
      Home: shiftDays(date, -mondayIndex(date)), End: shiftDays(date, 6 - mondayIndex(date)),
      PageUp: shiftMonthsSameDay(date, -1), PageDown: shiftMonthsSameDay(date, 1),
    }
    const next = moves[event.key]
    if (!next) return
    event.preventDefault()
    if ((min && next < min) || (max && next > max)) return
    focusDate(next)
  }

  const previewFrom = draftStart && hoverDate ? [draftStart, hoverDate].sort()[0] : null
  const previewTo = draftStart && hoverDate ? [draftStart, hoverDate].sort()[1] : null
  const toggleOpen = () => {
    if (!open) {
      setPhase('start')
      setDraftStart(null)
      setHoverDate(null)
      setViewMonth(monthStart(value.from))
    }
    setOpen(current => !current)
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button ref={triggerRef} type="button" variant="outline" disabled={disabled} aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open} className="w-64 justify-start px-3" onClick={toggleOpen}>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate tabular-nums">{displayDate(value.from)} – {displayDate(value.to)}</span>
      </Button>

      {open && (
        <div role="dialog" aria-label="Choose reporting date range" className="fixed inset-x-4 top-20 z-50 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-lg border border-border bg-card p-3 text-card-foreground shadow-lg sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-[41.5rem] sm:max-w-[calc(100vw-2rem)]">
          <p className="sr-only" aria-live="polite">{phase === 'start' ? 'Select the start date' : `Start date ${displayDate(draftStart ?? value.from)} selected. Select the end date.`}</p>
          <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <div className="grid grid-cols-2 gap-1 border-b border-border pb-3 sm:grid-cols-1 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
              {presetRanges(today).map(preset => (
                <Button key={preset.label} type="button" variant="ghost" size="sm" className="justify-start" onClick={() => {
                  onChange(clampRange(preset.value, min, max))
                  setOpen(false)
                  requestAnimationFrame(() => triggerRef.current?.focus())
                }}>{preset.label}</Button>
              ))}
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <Button type="button" variant="ghost" size="icon" aria-label="Previous month" title="Previous month" onClick={() => setViewMonth(current => shiftMonths(current, -1))}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="text-sm font-semibold" aria-live="polite">{monthLabel(viewMonth)}</h2>
                <Button type="button" variant="ghost" size="icon" aria-label="Next month" title="Next month" onClick={() => setViewMonth(current => shiftMonths(current, 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">{WEEKDAYS.map(day => <div key={day} className="py-1" aria-hidden="true">{day}</div>)}</div>
              <div className="grid grid-cols-7 gap-y-1">
                {cells.map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} aria-hidden="true" />
                  const unavailable = Boolean((min && date < min) || (max && date > max))
                  const committedStart = phase === 'start' && date === value.from
                  const committedEnd = phase === 'start' && date === value.to
                  const sameCommittedDate = committedStart && committedEnd
                  const inCommittedRange = phase === 'start' && date > value.from && date < value.to
                  const isDraftStart = phase === 'end' && date === draftStart
                  const isHoverEnd = phase === 'end' && date === hoverDate && date !== draftStart
                  const inPreviewRange = Boolean(previewFrom && previewTo && date > previewFrom && date < previewTo)
                  const selectedText = sameCommittedDate ? 'range start and end' : committedStart ? 'range start' : committedEnd ? 'range end' : isDraftStart ? 'selected start' : isHoverEnd ? 'potential end' : undefined
                  return (
                    <button
                      key={date}
                      type="button"
                      data-date={date}
                      disabled={unavailable}
                      aria-label={`${displayDate(date)}${selectedText ? `, ${selectedText}` : ''}`}
                      aria-pressed={committedStart || committedEnd || isDraftStart}
                      className={cn(
                        'mx-auto flex h-9 w-9 items-center justify-center rounded-md text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30',
                        phase === 'start' ? 'hover:bg-primary hover:text-primary-foreground' : 'hover:bg-[#231f20] hover:text-white',
                        (inCommittedRange || inPreviewRange) && 'rounded-none bg-primary/12 text-foreground',
                        (committedStart || isDraftStart) && 'bg-primary text-primary-foreground hover:bg-primary',
                        (committedEnd || isHoverEnd) && 'bg-[#231f20] text-white hover:bg-[#231f20]',
                        sameCommittedDate && 'bg-[linear-gradient(135deg,var(--primary)_50%,#231f20_50%)] text-white',
                        date === today && !committedStart && !committedEnd && !isDraftStart && !isHoverEnd && 'ring-1 ring-inset ring-primary/50',
                      )}
                      onMouseEnter={() => phase === 'end' && setHoverDate(date)}
                      onMouseLeave={() => phase === 'end' && setHoverDate(null)}
                      onKeyDown={event => handleDayKeyDown(event, date)}
                      onClick={() => selectDate(date)}
                    >
                      {parts(date).day}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {phase === 'start' ? 'Choose a start date.' : `Start: ${displayDate(draftStart ?? value.from)}. Choose an end date.`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { todayInNairobi }
