'use client'

import { useParams } from 'next/navigation'
import { UserAccessWorkspace } from '@/components/administration/users/UserAccessWorkspace'

export default function UserAccessPage() {
  const params = useParams<{ id: string }>()
  return <UserAccessWorkspace userId={params.id} />
}
