import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        console.log('[MP Webhook] HIT - Starting processing...');

        // --- MINIMAL DEBUG MODE START ---
        // We are temporarily disabling logic to verify connectivity and eliminate 502s.

        const body = await request.json();
        console.log('[MP Webhook] Payload received:', JSON.stringify(body, null, 2));

        // Respond immediately
        return NextResponse.json({ status: 'ok', received: true });

        // --- MINIMAL DEBUG MODE END ---

        /*
        // ORIGINAL LOGIC (Commented out for triage)
        
        // Get headers for signature validation
        const xSignature = request.headers.get('x-signature') || '';
        const xRequestId = request.headers.get('x-request-id') || '';

        // ... (rest of logic) ...
        */

    } catch (error) {
        console.error('[MP Webhook] Fatal Error:', error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}
