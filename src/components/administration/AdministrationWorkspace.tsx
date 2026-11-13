'use client'

import { useRouter } from 'next/navigation'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AdministrationWorkspaceProps {
  children: React.ReactNode
  activeTab?: 'users' | 'create-role' | 'create-user' | 'roles'
}

export function AdministrationWorkspace({ children, activeTab = 'users' }: AdministrationWorkspaceProps) {
  const router = useRouter()
  const { canManageUsers, canManageRoles } = useGlobalPermissions()

  return (
    <Tabs value={activeTab} onValueChange={(value) => {
      if (value === 'users') router.push('/users')
      if (value === 'create-role') router.push('/roles/create')
      if (value === 'create-user') router.push('/roles/create?mode=user')
      if (value === 'roles') router.push('/roles')
    }}>
      <TabsList aria-label="User Settings sections">
        {canManageUsers && <TabsTrigger value="users">Users</TabsTrigger>}
        {canManageRoles && <TabsTrigger value="create-role">Create Roles</TabsTrigger>}
        {canManageUsers && <TabsTrigger value="create-user">Create Managed User</TabsTrigger>}
        {canManageRoles && <TabsTrigger value="roles">Role Management</TabsTrigger>}
      </TabsList>
      <TabsContent value={activeTab} className="pt-4">{children}</TabsContent>
    </Tabs>
  )
}
