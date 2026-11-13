'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react'
import type { News } from '@/types'
import { newsAPI } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { getNewsTextPreview } from '@/components/news/rich-text'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonStyles } from '@/components/ui/button'
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

export default function NewsPage() {
  const { isAdmin } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedNews, setSelectedNews] = useState<News | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchNews = useCallback(async () => {
    try {
      setNews(await newsAPI.getAll())
      setError('')
    } catch (requestError) {
      console.error('Error fetching news:', requestError)
      setError('The announcements could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // This client route loads announcements from the existing API after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchNews() }, [fetchNews])

  const handleDelete = async () => {
    if (!selectedNews) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await newsAPI.delete(selectedNews.id)
      setSelectedNews(null)
      await fetchNews()
    } catch (requestError) {
      console.error('Error deleting news:', requestError)
      setDeleteError('The announcement could not be deleted. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="News & Announcements"
        description="Read the latest company updates and operational announcements."
        actions={isAdmin ? <Link href="/news/create" className={buttonStyles()}><Plus className="h-4 w-4" />Add news</Link> : undefined}
      />

      {error && <Alert variant="destructive" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><AlertTitle>Unable to load announcements</AlertTitle><AlertDescription>{error}</AlertDescription></div><Button variant="outline" size="sm" onClick={() => void fetchNews()}>Try again</Button></Alert>}

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-48" />)}</div>
      ) : news.length === 0 && !error ? (
        <EmptyState icon={Newspaper} title="No announcements available" description="Published announcements will appear here." action={isAdmin ? <Link href="/news/create" className={buttonStyles({ variant: 'outline' })}>Create announcement</Link> : undefined} />
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5 sm:p-6">
                <article className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link href={`/news/${item.id}`} className="text-lg font-semibold tracking-tight text-foreground hover:text-primary hover:underline">
                        {item.title}
                      </Link>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        Published {formatPublishedDate(item.publishedAt)}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex shrink-0 gap-1">
                        <Link href={`/news/${item.id}?edit=true`} className={buttonStyles({ variant: 'ghost', size: 'sm' })}><Pencil className="h-4 w-4" />Edit</Link>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setDeleteError(''); setSelectedNews(item) }}><Trash2 className="h-4 w-4" />Delete</Button>
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{getNewsTextPreview(item.content)}</p>
                  <Link href={`/news/${item.id}`} className={buttonStyles({ variant: 'link' })}>Read announcement <ArrowRight className="h-4 w-4" /></Link>
                </article>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selectedNews)} onOpenChange={(open) => !open && !deleteLoading && setSelectedNews(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete announcement</DialogTitle>
            <DialogDescription>This permanently deletes “{selectedNews?.title}”. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="px-5 py-5">
            {deleteError && <Alert variant="destructive"><AlertTitle>Unable to delete announcement</AlertTitle><AlertDescription>{deleteError}</AlertDescription></Alert>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNews(null)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="destructive" loading={deleteLoading} onClick={() => void handleDelete()}>Delete announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
