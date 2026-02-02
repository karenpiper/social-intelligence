'use client'

import { useState, useCallback } from 'react'
import { TrendingUp, TrendingDown, Flame, ExternalLink, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Theme, PostSummary } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ThemesTabProps {
  themes: Theme[]
}

const audienceColors: Record<string, string> = {
  enterprise: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  developer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  hobbyist: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  researcher: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  general: 'bg-secondary text-secondary-foreground',
}

const audienceLegend = [
  { key: 'enterprise', label: 'Enterprise', color: 'bg-blue-500/20 text-blue-400' },
  { key: 'developer', label: 'Developer', color: 'bg-emerald-500/20 text-emerald-400' },
  { key: 'hobbyist', label: 'Hobbyist', color: 'bg-purple-500/20 text-purple-400' },
  { key: 'researcher', label: 'Researcher', color: 'bg-cyan-500/20 text-cyan-400' },
  { key: 'general', label: 'General', color: 'bg-secondary text-secondary-foreground' },
]

export function ThemesTab({ themes }: ThemesTabProps) {
  const [openSheetTheme, setOpenSheetTheme] = useState<Theme | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<PostSummary[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  const fetchRelatedPosts = useCallback(async (theme: Theme) => {
    const ids = theme.example_post_ids ?? []
    if (ids.length === 0) {
      setRelatedPosts([])
      return
    }
    setLoadingPosts(true)
    try {
      const res = await fetch(`/api/posts?ids=${ids.join(',')}`)
      const data = await res.json()
      setRelatedPosts(Array.isArray(data) ? data : [])
    } catch {
      setRelatedPosts([])
    } finally {
      setLoadingPosts(false)
    }
  }, [])

  const openThemeSheet = (theme: Theme) => {
    setOpenSheetTheme(theme)
    if (theme.example_post_ids?.length) {
      fetchRelatedPosts(theme)
    } else {
      setRelatedPosts([])
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">About themes</p>
        <p>
          Themes are extracted by Claude from collected posts (Reddit, Hacker News, Bluesky).
          <strong className="text-foreground"> Frequency</strong> = how often the theme appeared in analyzed batches.
          <strong className="text-foreground"> Sentiment</strong> = average -1 to 1 from post content.
          <strong className="text-foreground"> Audience</strong> = inferred segment (see legend below).
          <strong className="text-foreground"> EMERGING</strong> = newly detected. Click a theme card to see related posts (when available).
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          {audienceLegend.map(({ key, label, color }) => (
            <span key={key} className={cn('text-xs px-2 py-0.5 rounded', color)}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const hasRelatedPosts = (theme.example_post_ids?.length ?? 0) > 0
          return (
            <Card
              key={theme.name}
              className={cn(
                'bg-card border-border transition-colors',
                hasRelatedPosts && 'cursor-pointer hover:border-primary/40 hover:bg-card/80',
                theme.is_emerging && 'border-primary/30'
              )}
              onClick={hasRelatedPosts ? () => openThemeSheet(theme) : undefined}
              role={hasRelatedPosts ? 'button' : undefined}
              tabIndex={hasRelatedPosts ? 0 : undefined}
              onKeyDown={hasRelatedPosts ? (e) => e.key === 'Enter' && openThemeSheet(theme) : undefined}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {theme.name}
                      </h3>
                      {theme.is_emerging && (
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/30 text-xs shrink-0"
                        >
                          <Flame className="h-3 w-3 mr-1" />
                          EMERGING
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {theme.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-3xl font-semibold text-foreground">
                      {theme.frequency.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">mentions</p>
                  </div>

                  <div className="text-right">
                    <div
                      className={cn(
                        'flex items-center gap-1 text-sm font-medium',
                        theme.sentiment_avg >= 0 ? 'text-emerald-400' : 'text-red-400'
                      )}
                    >
                      {theme.sentiment_avg >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {theme.sentiment_avg.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">sentiment</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs capitalize',
                      audienceColors[theme.audience_type] ||
                        'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {theme.audience_type}
                  </Badge>
                  {theme.last_seen_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1" title="Last time this theme was seen in analyzed batches">
                      <Calendar className="h-3 w-3" />
                      {new Date(theme.last_seen_at).toLocaleDateString()}
                    </span>
                  )}
                  {hasRelatedPosts && (
                    <span className="text-xs text-primary">
                      View {theme.example_post_ids!.length} related post{theme.example_post_ids!.length !== 1 ? 's' : ''} →
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Sheet open={!!openSheetTheme} onOpenChange={(open) => !open && setOpenSheetTheme(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {openSheetTheme && (
            <>
              <SheetHeader>
                <SheetTitle>Related posts: {openSheetTheme.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  Posts cited by Claude for this theme. Links go to the original source.
                </p>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {loadingPosts ? (
                  <p className="text-sm text-muted-foreground">Loading posts…</p>
                ) : relatedPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No post details available.</p>
                ) : (
                  relatedPosts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs text-muted-foreground uppercase">
                          {post.platform_id}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(post.posted_at).toLocaleString()}
                        </span>
                      </div>
                      {post.content_snippet && (
                        <p className="text-muted-foreground mt-1 line-clamp-2">
                          {post.content_snippet}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        {post.url ? (
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-xs font-medium inline-flex items-center gap-1 hover:underline"
                          >
                            Open post <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No link</span>
                        )}
                        <span className="text-xs text-muted-foreground">· {post.author}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
