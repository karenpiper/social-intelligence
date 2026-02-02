'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import useSWR, { mutate } from 'swr'
import { RefreshCw, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertsBanner } from './alerts-banner'
import { OverviewTab } from './overview-tab'
import { ThemesTab } from './themes-tab'
import { CompetitorsTab } from './competitors-tab'
import { DigestTab } from './digest-tab'
import { DashboardData, Digest } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false)

  const {
    data: dashboardData,
    error: dashboardError,
    isLoading: isDashboardLoading,
  } = useSWR<DashboardData>('/api/dashboard', fetcher, {
    refreshInterval: 60000,
  })

  const { data: digest, isLoading: isDigestLoading } = useSWR<Digest>(
    '/api/digests?type=daily',
    fetcher
  )

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetch('/api/pipeline/run', { method: 'POST' })
      await mutate('/api/dashboard')
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const handleDismissAlert = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      })
      await mutate('/api/dashboard')
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
    }
  }, [])

  const handleGenerateDigest = useCallback(async () => {
    setIsGeneratingDigest(true)
    try {
      await fetch('/api/digests/generate?type=daily', { method: 'POST' })
      await mutate('/api/digests?type=daily')
    } catch (error) {
      console.error('Failed to generate digest:', error)
    } finally {
      setIsGeneratingDigest(false)
    }
  }, [])

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load dashboard data</p>
          <Button onClick={() => mutate('/api/dashboard')}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                Social Intelligence
                <Link
                  href="/"
                  className="text-xs font-normal text-muted-foreground hover:text-foreground"
                >
                  Methodology
                </Link>
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated:{' '}
                {dashboardData?.lastUpdated
                  ? (() => {
                      const d = new Date(dashboardData.lastUpdated);
                      return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
                    })()
                  : 'Loading...'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </Button>
        </header>

        {/* Alerts Banner */}
        {dashboardData && (
          <AlertsBanner
            alerts={dashboardData.alerts}
            onDismiss={handleDismissAlert}
          />
        )}

        {/* Main Content */}
        {isDashboardLoading ? (
          <DashboardSkeleton />
        ) : dashboardData ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="themes">Themes</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="digest">Digest</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab data={dashboardData} />
            </TabsContent>

            <TabsContent value="themes">
              <ThemesTab themes={dashboardData.themes} />
            </TabsContent>

            <TabsContent value="competitors">
              <CompetitorsTab competitors={dashboardData.competitorStats} />
            </TabsContent>

            <TabsContent value="digest">
              <DigestTab
                digest={digest || null}
                onGenerate={handleGenerateDigest}
                isLoading={isGeneratingDigest}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-[300px] bg-secondary rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Skeleton className="h-[350px]" />
        <div className="space-y-4">
          <Skeleton className="h-[160px]" />
          <Skeleton className="h-[160px]" />
        </div>
      </div>
    </div>
  )
}
