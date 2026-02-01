/**
 * API Route: Dashboard Data
 * 
 * GET /api/dashboard
 * 
 * Returns all data needed to render the main dashboard.
 */

import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/orchestrator';

export async function GET() {
  try {
    const data = await getDashboardData();
    
    return NextResponse.json({
      success: true,
      data
    });
    
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
