'use client'

import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import NewsForm from '@/components/forms/NewsForm'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'

export default function CreateNewsPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) return <div className="mx-auto max-w-4xl space-y-5"><Skeleton className="h-12 w-72" /><Skeleton className="h-96" /></div>

  if (!isAdmin) {
    return <EmptyState icon={ShieldAlert} title="Administrator access required" description="Only administrators can create announcements." action={<Button variant="outline" onClick={() => router.push('/news')}>Back to news</Button>} />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Create announcement" description="Publish an announcement for Interpark users." />
      <NewsForm onSuccess={() => router.push('/news')} onCancel={() => router.push('/news')} />
    </div>
  )
}
