'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Banknote, Building2, CalendarDays, Edit, FileText, Phone, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceProvider, ServiceProviderAttachmentWithUrls } from '@/types'
import { serviceProvidersAPI } from '@/lib/api'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import ServiceProviderForm from '@/components/forms/ServiceProviderForm'
import { ServiceProviderAttachments } from '@/components/properties/service-providers/ServiceProviderAttachments'
import { ServiceProviderHeader } from '@/components/properties/service-providers/ServiceProviderHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { EmptyState } from '@/components/ui/empty-state'
import { FileUpload } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionHeader } from '@/components/ui/section-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { useBreadcrumbAction, useBreadcrumbOverride, useBreadcrumbRouteTrail } from '@/components/layout/BreadcrumbContext'

const attachmentCategories = ['CONTRACT', 'CERTIFICATE', 'INVOICE', 'LICENSE', 'INSURANCE', 'OTHER'] as const

const emptyUploadMetadata = {
  description: '',
  category: '',
  expiryDate: '',
  version: '',
}

function formatEnumLabel(value?: string | null) {
  return value?.replaceAll('_', ' ') || 'N/A'
}

export default function ServiceProviderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const providerId = params.id as string
  const [provider, setProvider] = useState<ServiceProvider | null>(null)
  const [attachments, setAttachments] = useState<ServiceProviderAttachmentWithUrls[]>([])
  const [loading, setLoading] = useState(true)
  const [attachmentsLoading, setAttachmentsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAllAttachments, setShowAllAttachments] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadMetadata, setUploadMetadata] = useState(emptyUploadMetadata)

  const providersWorkspaceHref = provider?.propertyId ? `/properties/${provider.propertyId}?tab=providers` : '/properties'
  useBreadcrumbOverride(`/properties/${providerId}`, loading ? 'Loading…' : provider?.property?.name ?? 'Property details', provider?.propertyId ? `/properties/${provider.propertyId}` : '/properties')
  useBreadcrumbRouteTrail([
    { label: 'Service Providers', href: providersWorkspaceHref },
    { label: loading ? 'Loading…' : provider?.name ?? 'Service provider details' },
  ], `/properties/${providerId}`, providersWorkspaceHref)
  useBreadcrumbAction(showEditForm ? 'Edit' : null)

  useEffect(() => {
    let active = true
    Promise.allSettled([
      serviceProvidersAPI.getById(providerId),
      serviceProvidersAPI.getAttachments(providerId),
    ]).then(([providerResult, attachmentsResult]) => {
      if (!active) return
      if (providerResult.status === 'fulfilled') setProvider(providerResult.value)
      else {
        console.error('Error fetching service provider:', providerResult.reason)
        setProvider(null)
      }
      if (attachmentsResult.status === 'fulfilled') setAttachments(attachmentsResult.value)
      else {
        console.error('Error fetching attachments:', attachmentsResult.reason)
        setAttachments([])
      }
      setLoading(false)
      setAttachmentsLoading(false)
    })
    return () => { active = false }
  }, [providerId])

  const refreshProvider = async () => {
    try {
      setProvider(await serviceProvidersAPI.getById(providerId))
    } catch (error) {
      console.error('Error fetching service provider:', error)
      toast.error('Failed to refresh service provider details')
    }
  }

  const refreshAttachments = async () => {
    setAttachmentsLoading(true)
    try {
      setAttachments(await serviceProvidersAPI.getAttachments(providerId))
    } catch (error) {
      console.error('Error fetching attachments:', error)
      toast.error('Failed to refresh attachments')
    } finally {
      setAttachmentsLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      await serviceProvidersAPI.uploadAttachment(providerId, selectedFile, uploadMetadata)
      setSelectedFile(null)
      setUploadMetadata(emptyUploadMetadata)
      setShowUploadForm(false)
      await refreshAttachments()
      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload attachment. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return
    setDeletingId(attachmentId)
    try {
      await serviceProvidersAPI.deleteAttachment(attachmentId)
      await refreshAttachments()
      toast.success('Attachment deleted successfully')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete attachment. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePreview = (attachmentId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('You must be logged in to preview files')
      return
    }
    window.open(`/api/service-providers/attachments/${attachmentId}/preview?token=${encodeURIComponent(token)}`, '_blank')
  }

  const handleDownload = async (attachmentId: string, fileName: string) => {
    setDownloadingId(attachmentId)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('You must be logged in to download files')
        return
      }
      const response = await fetch(`/api/service-providers/attachments/${attachmentId}/download?token=${encodeURIComponent(token)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.')
          return
        }
        throw new Error(`Download failed: ${response.statusText}`)
      }
      const blobUrl = window.URL.createObjectURL(await response.blob())
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(blobUrl)
      toast.success('Download started')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download attachment. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleEditSuccess = async () => {
    setShowEditForm(false)
    await refreshProvider()
    toast.success('Service provider updated successfully')
  }

  if (loading) return <ServiceProviderDetailsLoading />

  if (!provider) {
    return (
      <EmptyState
        icon={Building2}
        title="Service provider not found"
        description="The service provider does not exist or could not be loaded."
        action={<Button onClick={() => router.push(providersWorkspaceHref)}>Back to Service Providers</Button>}
        className="min-h-[60vh]"
      />
    )
  }

  return (
    <div className="min-w-0 space-y-6">
      <Button variant="outline" onClick={() => router.push(providersWorkspaceHref)}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Service Providers
      </Button>

      <ServiceProviderHeader
        provider={provider}
        editing={showEditForm}
        uploadingDocument={showUploadForm}
        onEdit={() => setShowEditForm(true)}
        onToggleUpload={() => setShowUploadForm((current) => !current)}
      />

      {showEditForm && (
        <Card>
          <CardHeader className="border-b border-border">
            <SectionHeader
              title="Edit Service Provider"
              description="Update the existing provider record."
              leading={<div className="rounded-lg bg-primary/10 p-2 text-primary"><Edit className="h-4 w-4" aria-hidden="true" /></div>}
              actions={<Button variant="outline" onClick={() => setShowEditForm(false)}><X className="h-4 w-4" />Cancel</Button>}
            />
          </CardHeader>
          <CardContent className="pt-5">
            <ServiceProviderForm serviceProvider={provider} onSuccess={handleEditSuccess} onCancel={() => setShowEditForm(false)} />
          </CardContent>
        </Card>
      )}

      {showUploadForm && (
        <Card>
          <CardHeader className="border-b border-border">
            <SectionHeader
              title="Upload Document"
              description="Attach an existing provider document to this record."
              leading={<div className="rounded-lg bg-primary/10 p-2 text-primary"><Upload className="h-4 w-4" aria-hidden="true" /></div>}
            />
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <FileUpload
              id="provider-document"
              value={selectedFile}
              onValueChange={setSelectedFile}
              disabled={uploading}
              title="Drop a provider document here"
              description="Select the contract, certificate, invoice, licence, insurance file, or other supporting document."
              buttonLabel="Select document"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Description" placeholder="Document description" value={uploadMetadata.description} onChange={(event) => setUploadMetadata((current) => ({ ...current, description: event.target.value }))} />
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={uploadMetadata.category || '__none'}
                  onValueChange={(category) => setUploadMetadata((current) => ({ ...current, category: category === '__none' ? '' : category }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No category</SelectItem>
                    {attachmentCategories.map((category) => <SelectItem key={category} value={category}>{formatEnumLabel(category)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input label="Expiry Date" type="date" value={uploadMetadata.expiryDate} onChange={(event) => setUploadMetadata((current) => ({ ...current, expiryDate: event.target.value }))} />
              <Input label="Version" placeholder="e.g. v1, v2" value={uploadMetadata.version} onChange={(event) => setUploadMetadata((current) => ({ ...current, version: event.target.value }))} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadForm(false)}>Cancel</Button>
              <Button loading={uploading} disabled={!selectedFile} onClick={handleUpload}>Upload</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!showEditForm && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Contracted Charge"
              value={formatCompactKes(provider.chargeAmount)}
              description={`${formatEnumLabel(provider.chargeFrequency)} configured charge; not a payment record`}
              icon={<Banknote className="h-5 w-5" />}
              tone="primary"
              title={formatExactKes(provider.chargeAmount)}
            />
            <StatCard label="Contract Period" value={provider.contractPeriod || 'N/A'} icon={<CalendarDays className="h-5 w-5" />} />
            <StatCard label="Documents" value={attachments.length} description="Attached provider files" icon={<FileText className="h-5 w-5" />} tone="info" />
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="border-b border-border">
                <SectionHeader title="Provider information" description="Registered identity and contact details." />
              </CardHeader>
              <CardContent>
                <DetailList>
                  <DetailItem label="Provider ID"><span className="break-all font-mono text-xs">{provider.id}</span></DetailItem>
                  <DetailItem label="Provider Name">{provider.name}</DetailItem>
                  <DetailItem label="Contact" icon={<Phone className="h-4 w-4" />}>{provider.contact || 'N/A'}</DetailItem>
                </DetailList>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border">
                <SectionHeader title="Contract information" description="Configured service terms and contracted charge." />
              </CardHeader>
              <CardContent>
                <DetailList>
                  <DetailItem label="Contract Period">{provider.contractPeriod || 'N/A'}</DetailItem>
                  <DetailItem label="Charge Frequency"><Badge variant="secondary">{formatEnumLabel(provider.chargeFrequency)}</Badge></DetailItem>
                  <DetailItem label="Contracted Charge"><span title={formatExactKes(provider.chargeAmount)}>{formatExactKes(provider.chargeAmount)}</span></DetailItem>
                  <DetailItem label="Service Contract"><span className="whitespace-pre-wrap leading-6">{provider.serviceContract || 'N/A'}</span></DetailItem>
                </DetailList>
              </CardContent>
            </Card>

            {provider.property && (
              <Card className="lg:col-span-2">
                <CardHeader className="border-b border-border">
                  <SectionHeader
                    title="Property information"
                    description="The property associated with this provider."
                    leading={<div className="rounded-lg bg-primary/10 p-2 text-primary"><Building2 className="h-4 w-4" aria-hidden="true" /></div>}
                  />
                </CardHeader>
                <CardContent>
                  <DetailList className="md:grid md:grid-cols-2 md:gap-x-6 md:divide-y-0">
                    <DetailItem label="Property Name">{provider.property.name}</DetailItem>
                    <DetailItem label="Address">{provider.property.address}</DetailItem>
                    <DetailItem label="Property Type">{formatEnumLabel(provider.property.form)}</DetailItem>
                    <DetailItem label="Usage Type">{formatEnumLabel(provider.property.usage)}</DetailItem>
                  </DetailList>
                </CardContent>
              </Card>
            )}
          </div>

          <ServiceProviderAttachments
            attachments={attachments}
            loading={attachmentsLoading}
            showAll={showAllAttachments}
            downloadingId={downloadingId}
            deletingId={deletingId}
            onToggleShowAll={() => setShowAllAttachments((current) => !current)}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDelete={handleDeleteAttachment}
          />
        </>
      )}
    </div>
  )
}

function ServiceProviderDetailsLoading() {
  return (
    <div className="space-y-6" aria-label="Loading service provider details">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}
