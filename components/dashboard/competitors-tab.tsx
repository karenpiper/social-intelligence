'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CompetitorStat } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CompetitorsTabProps {
  competitors: CompetitorStat[]
}

export function CompetitorsTab({ competitors }: CompetitorsTabProps) {
  const sortedCompetitors = [...competitors].sort(
    (a, b) => b.mentions - a.mentions
  )

  const chartData = sortedCompetitors.map((c) => ({
    name: c.competitor,
    mentions: c.mentions,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Share of Voice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 0, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-sm font-medium text-foreground">
                            {data.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Mentions:{' '}
                            <span className="text-primary">
                              {data.mentions.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="mentions"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Competitor Details
        </h3>
        {sortedCompetitors.map((competitor, index) => (
          <Card
            key={competitor.competitor}
            className={cn(
              'bg-card border-border',
              index === 0 && 'border-primary/30'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <h4 className="font-medium text-foreground">
                      {competitor.competitor}
                    </h4>
                  </div>
                  <p className="text-2xl font-semibold text-foreground mt-1">
                    {competitor.mentions.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">mentions</p>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      competitor.avgSentiment >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    )}
                  >
                    {competitor.avgSentiment >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {competitor.avgSentiment.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">sentiment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
