import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        console.log('[MP Webhook] HIT - Payment/Merchant Event received (Body reading disabled)');

        // --- ZERO-TOUCH DEBUG MODE ---
        // We do NOT read the body to see if parsing causes the 502.
        // If this works (200 OK), then request.json() was likely crashing on specific payloads.

        // Respond immediately
        return NextResponse.json({ status: 'ok', received: true });

    } catch (error) {
        console.error('[MP Webhook] Fatal Error:', error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}
