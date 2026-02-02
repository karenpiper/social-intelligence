/**
 * API Route: Dashboard Data
 *
 * GET /api/dashboard
 *
 * Returns dashboard data in the shape expected by the v0 frontend.
 */

import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/orchestrator';

function toValidISO(value: string | number | Date | null | undefined): string {
  if (value == null) return new Date().toISOString();
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function mapSentimentTrend(
  raw: Array<{ timestamp?: string; overall_sentiment?: number; volume?: number; platform_id?: string }>
) {
  return raw.map((row) => ({
    hour: toValidISO(row.timestamp),
    platform_id: row.platform_id ?? 'unknown',
    avg_sentiment: row.overall_sentiment ?? 0,
    total_volume: row.volume ?? 0,
  }));
}

function mapAlerts(
  raw: Array<{
    id?: string;
    alert_type?: string;
    severity?: string;
    title?: string;
    description?: string;
    created_at?: string;
  }>
) {
  return raw.map((a) => ({
    id: a.id ?? '',
    alert_type: a.alert_type ?? 'info',
    severity: (a.severity ?? 'medium') as 'low' | 'medium' | 'high' | 'critical',
    title: a.title ?? '',
    description: a.description ?? '',
    created_at: toValidISO(a.created_at),
  }));
}

function mapThemes(raw: Array<{
  name?: string;
  description?: string;
  frequency?: number;
  sentiment_avg?: number;
  audience_type?: string;
  is_emerging?: boolean;
  example_posts?: string[] | null;
  last_seen_at?: string | null;
}>) {
  return raw.map((t) => ({
    name: t.name ?? '',
    description: t.description ?? '',
    frequency: t.frequency ?? 0,
    sentiment_avg: t.sentiment_avg ?? 0,
    audience_type: t.audience_type ?? 'general',
    is_emerging: t.is_emerging ?? false,
    example_post_ids: t.example_posts ?? [],
    last_seen_at: t.last_seen_at ? toValidISO(t.last_seen_at) : undefined,
  }));
}

function trendFromCounts(current: number, previous: number): 'growing' | 'shrinking' | 'stable' {
  if (current > previous) return 'growing';
  if (current < previous) return 'shrinking';
  return 'stable';
}

function volumeFromSizeAndCount(estimated_size: string | null, count: number): 'loud' | 'medium' | 'quiet' {
  if (estimated_size === 'large' || count >= 3) return 'loud';
  if (estimated_size === 'small' && count <= 1) return 'quiet';
  return 'medium';
}

function mapCommunities(
  raw: Array<{
    id?: string;
    name?: string;
    description?: string | null;
    primary_platform?: string | null;
    audience_type?: string | null;
    estimated_size?: string | null;
    key_topics?: string[] | null;
    sentiment_toward_claude?: number | null;
    last_activity_at?: string | null;
    notes?: string | null;
  }>,
  trendMap: Record<string, { current: number; previous: number }> = {}
) {
  const byName = new Map<string, typeof raw[0]>();
  for (const c of raw) {
    const name = c.name ?? '';
    if (!byName.has(name) || (c.last_activity_at && byName.get(name)!.last_activity_at && c.last_activity_at > byName.get(name)!.last_activity_at!)) {
      byName.set(name, c);
    }
  }
  return Array.from(byName.entries()).map(([name, c]) => {
    let notes_parsed: { key_concerns?: string[]; opportunities?: string[]; gathering_places?: string[] } | undefined;
    if (c.notes) {
      try {
        notes_parsed = JSON.parse(c.notes);
      } catch {
        notes_parsed = undefined;
      }
    }
    const counts = trendMap[name] ?? { current: 1, previous: 0 };
    const trend = trendFromCounts(counts.current, counts.previous);
    const volume_indicator = volumeFromSizeAndCount(c.estimated_size ?? null, counts.current);
    return {
      id: c.id ?? '',
      name: c.name ?? '',
      description: c.description ?? null,
      primary_platform: c.primary_platform ?? null,
      audience_type: c.audience_type ?? 'general',
      estimated_size: c.estimated_size ?? null,
      key_topics: c.key_topics ?? [],
      sentiment_toward_claude: c.sentiment_toward_claude ?? null,
      last_activity_at: toValidISO(c.last_activity_at),
      notes_parsed,
      trend,
      volume_indicator,
    };
  });
}

export async function GET() {
  try {
    const data = await getDashboardData();
    const payload = {
      sentimentTrend: mapSentimentTrend(data.sentimentTrend as any),
      themes: mapThemes(data.themes as any),
      competitorStats: data.competitorStats,
      alerts: mapAlerts(data.alerts as any),
      platformCounts: data.platformCounts,
      communities: mapCommunities((data as any).communities ?? [], (data as any).communityTrendMap ?? {}),
      lastUpdated: data.lastUpdated,
      latestPostAt: data.latestPostAt ?? undefined,
    };
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Revalidate every 60 seconds
export const revalidate = 60;
