'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldX } from 'lucide-react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { EmployeeForm, type EmployeeFormValues } from '@/components/employees/EmployeeForm'
import { useBreadcrumbOverride } from '@/components/layout/BreadcrumbContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Spinner } from '@/components/ui/spinner'
import { employeesAPI } from '@/lib/api'

interface EditEmployeePageProps { params: Promise<{ id: string }> }

const emptyValues: EmployeeFormValues = {
  name: '', phoneNumber: '', email: '', jobTitle: '', jobDescription: '', salaryAmount: 0,
  paymentFrequency: 'MONTHLY', status: 'ACTIVE',
}

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  const router = useRouter()
  const { canCreateEmployee, isAdmin, isManager } = useGlobalPermissions()
  const [values, setValues] = useState(emptyValues)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [employeeLoaded, setEmployeeLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useBreadcrumbOverride(employeeId ? `/employees/${employeeId}` : '', loading ? 'Loading…' : values.name || 'Employee details')

  useEffect(() => { void params.then(value => setEmployeeId(value.id)) }, [params])
  useEffect(() => {
    if (!employeeId) return
    let active = true
    const fetchEmployee = async () => {
      setLoading(true)
      try {
        const employee = await employeesAPI.getById(employeeId)
        if (!active) return
        setValues({
          name: employee.name, phoneNumber: employee.phoneNumber || '', email: employee.email || '',
          jobTitle: employee.jobTitle, jobDescription: employee.jobDescription || '', salaryAmount: employee.salaryAmount,
          paymentFrequency: employee.paymentFrequency, status: employee.status,
        })
        setEmployeeLoaded(true)
      } catch (fetchError) {
        if (active) setError(fetchError instanceof Error ? fetchError.message : 'Employee could not be loaded.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void fetchEmployee()
    return () => { active = false }
  }, [employeeId])

  if (!canCreateEmployee || (!isAdmin && !isManager)) {
    return <EmptyState icon={ShieldX} title="You don't have permission to edit employees." description="Contact an administrator if you need employee-management access." className="min-h-64" />
  }
  if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner size="lg" label="Loading employee…" /></div>
  if (!employeeLoaded) return <EmptyState title="Employee unavailable" description={error || 'The employee record could not be loaded.'} />

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!employeeId) return
    setSaving(true)
    setError(null)
    try {
      await employeesAPI.update(employeeId, values)
      router.push(`/employees/${employeeId}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to update employee')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-4xl space-y-6 pb-4">
      <PageHeader title="Edit employee" description="Update employee information and salary configuration." />
      {error && <Alert variant="destructive"><AlertTitle>Employee could not be updated</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <EmployeeForm values={values} onChange={setValues} onSubmit={handleSubmit} cancelHref={`/employees/${employeeId}`} submitting={saving} submitLabel="Save changes" submittingLabel="Saving changes…" />
    </div>
  )
}
