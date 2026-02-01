/**
 * API Route: Digests
 * 
 * GET /api/digests?type=daily|weekly - Get latest digest
 * POST /api/digests/generate - Trigger digest generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestDigest } from '@/lib/orchestrator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'daily' | 'weekly' || 'daily';
    
    const digest = await getLatestDigest(type);
    
    if (!digest) {
      return NextResponse.json({
        success: true,
        digest: null,
        message: `No ${type} digest found`
      });
    }
    
    return NextResponse.json({
      success: true,
      digest
    });
    
  } catch (error) {
    console.error('Digest fetch error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
