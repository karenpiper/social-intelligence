/**
 * API Route: Digests
 *
 * GET /api/digests?type=daily|weekly - Get latest digest (returns digest object or null for v0 frontend)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestDigest } from '@/lib/orchestrator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') as 'daily' | 'weekly') || 'daily';

    const row = await getLatestDigest(type);

    if (!row) {
      return NextResponse.json(null);
    }

    const digest = {
      id: row.id,
      type: row.digest_type ?? type,
      key_insights: row.key_insights ?? [],
      content: row.content ?? '',
      created_at: (() => {
      const raw = row.generated_at ?? row.period_end;
      if (raw == null) return new Date().toISOString();
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    })(),
    };
    return NextResponse.json(digest);
  } catch (error) {
    console.error('Digest fetch error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
