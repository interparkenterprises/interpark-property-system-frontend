'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Eye, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { DailyReport } from '@/types'
import { dailyReportsAPI } from '@/lib/api'
import DailyReportForm from '@/components/forms/DailyReportForm'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'

interface PropertyManagersDorTabProps { propertyId: string; propertyName: string }

export function PropertyManagersDorTab({ propertyId, propertyName }: PropertyManagersDorTabProps) {
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [showReportForm, setShowReportForm] = useState(false)
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null)
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null)
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setReportsLoading(true)
    try {
      const response = await dailyReportsAPI.getByProperty(propertyId, { page: 1, limit: 50 })
      setDailyReports(response.data)
    } catch (error) {
      console.error('Error fetching daily reports:', error)
    } finally {
      setReportsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    let active = true
    dailyReportsAPI.getByProperty(propertyId, { page: 1, limit: 50 })
      .then((response) => { if (active) setDailyReports(response.data) })
      .catch((error) => console.error('Error fetching daily reports:', error))
      .finally(() => { if (active) setReportsLoading(false) })
    return () => { active = false }
  }, [propertyId])

  const closeForm = () => { setShowReportForm(false); setEditingReport(null) }
  const handleSuccess = () => { closeForm(); void fetchReports() }
  const handleView = async (reportId: string) => {
    try {
      const report = await dailyReportsAPI.getById(reportId, true)
      if (report.pdfUrl) window.open(report.pdfUrl, '_blank')
    } catch (error) {
      console.error('Error viewing report:', error)
    }
  }
  const handleDownload = async (reportId: string, reportDate: string) => {
    if (downloadingReportId) return
    setDownloadingReportId(reportId)
    try {
      const pdfBlob = await dailyReportsAPI.downloadPDF(reportId)
      downloadBlob(pdfBlob, `daily-report-${reportDate}.pdf`)
      toast.success('Daily operations report download initiated.')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to download the daily operations report. Please try again.')
    } finally {
      setDownloadingReportId(null)
    }
  }
  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this daily report?')) return
    setDeletingReportId(reportId)
    try {
      await dailyReportsAPI.delete(reportId)
      await fetchReports()
    } catch (error) {
      console.error('Error deleting report:', error)
    } finally {
      setDeletingReportId(null)
    }
  }

  if (showReportForm) {
    return (
      <PermissionGuard module="reports" action={editingReport ? 'edit' : 'create'}>
        <DailyReportForm propertyId={propertyId} propertyName={propertyName} report={editingReport} onSuccess={handleSuccess} onCancel={closeForm} />
      </PermissionGuard>
    )
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Managers DOR" description="Daily operational reports recorded for this property." actions={<PermissionGuard module="reports" action="create"><Button onClick={() => setShowReportForm(true)}><Plus className="h-4 w-4" />Create Report</Button></PermissionGuard>} />
      {reportsLoading ? (
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
      ) : dailyReports.length === 0 ? (
        <EmptyState icon={FileText} title="No daily reports yet" description="Start tracking daily operations by creating the first report." action={<PermissionGuard module="reports" action="create"><Button onClick={() => setShowReportForm(true)}>Create First Report</Button></PermissionGuard>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {dailyReports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="flex-row items-start justify-between border-b border-border">
                <div><h3 className="font-semibold text-foreground">{new Date(report.reportDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</h3><p className="mt-1 text-xs text-muted-foreground">Prepared by {report.preparedBy}</p></div>
                <Badge variant={report.status === 'APPROVED' ? 'success' : report.status === 'SUBMITTED' ? 'info' : report.status === 'DRAFT' ? 'neutral' : 'destructive'}>{report.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {report.overview?.summary && <p className="line-clamp-3 text-sm text-muted-foreground">{report.overview.summary}</p>}
                {report.occupancy && <p className="text-sm text-foreground">Occupancy: <span className="font-semibold">{report.occupancy.occupancyRate}%</span></p>}
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {report.status === 'DRAFT' && <PermissionGuard module="reports" action="edit"><Button size="sm" variant="outline" onClick={() => { setEditingReport(report); setShowReportForm(true) }}><Pencil className="h-4 w-4" />Edit</Button></PermissionGuard>}
                  {report.pdfUrl && <Button size="sm" variant="outline" onClick={() => handleView(report.id)}><Eye className="h-4 w-4" />View</Button>}
                  <Button size="sm" variant="outline" loading={downloadingReportId === report.id} disabled={downloadingReportId !== null} onClick={() => handleDownload(report.id, report.reportDate)}>{downloadingReportId !== report.id && <Download className="h-4 w-4" />}Download</Button>
                  {report.status === 'DRAFT' && <PermissionGuard module="reports" action="delete"><Button size="sm" variant="outline" className="text-destructive" loading={deletingReportId === report.id} onClick={() => handleDelete(report.id)}><Trash2 className="h-4 w-4" />Delete</Button></PermissionGuard>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
