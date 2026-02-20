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

        // ============================================================
        // 1. DUAL FORMAT DETECTION: IPN (old) vs Webhooks V2 (new)
        // ============================================================
        // IPN format:  query params → ?id=123&topic=payment
        // V2 format:   JSON body   → { action: "payment.created", data: { id: "123" }, type: "payment" }

        const queryId = request.nextUrl.searchParams.get('id') || '';
        const queryTopic = request.nextUrl.searchParams.get('topic') || '';
        const queryDataId = request.nextUrl.searchParams.get('data.id') || '';

        // Determine if this is IPN or V2
        const isIPN = !!queryTopic && !!queryId;

        let paymentId = '';
        let eventType = '';
        let body: any = {};

        if (isIPN) {
            // ---- IPN FORMAT ----
            // Real production payments come through here
            paymentId = queryId;
            eventType = queryTopic; // "payment", "merchant_order", etc.
            console.log(`[MP Webhook] IPN Format detected. topic=${eventType}, id=${paymentId}`);

            // Try to parse body anyway (might have extra data)
            try {
                body = await request.json();
            } catch {
                body = {}; // IPN often has empty or minimal body
            }
        } else {
            // ---- WEBHOOKS V2 FORMAT ----
            // Simulated tests and some events come through here
            try {
                body = await request.json();
            } catch (jsonError) {
                console.error('[MP Webhook] JSON Parse Error:', jsonError);
                return NextResponse.json({ received: true, error: 'malformed_json' });
            }

            const { action, data, type } = body;
            paymentId = queryDataId || data?.id?.toString() || '';
            eventType = type || action || '';
            console.log(`[MP Webhook] V2 Format detected. type=${eventType}, id=${paymentId}`);
        }

        // ============================================================
        // 1b. EARLY EXIT: Skip non-payment events immediately
        // ============================================================
        // merchant_order, test, etc. — we never process these.
        // Skip them before signature validation (they use different params and always fail).
        const isPaymentEvent =
            eventType === 'payment' ||
            eventType === 'payment.created' ||
            eventType === 'payment.updated';

        if (!isPaymentEvent) {
            console.log(`[MP Webhook] Skipping non-payment event: type=${eventType}, id=${paymentId}`);
            return NextResponse.json({ received: true, skipped: eventType });
        }

        // ============================================================
        // 2. Initialize Supabase
        // ============================================================
        let supabase: any;
        try {
            supabase = createAdminClient();
        } catch (err) {
            console.error('[MP Webhook] Failed to create Supabase client:', err);
            return NextResponse.json({ received: true, error: 'internal_config_error' });
        }

        // ============================================================
        // 3. Log Raw Event to DB (Audit)
        // ============================================================
        const xSignature = request.headers.get('x-signature') || '';
        const xRequestId = request.headers.get('x-request-id') || '';

        try {
            await supabase.schema('billing').from('payment_events').insert({
                provider: 'mercadopago',
                provider_event_id: xRequestId || `ipn-${paymentId}`,
                provider_event_type: eventType,
                order_id: paymentId,
                raw_headers: { 'x-signature': xSignature, 'x-request-id': xRequestId },
                raw_payload: { ...body, _ipn_query: { id: queryId, topic: queryTopic } },
                status: 'RECEIVED',
            });
        } catch (logError) {
            console.error('[MP Webhook] DB Log failed (ignoring):', logError);
        }

        // ============================================================
        // 4. Determine Environment (Sandbox vs Production)
        // ============================================================
        let sandboxMode = false;
        if (typeof body.live_mode === 'boolean') {
            sandboxMode = !body.live_mode;
        } else if (isIPN) {
            // IPN from production doesn't always include live_mode in body
            // Default to production mode for IPN events
            sandboxMode = false;
        } else {
            const { data: flagData } = await supabase.from('feature_flags').select('value').eq('key', 'mp_enabled').single();
            const mpEnabled = flagData?.value ?? true;
            sandboxMode = !mpEnabled;
        }
        console.log(`[MP Webhook] Environment: ${sandboxMode ? 'SANDBOX' : 'PRODUCTION'}`);

        // ============================================================
        // 5. Signature Validation (skip for IPN without x-signature)
        // ============================================================
        if (process.env.NODE_ENV === 'production' && xSignature) {
            // For signature, use data.id from query (V2) or id from query (IPN)
            const signatureDataId = queryDataId || queryId || '';
            const isValid = validateWebhookSignature(xSignature, xRequestId, signatureDataId, sandboxMode);
            if (!isValid) {
                console.error(`[MP Webhook] Invalid Signature! DataID: ${signatureDataId}, RequestID: ${xRequestId}`);
                return NextResponse.json({ received: true, error: 'invalid_signature' });
            }
            console.log('[MP Webhook] Signature Validated ✅');
        } else if (isIPN) {
            console.log('[MP Webhook] IPN format - skipping signature (not provided by IPN system)');
        }

        // ============================================================
        // 6. Process Payment Logic
        // ============================================================
        // Only payment events reach this point (non-payment events exit early above)
        if (paymentId) {
            console.log(`[MP Webhook] Processing payment ID: ${paymentId}...`);
            await handlePaymentEvent(paymentId, supabase, sandboxMode);
            console.log(`[MP Webhook] Processing finished for ${paymentId}.`);
        } else {
            console.log(`[MP Webhook] Skipping: no paymentId found for type=${eventType}`);
        }

        // ============================================================
        // 7. Return 200 OK
        // ============================================================
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('[MP Webhook] Fatal Handler Error:', error);
        return NextResponse.json({ received: true, error: 'fatal_handler_error' });
    }
}
