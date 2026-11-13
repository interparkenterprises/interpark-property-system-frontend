import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface RoleInformationSectionProps {
  name: string
  description: string
  nameError?: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}

export function RoleInformationSection({
  name,
  description,
  nameError,
  onNameChange,
  onDescriptionChange,
}: RoleInformationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Information</CardTitle>
        <CardDescription>Give this reusable role a clear name and description.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          label="Role Name"
          required
          error={nameError}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Leasing Supervisor"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Describe the role's responsibilities"
        />
      </CardContent>
    </Card>
  )
}
