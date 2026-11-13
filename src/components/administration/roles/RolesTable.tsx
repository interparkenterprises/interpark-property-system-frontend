import Link from 'next/link'
import { Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { RoleRecord } from './role-management'
import { formatRoleDate, rolePermissions, rolePropertyIds } from './role-management'

interface RolesTableProps {
  roles: RoleRecord[]
  loading: boolean
  hasSearch: boolean
  deletingId: string | null
  onDelete: (role: RoleRecord) => void
}

function RoleActions({ role, deletingId, onDelete }: Pick<RolesTableProps, 'deletingId' | 'onDelete'> & { role: RoleRecord }) {
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/roles/${role.id}?section=overview&edit=true`} aria-label={`Edit ${role.name}`} className={buttonStyles({ variant: 'ghost', size: 'icon' })}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Edit role</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${role.name}`}
            disabled={deletingId !== null}
            loading={deletingId === role.id}
            onClick={() => onDelete(role)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete role</TooltipContent>
      </Tooltip>
    </div>
  )
}

function RoleName({ role }: { role: RoleRecord }) {
  return (
    <div className="min-w-0">
      <Link href={`/roles/${role.id}`} className="block truncate font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {role.name}
      </Link>
      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{role.description || 'No description provided.'}</p>
    </div>
  )
}

export function RolesTable({ roles, loading, hasSearch, deletingId, onDelete }: RolesTableProps) {
  if (loading) return <RolesTableSkeleton />
  if (!roles.length) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title={hasSearch ? 'No roles match this search' : 'No custom roles found'}
        description={hasSearch ? 'Adjust the search and try again.' : 'Custom roles will appear here after they are created.'}
      />
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="hidden md:block">
          <Table className="min-w-[960px]">
            <TableHead>
              <TableHeader>Role Name</TableHeader>
              <TableHeader>Permissions</TableHeader>
              <TableHeader>Properties</TableHeader>
              <TableHeader>Assigned Users</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="min-w-64 whitespace-normal"><RoleName role={role} /></TableCell>
                  <TableCell><Badge variant="secondary">{rolePermissions(role).length}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{rolePropertyIds(role).length}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{role.assignments?.length || 0}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatRoleDate(role.createdAt)}</TableCell>
                  <TableCell><RoleActions role={role} deletingId={deletingId} onDelete={onDelete} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 md:hidden">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-3"><RoleName role={role} /></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-xs">
                <div><p className="text-muted-foreground">Permissions</p><p className="mt-1 font-medium">{rolePermissions(role).length}</p></div>
                <div><p className="text-muted-foreground">Properties</p><p className="mt-1 font-medium">{rolePropertyIds(role).length}</p></div>
                <div><p className="text-muted-foreground">Assigned Users</p><p className="mt-1 font-medium">{role.assignments?.length || 0}</p></div>
                <div><p className="text-muted-foreground">Created</p><p className="mt-1 font-medium">{formatRoleDate(role.createdAt)}</p></div>
              </CardContent>
              <CardFooter className="px-3 py-2"><RoleActions role={role} deletingId={deletingId} onDelete={onDelete} /></CardFooter>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Showing {roles.length} role{roles.length === 1 ? '' : 's'}</p>
      </div>
    </TooltipProvider>
  )
}

function RolesTableSkeleton() {
  return (
    <div className="rounded-md border border-border p-4" aria-label="Loading roles" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <div className="mt-5 space-y-5">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="grid grid-cols-[1fr_7rem_7rem_8rem] gap-6 border-t border-border pt-4">
            <div className="space-y-2"><Skeleton className="h-4 w-44" /><Skeleton className="h-3 w-60" /></div>
            <Skeleton className="h-6 w-12" /><Skeleton className="h-6 w-12" /><Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
