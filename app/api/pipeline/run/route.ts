/**
 * API Route: Run Pipeline
 *
 * POST /api/pipeline/run
 *
 * Triggers a full collection + analysis cycle.
 * In production, call from a cron (e.g. Vercel Cron). See vercel.json crons config.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/orchestrator';

// Verify cron secret to prevent unauthorized triggers
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Only reject when an Authorization header is sent but wrong (cron must use correct secret).
  // Requests without a header (e.g. "Refresh Data" button) are allowed.
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader != null && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const result = await runPipeline();
    
    return NextResponse.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Pipeline error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
