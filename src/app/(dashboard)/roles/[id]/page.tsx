'use client'

import { useParams } from 'next/navigation'
import { RoleDetailsWorkspace } from '@/components/administration/roles/RoleDetailsWorkspace'

export default function RoleDetailsPage() {
  const params = useParams<{ id: string }>()
  return <RoleDetailsWorkspace roleId={params.id} />
}
