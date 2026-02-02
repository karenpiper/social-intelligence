'use client'

import { useState } from 'react'
import { Lightbulb, RefreshCw, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Digest } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DigestTabProps {
  digest: Digest | null
  onGenerate: () => Promise<void>
  isLoading: boolean
}

export function DigestTab({ digest, onGenerate, isLoading }: DigestTabProps) {
  if (!digest) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Digest Available
          </h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            Generate a daily intelligence brief to get AI-powered insights from
            your social monitoring data.
          </p>
          <Button
            onClick={onGenerate}
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Digest'
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-medium text-foreground">
              Key Insights
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {digest.key_insights.map((insight, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm text-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium text-foreground">
            Full Report
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Generated{' '}
              {(() => {
                const d = new Date(digest.created_at);
                return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
              })()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerate}
              disabled={isLoading}
              className="text-xs bg-transparent"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert prose-sm max-w-none">
            <div
              className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(digest.content) }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatMarkdown(content: string): string {
  return content
    .replace(/^### (.*$)/gm, '<h3 class="text-foreground font-medium mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-foreground font-semibold mt-6 mb-3 text-lg">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-foreground font-bold mt-6 mb-3 text-xl">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '<br /><br />')
}
