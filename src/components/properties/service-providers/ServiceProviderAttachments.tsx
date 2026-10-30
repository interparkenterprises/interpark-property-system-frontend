import { ChevronDown, ChevronUp, Download, Eye, FileIcon, Loader2, Trash2 } from 'lucide-react'
import type { ServiceProviderAttachmentWithUrls } from '@/types'
import { formatFileSize, getDaysUntilExpiry, getExpiryStatus, getFileIcon, isPreviewable } from '@/utils/attachmentHelpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'

interface ServiceProviderAttachmentsProps {
  attachments: ServiceProviderAttachmentWithUrls[]
  loading: boolean
  showAll: boolean
  downloadingId: string | null
  deletingId: string | null
  onToggleShowAll: () => void
  onPreview: (attachmentId: string) => void
  onDownload: (attachmentId: string, fileName: string) => void
  onDelete: (attachmentId: string) => void
}

function ExpiryBadge({ attachment }: { attachment: ServiceProviderAttachmentWithUrls }) {
  const status = getExpiryStatus(attachment)
  if (status === 'EXPIRED') return <Badge variant="destructive">Expired</Badge>
  if (status === 'EXPIRING_SOON') return <Badge variant="warning">Expires in {getDaysUntilExpiry(attachment)} days</Badge>
  if (status === 'VALID') return <Badge variant="success">Valid</Badge>
  return <Badge variant="neutral">No expiry</Badge>
}

export function ServiceProviderAttachments({
  attachments,
  loading,
  showAll,
  downloadingId,
  deletingId,
  onToggleShowAll,
  onPreview,
  onDownload,
  onDelete,
}: ServiceProviderAttachmentsProps) {
  const hasMore = attachments.length > 4
  const displayedAttachments = showAll ? attachments : attachments.slice(0, 4)

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <SectionHeader
          title={<span className="flex items-center gap-2">Attachments <Badge variant="neutral">{attachments.length}</Badge></span>}
          description="Contracts, certificates and supporting provider documents."
          actions={hasMore ? (
            <Button variant="outline" size="sm" onClick={onToggleShowAll}>
              {showAll ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
              {showAll ? 'Show Less' : `Show All (${attachments.length})`}
            </Button>
          ) : undefined}
        />
      </CardHeader>
      <CardContent className="pt-5">
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}
          </div>
        ) : attachments.length === 0 ? (
          <EmptyState icon={FileIcon} title="No attachments found" description="Upload a document to add it to this provider." />
        ) : (
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {displayedAttachments.map((attachment) => (
              <div key={attachment.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background p-4">
                <span className="shrink-0 text-2xl" aria-hidden="true">{getFileIcon(attachment.fileType)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground" title={attachment.fileName}>{attachment.fileName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.fileSize)}</span>
                    {attachment.category && <Badge variant="outline">{attachment.category.replaceAll('_', ' ')}</Badge>}
                    {attachment.version && <Badge variant="neutral">{attachment.version}</Badge>}
                    <ExpiryBadge attachment={attachment} />
                  </div>
                  {attachment.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{attachment.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isPreviewable(attachment.fileType) && (
                    <Button variant="ghost" size="icon" onClick={() => onPreview(attachment.id)} title="Preview" aria-label={`Preview ${attachment.fileName}`}>
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={downloadingId === attachment.id}
                    onClick={() => onDownload(attachment.id, attachment.fileName)}
                    title="Download"
                    aria-label={`Download ${attachment.fileName}`}
                  >
                    {downloadingId === attachment.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === attachment.id}
                    onClick={() => onDelete(attachment.id)}
                    title="Delete"
                    aria-label={`Delete ${attachment.fileName}`}
                  >
                    {deletingId === attachment.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
