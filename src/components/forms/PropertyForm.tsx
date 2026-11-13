'use client'

import Image from 'next/image'
import { forwardRef, useEffect, useState } from 'react'
import { Building2, FileClock, Plus, Save, UserRound, UsersRound, X } from 'lucide-react'
import type { Landlord, Property, PropertyForm as PropertyFormType, UsageType } from '@/types'
import { landlordsAPI, propertiesAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileUpload } from '@/components/ui/file-upload'
import { FormActions } from '@/components/ui/form-actions'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PropertyFormProps {
  property?: Property
  onSuccess?: () => void
  onCancel?: () => void
}

const emptyFormData = () => ({
  name: '',
  address: '',
  lrNumber: '',
  form: 'APARTMENT' as PropertyFormType,
  usage: 'RESIDENTIAL' as UsageType,
  landlordId: '',
  landlordName: '',
  landlordEmail: '',
  landlordPhone: '',
  landlordAddress: '',
  landlordIdNumber: '',
  commissionFee: 0,
  imageFile: null as File | null,
  accountNo: '',
  accountName: '',
  bank: '',
  branch: '',
  branchCode: '',
})

type PropertyFormData = ReturnType<typeof emptyFormData>
type LandlordMode = 'existing' | 'new'

const getDraftKey = (propertyId?: string) => propertyId ? `property_form_draft_${propertyId}` : 'property_form_draft_new'

