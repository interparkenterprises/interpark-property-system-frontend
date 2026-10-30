'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import type { TodoStatistics } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface StatsUser {
  id: string
  name: string
  email: string
}

interface TodoStatsDialogProps {
  open: boolean
  stats: TodoStatistics | null
  loading: boolean
  selectedUserId: string
  currentUserId?: string
  users: StatsUser[]
  canSelectUser: boolean
  onOpenChange: (open: boolean) => void
  onUserChange: (userId: string) => void
}

const activityConfig = {
  created: { label: 'Created', color: 'var(--chart-1)' },
  completed: { label: 'Completed', color: 'var(--chart-2)' },
} satisfies ChartConfig

const statusConfig = {
  value: { label: 'Tasks', color: 'var(--chart-1)' },
} satisfies ChartConfig

function metric(value: number | string, label: string, tone?: string) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-semibold tabular-nums ${tone ?? 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

export function TodoStatsDialog({ open, stats, loading, selectedUserId, currentUserId, users, canSelectUser, onOpenChange, onUserChange }: TodoStatsDialogProps) {
  const selectedUser = users.find((user) => user.id === selectedUserId)
  const statusData = stats ? [
    { name: 'Pending', value: stats.byStatus.pending },
    { name: 'In progress', value: stats.byStatus.inProgress },
    { name: 'Approval', value: stats.byStatus.pendingApproval },
    { name: 'Completed', value: stats.byStatus.completed },
    { name: 'Overdue', value: stats.byStatus.overdue },
    { name: 'Rejected', value: stats.byStatus.rejected },
  ] : []
  const priorityData = stats ? [
    { name: 'Low', value: stats.byPriority.low },
    { name: 'Medium', value: stats.byPriority.medium },
    { name: 'High', value: stats.byPriority.high },
    { name: 'Urgent', value: stats.byPriority.urgent },
  ] : []
  const weeklyData = stats ? Object.entries(stats.weeklyActivity).slice(-12).map(([week, values]) => ({ week, ...values })) : []
  const dailyData = stats ? Object.entries(stats.dailyActivity).slice(-7).map(([date, values]) => ({
    date: new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
    ...values,
  })) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <div className="flex flex-col gap-3 pr-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle>Task statistics</DialogTitle>
              <DialogDescription className="mt-1">
                {selectedUserId === currentUserId ? 'Your task activity and completion performance.' : `Task activity for ${selectedUser?.name ?? 'the selected user'}.`}
              </DialogDescription>
            </div>
            {canSelectUser && users.length > 0 && (
              <Select value={selectedUserId} onValueChange={onUserChange} disabled={loading}>
                <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select a user" /></SelectTrigger>
                <SelectContent>
                  {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.id === currentUserId ? 'My stats' : user.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </DialogHeader>
        <div className="space-y-5 px-5 py-5">
          {loading || !stats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {metric(stats.total, 'Total tasks')}
                {metric(`${stats.completion.completionRate}%`, 'Completion rate', 'text-success')}
                {metric(stats.completion.tasksCompletedOnTime, 'Completed on time')}
                {metric(stats.completion.tasksCompletedLate, 'Completed late', 'text-warning')}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Status distribution</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={statusConfig} className="h-64 w-full">
                      <BarChart accessibilityLayer data={statusData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Priority distribution</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={statusConfig} className="h-64 w-full">
                      <BarChart accessibilityLayer data={priorityData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                {weeklyData.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Weekly activity</CardTitle></CardHeader>
                    <CardContent>
                      <ChartContainer config={activityConfig} className="h-64 w-full">
                        <LineChart accessibilityLayer data={weeklyData}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="week" tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Line dataKey="created" stroke="var(--color-created)" strokeWidth={2} dot={false} />
                          <Line dataKey="completed" stroke="var(--color-completed)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
                {dailyData.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Last 7 days</CardTitle></CardHeader>
                    <CardContent>
                      <ChartContainer config={activityConfig} className="h-64 w-full">
                        <AreaChart accessibilityLayer data={dailyData}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Area dataKey="created" stroke="var(--color-created)" fill="var(--color-created)" fillOpacity={0.15} />
                          <Area dataKey="completed" stroke="var(--color-completed)" fill="var(--color-completed)" fillOpacity={0.15} />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Completion details</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Average completion time</span><strong>{stats.completion.averageCompletionTime ? `${Number(stats.completion.averageCompletionTime).toFixed(1)} hours` : 'Not available'}</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Completed on time</span><strong>{stats.completion.tasksCompletedOnTime}</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Completed late</span><strong>{stats.completion.tasksCompletedLate}</strong></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Most productive days</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {stats.mostProductiveDays.length ? stats.mostProductiveDays.map((day) => (
                      <div key={day.day} className="flex justify-between"><span className="text-muted-foreground">{day.day}</span><strong>{day.tasksCompleted} tasks</strong></div>
                    )) : <p className="text-muted-foreground">No productive-day data is available yet.</p>}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
