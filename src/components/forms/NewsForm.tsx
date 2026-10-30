'use client'

import { useState } from 'react'
import type { News } from '@/types'
import { newsAPI } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface NewsFormProps {
  news?: News
  onSuccess?: () => void
  onCancel?: () => void
}

export default function NewsForm({ news, onSuccess, onCancel }: NewsFormProps) {
  const [title, setTitle] = useState(news?.title ?? '')
  const [content, setContent] = useState(news?.content ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { title, content }
      if (news) await newsAPI.update(news.id, payload)
      else await newsAPI.create(payload)
      onSuccess?.()
    } catch (requestError) {
      const responseMessage = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(responseMessage || 'Failed to save this announcement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="destructive"><AlertTitle>Unable to save announcement</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <FormSection title="Announcement content" description="Write a clear title and the complete announcement text.">
        <div className="space-y-5">
          <Input label="Title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Announcement title" />
          <Textarea label="Content" required rows={14} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write the announcement" />
        </div>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={loading}>{news ? 'Save changes' : 'Publish announcement'}</Button>
      </div>
    </form>
  )
}
