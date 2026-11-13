import type { UserAccessDetails } from '@/types'
import { Clock3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatUserDate } from './user-management'

interface AuditEntry { id?: string; action?: string; createdAt?: string; timestamp?: string; userName?: string; actorName?: string; details?: unknown }

export function UserAuditHistory({ history }: { history: UserAccessDetails['auditHistory'] }) {
  const entries = (history || []) as AuditEntry[]
  if (!entries.length) return <EmptyState icon={Clock3} title="No audit history" description="No recent access activity was returned for this user." />
  return <Table><TableHead><TableHeader>Action</TableHeader><TableHeader>Performed by</TableHeader><TableHeader>Date and time</TableHeader><TableHeader>Details</TableHeader></TableHead><TableBody>{entries.slice(0, 50).map((entry, index) => <TableRow key={entry.id || index}><TableCell className="font-medium">{entry.action || 'Activity'}</TableCell><TableCell>{entry.actorName || entry.userName || '—'}</TableCell><TableCell>{formatUserDate(entry.createdAt || entry.timestamp)}</TableCell><TableCell className="max-w-80 whitespace-normal text-muted-foreground">{typeof entry.details === 'string' ? entry.details : entry.details ? JSON.stringify(entry.details) : '—'}</TableCell></TableRow>)}</TableBody></Table>
}
