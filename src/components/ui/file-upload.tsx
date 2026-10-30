'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FileUploadProps {
  id?: string
  value?: File | null
  onValueChange: (file: File | null) => void
  accept?: string
  maxSize?: number
  disabled?: boolean
  title?: string
  description?: string
  buttonLabel?: string
  className?: string
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  id,
  value,
  onValueChange,
  accept,
  maxSize,
  disabled = false,
  title = 'Drop your file here',
  description = 'Drag and drop a file, or use the button below.',
  buttonLabel = 'Select file',
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!value && inputRef.current) inputRef.current.value = ''
  }, [value])

  const chooseFile = (file?: File) => {
    if (!file) return
    if (maxSize && file.size > maxSize) {
      setError(`Choose a file smaller than ${formatFileSize(maxSize)}.`)
      return
    }
    setError(null)
    onValueChange(file)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-5 py-6 text-center transition-colors',
          dragActive && 'border-primary bg-primary/5',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault()
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          if (!disabled) chooseFile(event.dataTransfer.files?.[0])
        }}
      >
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
          {description}
          {maxSize ? ` Maximum size: ${formatFileSize(maxSize)}.` : ''}
        </p>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        <Button type="button" variant="outline" size="sm" className="mt-4" disabled={disabled} onClick={() => inputRef.current?.click()}>
          {buttonLabel}
        </Button>
      </div>

      {value && (
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground" title={value.name}>{value.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setError(null); onValueChange(null) }} disabled={disabled} aria-label="Remove selected file" title="Remove selected file">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