const PropertyForm = forwardRef<HTMLFormElement, PropertyFormProps>(
  ({ property, onSuccess, onCancel }, ref) => {
    const {
      canViewLandlordsForAssignment,
      canCreateNewLandlord,
      canAssignLandlord,
      isAdmin,
      isManager,
      isManagedUser,
      canCreateProperty,
    } = useGlobalPermissions()

    const [formData, setFormData] = useState<PropertyFormData>(emptyFormData)
    const [landlords, setLandlords] = useState<Landlord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [landlordMode, setLandlordMode] = useState<LandlordMode>('existing')
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [hasDraft, setHasDraft] = useState(false)
    const [fetchingLandlords, setFetchingLandlords] = useState(false)
    const [clearDraftOpen, setClearDraftOpen] = useState(false)

    const draftKey = getDraftKey(property?.id)
    const canSelectExistingLandlords = canViewLandlordsForAssignment || isAdmin || isManager
    const canAddNewLandlord = canCreateNewLandlord || isAdmin || isManager

    const saveDraft = (data: PropertyFormData, mode: LandlordMode) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          ...data,
          imageFile: null,
          landlordMode: mode,
        }))
      } catch (draftError) {
        console.error('Error saving draft:', draftError)
      }
    }

    const clearDraft = () => {
      try {
        localStorage.removeItem(draftKey)
        setHasDraft(false)
      } catch (draftError) {
        console.error('Error clearing draft:', draftError)
      }
    }

    const propertyValues = (record: Property): PropertyFormData => ({
      name: record.name || '',
      address: record.address || '',
      lrNumber: record.lrNumber || '',
      form: record.form || 'APARTMENT',
      usage: record.usage || 'RESIDENTIAL',
      landlordId: record.landlordId || '',
      landlordName: record.landlord?.name || '',
      landlordEmail: record.landlord?.email || '',
      landlordPhone: record.landlord?.phone || '',
      landlordAddress: record.landlord?.address || '',
      landlordIdNumber: record.landlord?.idNumber || '',
      commissionFee: record.commissionFee || 0,
      imageFile: null,
      accountNo: record.accountNo || '',
      accountName: record.accountName || '',
      bank: record.bank || '',
      branch: record.branch || '',
      branchCode: record.branchCode || '',
    })

    useEffect(() => {
      const frame = window.requestAnimationFrame(() => {
        if (canViewLandlordsForAssignment || isAdmin || isManager || canCreateProperty) {
          setFetchingLandlords(true)
          landlordsAPI.getAll()
            .then(setLandlords)
            .catch((fetchError: unknown) => {
              console.error('Error fetching landlords:', fetchError)
              setLandlords([])
              const status = typeof fetchError === 'object' && fetchError && 'response' in fetchError
                ? (fetchError as { response?: { status?: number } }).response?.status
                : undefined
              if (status !== 403) setError('Failed to load landlords. You can still create a new landlord.')
            })
            .finally(() => setFetchingLandlords(false))
        } else if (canCreateProperty) {
          setLandlordMode('new')
        }

        try {
          const savedDraft = localStorage.getItem(draftKey)
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft) as Partial<PropertyFormData> & { landlordMode?: LandlordMode }
            const base = property ? propertyValues(property) : emptyFormData()
            setFormData({ ...base, ...parsed, imageFile: null })
            setLandlordMode(parsed.landlordMode || (property?.landlordId ? 'existing' : 'new'))
            setImagePreview(property?.image || null)
            setHasDraft(true)
            return
          }
        } catch (draftError) {
          console.error('Error loading draft:', draftError)
        }

        if (property) {
          setFormData(propertyValues(property))
          setLandlordMode(property.landlordId ? 'existing' : 'new')
          setImagePreview(property.image || null)
        }
      })
      return () => window.cancelAnimationFrame(frame)
    }, [canCreateProperty, canViewLandlordsForAssignment, draftKey, isAdmin, isManager, property])

    const updateForm = (patch: Partial<PropertyFormData>) => {
      const next = { ...formData, ...patch }
      setFormData(next)
      saveDraft(next, landlordMode)
      setHasDraft(true)
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type } = event.target
      if (name === 'landlordPhone' || name === 'accountNo') {
        const numericValue = value.replace(/[^0-9]/g, '')
        const maxLength = name === 'accountNo' ? 20 : 10
        if (numericValue.length <= maxLength) updateForm({ [name]: numericValue })
        return
      }
      updateForm({ [name]: type === 'number' ? (value === '' ? 0 : Number.parseFloat(value)) : value })
    }

    const handleFileChange = (file: File | null) => {
      if (!file) {
        const next = { ...formData, imageFile: null }
        setFormData(next)
        setImagePreview(null)
        saveDraft(next, landlordMode)
        return
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, WebP, or GIF).')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB.')
        return
      }

      const next = { ...formData, imageFile: file }
      setFormData(next)
      setError('')
      setHasDraft(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        const previewUrl = reader.result as string
        setImagePreview(previewUrl)
        saveDraft(next, landlordMode)
      }
      reader.readAsDataURL(file)
    }

    const handleLandlordModeChange = (value: string) => {
      const mode = value as LandlordMode
      setLandlordMode(mode)
      saveDraft(formData, mode)
    }

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault()
      setLoading(true)
      setError('')

      if (!formData.name.trim() || !formData.address.trim()) {
        setError('Property name and address are required.')
        setLoading(false)
        return
      }
      if (landlordMode === 'existing' && !formData.landlordId) {
        setError('Please select a landlord.')
        setLoading(false)
        return
      }
      if (landlordMode === 'new' && !formData.landlordName.trim()) {
        setError('Landlord name is required.')
        setLoading(false)
        return
      }
      if (!property && !canCreateNewLandlord && landlordMode === 'new') {
        setError('You do not have permission to create new landlords. Please select an existing landlord.')
        setLoading(false)
        return
      }

      try {
        const payload = new FormData()
        payload.append('name', formData.name)
        payload.append('address', formData.address)
        if (formData.lrNumber) payload.append('lrNumber', formData.lrNumber)
        payload.append('form', formData.form)
        payload.append('usage', formData.usage)
        if (formData.commissionFee) payload.append('commissionFee', formData.commissionFee.toString())
        if (formData.accountNo) payload.append('accountNo', formData.accountNo)
        if (formData.accountName) payload.append('accountName', formData.accountName)
        if (formData.bank) payload.append('bank', formData.bank)
        if (formData.branch) payload.append('branch', formData.branch)
        if (formData.branchCode) payload.append('branchCode', formData.branchCode)
        if (formData.imageFile) payload.append('image', formData.imageFile)

        if (landlordMode === 'existing') {
          payload.append('landlordId', formData.landlordId)
        } else {
          payload.append('landlord', JSON.stringify({
            name: formData.landlordName.trim(),
            email: formData.landlordEmail.trim() || null,
            phone: formData.landlordPhone.trim() || null,
            address: formData.landlordAddress.trim() || null,
            idNumber: formData.landlordIdNumber.trim() || null,
          }))
        }

        if (property) await propertiesAPI.update(property.id, payload)
        else await propertiesAPI.create(payload)
        clearDraft()
        onSuccess?.()
      } catch (submitError: unknown) {
        const responseMessage = typeof submitError === 'object' && submitError && 'response' in submitError
          ? (submitError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
        setError(responseMessage || (submitError instanceof Error ? submitError.message : 'Failed to save property. Please try again.'))
      } finally {
        setLoading(false)
      }
    }

    const resetDraft = () => {
      if (property) {
        setFormData(propertyValues(property))
        setLandlordMode(property.landlordId ? 'existing' : 'new')
        setImagePreview(property.image || null)
      } else {
        setFormData(emptyFormData())
        setLandlordMode('existing')
        setImagePreview(null)
      }
      clearDraft()
      setClearDraftOpen(false)
      setError('')
    }

    return (
      <>
        <form ref={ref} onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-5" noValidate encType="multipart/form-data">
          {hasDraft && (
            <Alert variant="info" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <FileClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <AlertTitle>Draft saved</AlertTitle>
                  <AlertDescription>Your text changes are saved on this device. Selected image files may need to be chosen again after a reload.</AlertDescription>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setClearDraftOpen(true)}>Clear draft</Button>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Property could not be saved</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isManagedUser && !canSelectExistingLandlords && canAddNewLandlord && (
            <Alert variant="info"><AlertTitle>Landlord assignment</AlertTitle><AlertDescription>Create a landlord below to associate it with this property.</AlertDescription></Alert>
          )}

          <FormSection title="Property details" description="Record the property's identity, location, building form, and management fee.">
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Property Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. InterPark Heights" disabled={loading} required />
              <Input label="Address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Street, city, county" disabled={loading} required />
              <Input label="LR Number" name="lrNumber" value={formData.lrNumber} onChange={handleInputChange} placeholder="e.g. LR/12345/2020" disabled={loading} helperText="Optional land reference number." />

              <FormField label="Property Form" htmlFor="property-form" required>
                <Select value={formData.form} onValueChange={(value) => updateForm({ form: value as PropertyFormType })} disabled={loading}>
                  <SelectTrigger id="property-form"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APARTMENT">Apartment</SelectItem><SelectItem value="BUNGALOW">Bungalow</SelectItem><SelectItem value="VILLA">Villa</SelectItem><SelectItem value="DUPLEX">Duplex</SelectItem><SelectItem value="TOWNHOUSE">Townhouse</SelectItem><SelectItem value="MAISONETTE">Maisonette</SelectItem><SelectItem value="OFFICE">Office</SelectItem><SelectItem value="SHOP">Shop</SelectItem><SelectItem value="WAREHOUSE">Warehouse</SelectItem><SelectItem value="INDUSTRIAL_BUILDING">Industrial Building</SelectItem><SelectItem value="RETAIL_CENTER">Retail Center</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Usage Type" htmlFor="property-usage" required>
                <Select value={formData.usage} onValueChange={(value) => updateForm({ usage: value as UsageType })} disabled={loading}>
                  <SelectTrigger id="property-usage"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="RESIDENTIAL">Residential</SelectItem><SelectItem value="COMMERCIAL">Commercial</SelectItem><SelectItem value="INDUSTRIAL">Industrial</SelectItem><SelectItem value="INSTITUTIONAL">Institutional</SelectItem><SelectItem value="MIXED_USE">Mixed Use</SelectItem></SelectContent>
                </Select>
              </FormField>

              <Input label="Commission Fee (%)" name="commissionFee" type="number" min="0" max="100" step="0.1" value={formData.commissionFee} onChange={handleInputChange} disabled={loading} helperText="Optional manager commission percentage from 0 to 100%." />
            </div>
          </FormSection>

          <FormSection title="Property image" description="Add a clear image to help staff identify the property.">
            {imagePreview && (
              <div className="mb-5 flex items-start gap-4 rounded-lg border border-border bg-muted/20 p-3">
                <Image src={imagePreview} alt="Property preview" width={144} height={144} unoptimized className="h-32 w-32 rounded-md border border-border object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Image preview</p>
                  <p className="mt-1 text-xs text-muted-foreground">This image will represent the property in its workspace.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleFileChange(null)} disabled={loading} aria-label="Remove property image" title="Remove property image"><X className="h-4 w-4" /></Button>
              </div>
            )}
            <FileUpload id="imageFile" value={formData.imageFile} onValueChange={handleFileChange} accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" maxSize={5 * 1024 * 1024} disabled={loading} title="Drop a property image here" description="JPG, PNG, WebP, or GIF" buttonLabel="Select image" />
          </FormSection>

          <FormSection title="Bank details" description="Optional payment account details used for rent and financial transactions.">
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Account Number" name="accountNo" value={formData.accountNo} onChange={handleInputChange} placeholder="e.g. 1234567890" disabled={loading} inputMode="numeric" />
              <Input label="Account Name" name="accountName" value={formData.accountName} onChange={handleInputChange} placeholder="e.g. InterPark Heights Ltd" disabled={loading} />
              <Input label="Bank Name" name="bank" value={formData.bank} onChange={handleInputChange} placeholder="e.g. Equity Bank" disabled={loading} />
              <Input label="Branch" name="branch" value={formData.branch} onChange={handleInputChange} placeholder="e.g. Westlands Branch" disabled={loading} />
              <Input label="Branch Code" name="branchCode" value={formData.branchCode} onChange={handleInputChange} placeholder="e.g. 068" disabled={loading} />
            </div>
          </FormSection>

          <FormSection
            title="Landlord assignment"
            description="Associate an existing landlord or create a landlord together with this property."
            footer={(
              <FormActions>
                {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>}
                <Button type="submit" loading={loading} disabled={!canAssignLandlord}>
                  {!loading && (property ? <Save className="h-4 w-4" aria-hidden="true" /> : <Building2 className="h-4 w-4" aria-hidden="true" />)}
                  {loading ? 'Saving property...' : property ? 'Update Property' : 'Create Property'}
                </Button>
              </FormActions>
            )}
          >
            {!canAssignLandlord ? (
              <Alert variant="destructive"><AlertTitle>Landlord assignment unavailable</AlertTitle><AlertDescription>You do not have permission to assign a landlord to this property. Contact an administrator for access.</AlertDescription></Alert>
            ) : canSelectExistingLandlords && canAddNewLandlord ? (
              <Tabs value={landlordMode} onValueChange={handleLandlordModeChange}>
                <TabsList className="max-w-full">
                  <TabsTrigger value="existing"><UsersRound className="h-4 w-4" aria-hidden="true" />Select Existing Landlord</TabsTrigger>
                  <TabsTrigger value="new"><Plus className="h-4 w-4" aria-hidden="true" />Add New Landlord</TabsTrigger>
                </TabsList>
                <TabsContent value="existing" className="pt-5"><ExistingLandlordField landlords={landlords} value={formData.landlordId} loading={loading} fetching={fetchingLandlords} onChange={(landlordId) => updateForm({ landlordId })} /></TabsContent>
                <TabsContent value="new" className="pt-5"><NewLandlordFields data={formData} loading={loading} onChange={handleInputChange} /></TabsContent>
              </Tabs>
            ) : landlordMode === 'existing' && canSelectExistingLandlords ? (
              <ExistingLandlordField landlords={landlords} value={formData.landlordId} loading={loading} fetching={fetchingLandlords} onChange={(landlordId) => updateForm({ landlordId })} />
            ) : canAddNewLandlord ? (
              <NewLandlordFields data={formData} loading={loading} onChange={handleInputChange} />
            ) : (
              <Alert variant="warning"><AlertTitle>No landlord options available</AlertTitle><AlertDescription>Your current access does not allow existing landlord selection or new landlord creation.</AlertDescription></Alert>
            )}
          </FormSection>
        </form>

        <Dialog open={clearDraftOpen} onOpenChange={setClearDraftOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Clear saved draft?</DialogTitle><DialogDescription>This resets every property field and permanently removes the locally saved draft.</DialogDescription></DialogHeader>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setClearDraftOpen(false)}>Keep draft</Button><Button type="button" variant="destructive" onClick={resetDraft}>Clear draft</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  },
)

