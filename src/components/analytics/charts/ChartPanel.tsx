import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoTip } from '../AnalyticsCore'

export function ChartPanel({ title, subtitle, tooltip, children }: {
  title: string
  subtitle?: string
  tooltip?: string
  children: React.ReactNode
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center">{title}{tooltip && <InfoTip text={tooltip} />}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative h-75 min-h-75 w-full">{children}</div>
      </CardContent>
    </Card>
  )
}
