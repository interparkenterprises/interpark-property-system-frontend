'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldX } from 'lucide-react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { EmployeeForm, type EmployeeFormValues } from '@/components/employees/EmployeeForm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { employeesAPI } from '@/lib/api'

const initialValues: EmployeeFormValues = {
  name: '', phoneNumber: '', email: '', jobTitle: '', jobDescription: '', salaryAmount: 0,
  paymentFrequency: 'MONTHLY', status: 'ACTIVE',
}

export default function CreateEmployeePage() {
  const router = useRouter()
  const { canCreateEmployee, isAdmin, isManager } = useGlobalPermissions()
  const [values, setValues] = useState(initialValues)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canCreateEmployee || (!isAdmin && !isManager)) {
    return <EmptyState icon={ShieldX} title="You don't have permission to create employees." description="Contact an administrator if you need employee-management access." className="min-h-64" />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await employeesAPI.create(values)
      router.push('/employees')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-4xl space-y-6 pb-4">
      <PageHeader title="Add new employee" description="Create an employee record and configure their salary schedule." />
      {error && <Alert variant="destructive"><AlertTitle>Employee could not be created</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <EmployeeForm values={values} onChange={setValues} onSubmit={handleSubmit} cancelHref="/employees" submitting={loading} submitLabel="Create employee" submittingLabel="Creating employee…" />
    </div>
  )
}
