/**
 * API Route: Generate Digest
 * 
 * POST /api/digests/generate?type=daily|weekly
 * 
 * Triggers digest generation. For production, run daily at 9am 
 * and weekly on Mondays.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDailyDigest, runWeeklyDigest } from '@/lib/orchestrator';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Optional: Verify this is a legitimate call
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'daily' | 'weekly' || 'daily';
    
    let digestId: string;
    
    if (type === 'weekly') {
      digestId = await runWeeklyDigest();
    } else {
      digestId = await runDailyDigest();
    }
    
    return NextResponse.json({
      success: true,
      digestId,
      type
    });
    
  } catch (error) {
    console.error('Digest generation error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
