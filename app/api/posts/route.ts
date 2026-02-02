/**
 * GET /api/posts?ids=uuid1,uuid2,...
 *
 * Returns post summaries for the given IDs (for theme drill-down / auditability).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPostsByIds } from '@/lib/database';

const MAX_IDS = 50;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json(
        { error: 'ids query parameter required (comma-separated UUIDs)' },
        { status: 400 }
      );
    }
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, MAX_IDS);
    if (ids.length === 0) {
      return NextResponse.json([]);
    }
    const posts = await getPostsByIds(ids);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Posts fetch error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
