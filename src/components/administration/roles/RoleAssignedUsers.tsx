import Link from 'next/link'
import { UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { RoleRecord } from './role-management'
import { formatRoleDateTime } from './role-management'

export function RoleAssignedUsers({ assignments = [] }: { assignments: NonNullable<RoleRecord['assignments']> }) {
  if (!assignments.length) {
    return <EmptyState icon={UsersRound} title="No assigned users" description="No active user assignments currently reference this role." />
  }

  return (
    <Table className="min-w-[760px]">
      <TableHead>
        <TableHeader>User</TableHeader>
        <TableHeader>Email</TableHeader>
        <TableHeader>Assignment</TableHeader>
        <TableHeader>Expires</TableHeader>
        <TableHeader>Account Status</TableHeader>
      </TableHead>
      <TableBody>
        {assignments.map((assignment) => (
          <TableRow key={assignment.id}>
            <TableCell>
              {assignment.user ? (
                <Link href={`/users/${assignment.user.id}`} className="font-medium underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {assignment.user.name}
                </Link>
              ) : '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">{assignment.user?.email || '—'}</TableCell>
            <TableCell className="text-muted-foreground">{formatRoleDateTime(assignment.assignedAt)}</TableCell>
            <TableCell className="text-muted-foreground">{formatRoleDateTime(assignment.expiresAt)}</TableCell>
            <TableCell>
              <Badge variant={assignment.user?.canManagerLogin === false || assignment.isActive === false ? 'warning' : 'success'}>
                {assignment.user?.canManagerLogin === false ? 'Disabled' : assignment.isActive === false ? 'Inactive' : 'Active'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
