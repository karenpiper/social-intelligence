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

export async function GET() {
  try {
    const data = await getDashboardData();
    const payload = {
      sentimentTrend: mapSentimentTrend(data.sentimentTrend as any),
      themes: data.themes,
      competitorStats: data.competitorStats,
      alerts: mapAlerts(data.alerts as any),
      platformCounts: data.platformCounts,
      lastUpdated: data.lastUpdated,
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