function ExistingLandlordField({ landlords, value, loading, fetching, onChange }: { landlords: Landlord[]; value: string; loading: boolean; fetching: boolean; onChange: (value: string) => void }) {
  return (
    <FormField label="Existing Landlord" htmlFor="property-landlord" required description={fetching ? 'Loading landlords…' : landlords.length === 0 ? 'No landlords are currently available.' : 'Choose the landlord who owns this property.'}>
      <Select value={value || undefined} onValueChange={onChange} disabled={loading || fetching || landlords.length === 0}>
        <SelectTrigger id="property-landlord"><SelectValue placeholder={fetching ? 'Loading landlords…' : 'Select a landlord'} /></SelectTrigger>
        <SelectContent>{landlords.map(landlord => <SelectItem key={landlord.id} value={landlord.id}>{landlord.name}{landlord.phone ? ` · ${landlord.phone}` : ''}</SelectItem>)}</SelectContent>
      </Select>
    </FormField>
  )
}

function NewLandlordFields({ data, loading, onChange }: { data: PropertyFormData; loading: boolean; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  const phoneError = data.landlordPhone && data.landlordPhone.length !== 10 ? 'Phone number must be exactly 10 digits.' : undefined
  return (
    <div>
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-muted/25 p-4">
        <div className="rounded-md bg-primary/10 p-2 text-primary"><UserRound className="h-4 w-4" aria-hidden="true" /></div>
        <div><p className="text-sm font-medium text-foreground">New landlord details</p><p className="text-xs text-muted-foreground">The landlord will be created together with this property.</p></div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Landlord Name" name="landlordName" value={data.landlordName} onChange={onChange} placeholder="Full name or company" disabled={loading} required />
        <Input label="ID Number" name="landlordIdNumber" value={data.landlordIdNumber} onChange={onChange} placeholder="National ID or registration number" disabled={loading} />
        <Input label="Email" name="landlordEmail" type="email" value={data.landlordEmail} onChange={onChange} placeholder="name@example.com" disabled={loading} />
        <Input label="Phone" name="landlordPhone" type="tel" value={data.landlordPhone} onChange={onChange} placeholder="0712345678" disabled={loading} inputMode="numeric" maxLength={10} error={phoneError} helperText="Enter 10 digits without spaces or dashes." />
        <div className="md:col-span-2"><Input label="Address" name="landlordAddress" value={data.landlordAddress} onChange={onChange} placeholder="Landlord address" disabled={loading} /></div>
      </div>
    </div>
  )
}

PropertyForm.displayName = 'PropertyForm'

export default PropertyForm
