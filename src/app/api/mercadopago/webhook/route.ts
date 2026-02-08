import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/mercadopago/client';
import { createAdminClient } from '@/lib/supabase/server';
import { handlePaymentEvent } from '@/lib/mercadopago/webhook-handler';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// MercadoPago sends GET requests to verify the webhook URL is active
export async function GET() {
    return NextResponse.json({ status: 'ok' });
}

export async function POST(request: NextRequest) {
    try {
        console.log('[MP Webhook] START processing new request...');

        // 1. Get Signature Headers
        const xSignature = request.headers.get('x-signature') || '';
        const xRequestId = request.headers.get('x-request-id') || '';

        // 2. Get Data.ID from Query Params (CRITICAL: MP signs using query param, NOT body)
        const queryDataId = request.nextUrl.searchParams.get('data.id') || '';

        // 3. Parse Body Safely
        let body: any;
        try {
            body = await request.json();
        } catch (jsonError) {
            console.error('[MP Webhook] JSON Parse Error:', jsonError);
            return NextResponse.json({ received: true, error: 'malformed_json' });
        }

        const { action, data, type } = body;
        const bodyDataId = data?.id?.toString() || '';
        const signatureDataId = queryDataId || bodyDataId;

        console.log(`[MP Webhook] Event: type=${type}, action=${action}, id=${bodyDataId}`);

        // 4. Initialize Supabase
        let supabase: any;
        try {
            supabase = createAdminClient();
        } catch (err) {
            console.error('[MP Webhook] Failed to create Supabase client:', err);
            return NextResponse.json({ received: true, error: 'internal_config_error' });
        }

        // 5. Log Raw Event to DB (Audit)
        try {
            await supabase.from('payment_events').insert({
                provider: 'mercadopago',
                provider_event_id: xRequestId,
                provider_event_type: type || action,
                order_id: bodyDataId,
                raw_headers: { 'x-signature': xSignature, 'x-request-id': xRequestId },
                raw_payload: body,
                status: 'RECEIVED',
            });
        } catch (logError) {
            console.error('[MP Webhook] DB Log failed (ignoring):', logError);
        }

        // 6. Determine Environment (Sandbox vs Production)
        let sandboxMode = false;
        if (typeof body.live_mode === 'boolean') {
            sandboxMode = !body.live_mode;
        } else {
            const { data: flagData } = await supabase.from('feature_flags').select('value').eq('key', 'mp_enabled').single();
            const mpEnabled = flagData?.value ?? true;
            sandboxMode = !mpEnabled;
        }
        console.log(`[MP Webhook] Environment: ${sandboxMode ? 'SANDBOX' : 'PRODUCTION'}`);

        // 7. Validate Signature (Production Only)
        if (process.env.NODE_ENV === 'production') {
            const isValid = validateWebhookSignature(xSignature, xRequestId, signatureDataId, sandboxMode);
            if (!isValid) {
                console.error(`[MP Webhook] Invalid Signature! DataID: ${signatureDataId}, RequestID: ${xRequestId}`);
                // Still return 200 to avoid infinite retries, but skip processing
                return NextResponse.json({ received: true, error: 'invalid_signature' });
            }
            console.log('[MP Webhook] Signature Validated ✅');
        }

        // 8. Process Payment Logic
        if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
            console.log(`[MP Webhook] Processing payment ID: ${bodyDataId}...`);
            await handlePaymentEvent(bodyDataId, supabase, sandboxMode);
            console.log(`[MP Webhook] Processing finished for ${bodyDataId}.`);
        }

        // 9. Return 200
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('[MP Webhook] Fatal Handler Error:', error);
        return NextResponse.json({ received: true, error: 'fatal_handler_error' });
    }
}
