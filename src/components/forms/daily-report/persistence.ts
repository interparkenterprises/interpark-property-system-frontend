import type { CreateDailyReportRequest, DailyReport, UpdateDailyReportRequest } from '@/types'

interface DailyReportPersistenceApi {
  create: (data: CreateDailyReportRequest) => Promise<DailyReport>
  update: (id: string, data: UpdateDailyReportRequest) => Promise<DailyReport>
  submit: (id: string) => Promise<DailyReport>
}

export async function persistDailyReportDraft(
  api: Pick<DailyReportPersistenceApi, 'create' | 'update'>,
  reportId: string | null,
  payload: CreateDailyReportRequest | UpdateDailyReportRequest,
) {
  if (reportId) return api.update(reportId, payload as UpdateDailyReportRequest)
  return api.create(payload as CreateDailyReportRequest)
}

export async function persistAndSubmitDailyReport(
  api: DailyReportPersistenceApi,
  reportId: string | null,
  payload: CreateDailyReportRequest | UpdateDailyReportRequest,
  onPersisted: (report: DailyReport) => void,
) {
  const persistedReport = await persistDailyReportDraft(api, reportId, payload)
  onPersisted(persistedReport)
  return api.submit(persistedReport.id)
}
