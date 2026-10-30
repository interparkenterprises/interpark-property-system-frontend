'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, FileQuestion, Pencil, ShieldAlert, Trash2 } from 'lucide-react'
import type { News } from '@/types'
import { newsAPI } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useBreadcrumbAction, useBreadcrumbOverride } from '@/components/layout/BreadcrumbContext'
import NewsForm from '@/components/forms/NewsForm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'

function formatPublishedDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Publication date unavailable' : new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export default function NewsDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useAuth()
  const newsId = params.id as string
  const isEdit = searchParams.get('edit') === 'true'
  const [news, setNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useBreadcrumbOverride(`/news/${newsId}`, loading ? 'Loading…' : news?.title ?? 'News details')
  useBreadcrumbAction(isEdit && isAdmin ? 'Edit' : null)

  const fetchNews = useCallback(async () => {
    try {
      setNews(await newsAPI.getById(newsId))
      setLoadError('')
      setNotFound(false)
    } catch (requestError) {
      console.error('Error fetching news:', requestError)
      const message = requestError instanceof Error ? requestError.message : 'Unable to load this announcement.'
      if (message.toLowerCase().includes('not found')) setNotFound(true)
      else setLoadError(message)
    } finally {
      setLoading(false)
    }
  }, [newsId])

  // This dynamic client route loads its article after the id is available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchNews() }, [fetchNews])

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await newsAPI.delete(newsId)
      router.push('/news')
    } catch (requestError) {
      console.error('Error deleting news:', requestError)
      setDeleteError(requestError instanceof Error ? requestError.message : 'The announcement could not be deleted.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading || authLoading) {
    return <div className="mx-auto max-w-4xl space-y-5"><Skeleton className="h-10 w-72" /><Skeleton className="h-14" /><Skeleton className="h-96" /></div>
  }

  if (isEdit && !isAdmin) {
    return <EmptyState icon={ShieldAlert} title="Administrator access required" description="Only administrators can edit announcements." action={<Button variant="outline" onClick={() => router.push(`/news/${newsId}`)}>View announcement</Button>} />
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert variant="destructive"><AlertTitle>Unable to load announcement</AlertTitle><AlertDescription>{loadError}</AlertDescription></Alert>
        <div className="flex gap-2"><Button onClick={() => void fetchNews()}>Try again</Button><Button variant="outline" onClick={() => router.push('/news')}>Back to news</Button></div>
      </div>
    )
  }

  if (notFound || !news) {
    return <EmptyState icon={FileQuestion} title="Announcement not found" description="This announcement does not exist or is no longer available." action={<Button variant="outline" onClick={() => router.push('/news')}>Back to news</Button>} />
  }

  if (isEdit) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader title="Edit announcement" description={news.title} actions={<Button variant="outline" onClick={() => router.push(`/news/${news.id}`)}><ArrowLeft className="h-4 w-4" />Back to article</Button>} />
        <NewsForm news={news} onSuccess={() => router.push('/news')} onCancel={() => router.push(`/news/${news.id}`)} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" className="-ml-2" onClick={() => router.push('/news')}><ArrowLeft className="h-4 w-4" />Back to news</Button>
      <PageHeader
        title={news.title}
        description={`Published ${formatPublishedDate(news.publishedAt)}`}
        actions={isAdmin ? <><Button variant="outline" onClick={() => router.push(`/news/${news.id}?edit=true`)}><Pencil className="h-4 w-4" />Edit</Button><Button variant="destructive" onClick={() => { setDeleteError(''); setDeleteOpen(true) }}><Trash2 className="h-4 w-4" />Delete</Button></> : undefined}
      />

      <Card>
        <CardContent className="px-5 py-6 sm:px-8 sm:py-8">
          <article className="whitespace-pre-wrap text-base leading-7 text-foreground">{news.content}</article>
          <div className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground">Published {formatPublishedDate(news.publishedAt)}</div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={(open) => !deleteLoading && setDeleteOpen(open)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete announcement</DialogTitle><DialogDescription>This permanently deletes “{news.title}”. This action cannot be undone.</DialogDescription></DialogHeader>
          <div className="px-5 py-5">{deleteError && <Alert variant="destructive"><AlertTitle>Unable to delete announcement</AlertTitle><AlertDescription>{deleteError}</AlertDescription></Alert>}</div>
          <DialogFooter><Button variant="outline" disabled={deleteLoading} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" loading={deleteLoading} onClick={() => void handleDelete()}>Delete announcement</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
