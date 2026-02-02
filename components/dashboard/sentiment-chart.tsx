'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SentimentTrendItem } from '@/lib/types'

interface SentimentChartProps {
  data: SentimentTrendItem[]
}

export function SentimentChart({ data }: SentimentChartProps) {
  const chartData = useMemo(() => {
    const grouped = data.reduce(
      (acc, item) => {
        const parsed = new Date(item.hour)
        if (Number.isNaN(parsed.getTime())) return acc
        const date = parsed.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
        if (!acc[date]) {
          acc[date] = { date, sentiment: 0, count: 0, volume: 0 }
        }
        acc[date].sentiment += item.avg_sentiment
        acc[date].count += 1
        acc[date].volume += item.total_volume
        return acc
      },
      {} as Record<string, { date: string; sentiment: number; count: number; volume: number }>
    )

    return Object.values(grouped)
      .map((item) => ({
        date: item.date,
        sentiment: Number((item.sentiment / item.count).toFixed(3)),
        volume: item.volume,
      }))
      .slice(-7)
  }, [data])

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sentiment Trend (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            No sentiment data yet. Run the pipeline or wait for data to collect.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Sentiment Trend (7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[-1, 1]}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium text-foreground">
                          {data.date}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Sentiment:{' '}
                          <span
                            className={
                              data.sentiment >= 0
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }
                          >
                            {data.sentiment.toFixed(3)}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Volume: {data.volume.toLocaleString()}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
