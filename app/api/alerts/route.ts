/**
 * API Route: Alerts
 * 
 * GET /api/alerts - Get active alerts
 * POST /api/alerts - Acknowledge an alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveAlerts, acknowledgeAlert } from '@/lib/orchestrator';

export async function GET() {
  try {
    const alerts = await getActiveAlerts();
    
    return NextResponse.json({
      success: true,
      alerts
    });
    
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { alertId } = await request.json();
    
    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'alertId required' },
        { status: 400 }
      );
    }
    
    await acknowledgeAlert(alertId);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Alert acknowledge error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
