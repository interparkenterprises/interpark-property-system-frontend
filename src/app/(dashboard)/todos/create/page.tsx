'use client'

import { useRouter } from 'next/navigation'
import TodoForm from '@/components/forms/TodoForm'
import { PageHeader } from '@/components/ui/page-header'

export default function CreateTodoPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Create task" description="Add a task for yourself or assign it to an eligible team member." />
      <TodoForm onSuccess={() => router.push('/todos')} onCancel={() => router.push('/todos')} />
    </div>
  )
}
