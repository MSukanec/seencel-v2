import { NextRequest, NextResponse } from 'next/server';
import { createMPClient, validateWebhookSignature } from '@/lib/mercadopago/client';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Get headers for signature validation
        const xSignature = request.headers.get('x-signature') || '';
        const xRequestId = request.headers.get('x-request-id') || '';

        // Get body
        const body = await request.json();
        const { action, data, type } = body;

        // Get data.id for payment
        const dataId = data?.id?.toString() || '';

        // Log event immediately (before validation)
        const supabase = await createAdminClient();
        await supabase.from('payment_events').insert({
            provider: 'mercadopago',
            provider_event_id: xRequestId,
            provider_event_type: type || action,
            order_id: dataId,
            raw_headers: { 'x-signature': xSignature, 'x-request-id': xRequestId },
            raw_payload: body,
            status: 'RECEIVED',
        });

        // Determine sandbox mode: read feature flag directly with admin client
        // (Cannot use getFeatureFlag here — it requires user session cookies)
        const { data: flagData } = await supabase
            .from('feature_flags')
            .select('value')
            .eq('key', 'mp_enabled')
            .single();
        const mpEnabled = flagData?.value ?? true;
        const sandboxMode = !mpEnabled;

        // Validate signature
        if (process.env.NODE_ENV === 'production') {
            const isValid = validateWebhookSignature(xSignature, xRequestId, dataId, sandboxMode);
            if (!isValid) {
                console.error('Invalid webhook signature');
                return NextResponse.json({ received: true, error: 'invalid_signature' });
            }
        }

        // Handle payment events
        if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
            await handlePaymentEvent(dataId, supabase, sandboxMode);
        }

        // Always return 200 to prevent retries
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('MercadoPago webhook error:', error);
        // Still return 200 to prevent endless retries
        return NextResponse.json({ received: true, error: 'processing_error' });
    }
}

async function handlePaymentEvent(paymentId: string, supabase: any, sandboxMode: boolean = false) {
    try {
        // Create MP client with appropriate credentials
        const { paymentApi: mpPaymentApi } = createMPClient(sandboxMode);

        // Fetch payment details from MercadoPago
        const payment = await mpPaymentApi.get({ id: paymentId });

        if (!payment || !payment.external_reference) {
            console.error('Payment not found or no external_reference:', paymentId);
            return;
        }

        // Update payment_events with full data
        await supabase
            .from('payment_events')
            .update({
                status: 'PROCESSED',
                amount: payment.transaction_amount,
                currency: payment.currency_id,
                provider_payment_id: payment.id?.toString(),
                processed_at: new Date().toISOString(),
            })
            .eq('order_id', paymentId);

        // Only process approved payments
        if (payment.status !== 'approved') {
            console.log(`Payment ${paymentId} status: ${payment.status} - skipping`);
            return;
        }

        // Parse external_reference (pipe-delimited format)
        // Format: type|user_id|org_id|product_id|billing_period|coupon_code|is_test|seats_qty|proration_credit
        const parts = payment.external_reference.split('|');
        if (parts.length < 4) {
            console.error('Invalid external_reference format:', payment.external_reference);
            return;
        }

        const [
            product_type,      // 'subscription' | 'course' | 'seats' | 'upgrade'
            user_id,           // auth user UUID
            organization_id,   // org UUID or 'x'
            product_id,        // plan_id or course_id or 'x' for seats
            billing_period,    // 'monthly' | 'annual' | 'x'
            coupon_code,       // coupon code or 'x'
            // is_test         // '1' | '0' - not used in webhook processing
            // seats_qty       // number of seats (only for seats type)
            // proration_credit // upgrade proration credit or 'x'
        ] = parts;

        // Convert 'x' placeholders to null/undefined
        const orgId = organization_id === 'x' ? null : organization_id;
        const period = billing_period === 'x' ? 'monthly' : billing_period;
        const coupon = coupon_code === 'x' ? null : coupon_code;
        const seatsQty = parts[7] && parts[7] !== 'x' ? parseInt(parts[7], 10) : 1;
        const prorationCredit = parts[8] && parts[8] !== 'x' ? parseFloat(parts[8]) : 0;

        // Get internal user_id from auth_id
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user_id)
            .single();

        if (!userData) {
            console.error('User not found for auth_id:', user_id);
            return;
        }

        const internalUserId = userData.id;

        // Call appropriate handler based on product type
        if (product_type === 'course') {
            const { data, error } = await supabase.rpc('handle_payment_course_success', {
                p_provider: 'mercadopago',
                p_provider_payment_id: payment.id?.toString(),
                p_user_id: internalUserId,
                p_course_id: product_id,
                p_amount: payment.transaction_amount,
                p_currency: payment.currency_id || 'ARS',
                p_metadata: { mp_payment_id: payment.id, payer_email: payment.payer?.email },
            });

            if (error) {
                console.error('handle_payment_course_success RPC error:', error);
                // Log RPC error to system_error_logs
                await supabase.from('system_error_logs').insert({
                    domain: 'payment',
                    entity: 'webhook',
                    function_name: 'handle_payment_course_success',
                    error_message: error.message,
                    context: { payment_id: payment.id, user_id: internalUserId, course_id: product_id },
                    severity: 'critical'
                });
            } else {
                console.log('Course payment processed:', data);
                // Check for warning_step (partial failure)
                const result = data as { status: string; warning_step?: string; payment_id?: string };
                if (result.status === 'ok_with_warning' && result.warning_step) {
                    console.warn('⚠️ Course payment had a step failure:', result.warning_step);
                    await supabase.from('system_error_logs').insert({
                        domain: 'payment',
                        entity: 'step_failure',
                        function_name: result.warning_step,
                        error_message: `Step failed during course payment processing`,
                        context: { payment_id: result.payment_id, user_id: internalUserId, course_id: product_id },
                        severity: 'warning'
                    });
                }
            }

        } else if (product_type === 'upgrade') {
            // Handle plan upgrade (Pro → Teams) with proration
            const { data, error } = await supabase.rpc('handle_upgrade_subscription_success', {
                p_provider: 'mercadopago',
                p_provider_payment_id: payment.id?.toString(),
                p_user_id: internalUserId,
                p_organization_id: orgId,
                p_plan_id: product_id,
                p_billing_period: period,
                p_amount: payment.transaction_amount,
                p_currency: payment.currency_id || 'ARS',
                p_metadata: {
                    mp_payment_id: payment.id,
                    payer_email: payment.payer?.email,
                    is_upgrade: true,
                    proration_credit: prorationCredit,
                },
            });

            if (error) {
                console.error('handle_upgrade_subscription_success RPC error:', error);
                await supabase.from('system_error_logs').insert({
                    domain: 'payment',
                    entity: 'webhook',
                    function_name: 'handle_upgrade_subscription_success',
                    error_message: error.message,
                    context: { payment_id: payment.id, user_id: internalUserId, org_id: orgId, plan_id: product_id, proration_credit: prorationCredit },
                    severity: 'critical'
                });
            } else {
                console.log('Upgrade payment processed:', data);
                const result = data as { status: string; warning_step?: string; payment_id?: string; subscription_id?: string };
                if (result.status === 'ok_with_warning' && result.warning_step) {
                    console.warn('⚠️ Upgrade payment had a step failure:', result.warning_step);
                    await supabase.from('system_error_logs').insert({
                        domain: 'payment',
                        entity: 'step_failure',
                        function_name: result.warning_step,
                        error_message: `Step failed during upgrade payment processing`,
                        context: { payment_id: result.payment_id, subscription_id: result.subscription_id, user_id: internalUserId, org_id: orgId, plan_id: product_id },
                        severity: 'warning'
                    });
                }
            }

        } else if (product_type === 'subscription') {
            const { data, error } = await supabase.rpc('handle_payment_subscription_success', {
                p_provider: 'mercadopago',
                p_provider_payment_id: payment.id?.toString(),
                p_user_id: internalUserId,
                p_organization_id: orgId,
                p_plan_id: product_id,
                p_billing_period: period,
                p_amount: payment.transaction_amount,
                p_currency: payment.currency_id || 'ARS',
                p_metadata: { mp_payment_id: payment.id, payer_email: payment.payer?.email },
            });

            if (error) {
                console.error('handle_payment_subscription_success RPC error:', error);
                await supabase.from('system_error_logs').insert({
                    domain: 'payment',
                    entity: 'webhook',
                    function_name: 'handle_payment_subscription_success',
                    error_message: error.message,
                    context: { payment_id: payment.id, user_id: internalUserId, org_id: orgId, plan_id: product_id },
                    severity: 'critical'
                });
            } else {
                console.log('Subscription payment processed:', data);
                // Check for warning_step (partial failure)
                const result = data as { status: string; warning_step?: string; payment_id?: string; subscription_id?: string };
                if (result.status === 'ok_with_warning' && result.warning_step) {
                    console.warn('⚠️ Subscription payment had a step failure:', result.warning_step);
                    await supabase.from('system_error_logs').insert({
                        domain: 'payment',
                        entity: 'step_failure',
                        function_name: result.warning_step,
                        error_message: `Step failed during subscription payment processing`,
                        context: { payment_id: result.payment_id, subscription_id: result.subscription_id, user_id: internalUserId, org_id: orgId, plan_id: product_id },
                        severity: 'warning'
                    });
                }
            }

        } else if (product_type === 'seats') {
            // Handle seat purchase - same RPC as PayPal
            const { data: seatResult, error } = await supabase.rpc('handle_member_seat_purchase', {
                p_provider: 'mercadopago',
                p_provider_payment_id: payment.id?.toString(),
                p_user_id: internalUserId,
                p_organization_id: orgId,
                p_amount: payment.transaction_amount,
                p_currency: payment.currency_id || 'ARS',
                p_seats_purchased: seatsQty,
                p_metadata: { mp_payment_id: payment.id, payer_email: payment.payer?.email },
            });

            if (error) {
                console.error('handle_member_seat_purchase RPC error:', error);
                await supabase.from('system_error_logs').insert({
                    domain: 'payment',
                    entity: 'webhook',
                    function_name: 'handle_member_seat_purchase',
                    error_message: error.message,
                    context: { payment_id: payment.id, user_id: internalUserId, org_id: orgId, seats: seatsQty },
                    severity: 'critical'
                });
            } else {
                console.log('[MP Webhook] Seat purchase result:', seatResult);
            }
        }

        // Update mp_preferences status
        const { data: prefData } = await supabase
            .from('mp_preferences')
            .select('id')
            .eq('user_id', internalUserId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (prefData) {
            await supabase
                .from('mp_preferences')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', prefData.id);
        }

        // Redeem coupon if applicable
        if (coupon) {
            // redeem_coupon expects course-specific params, call only for courses
            // For subscriptions/upgrades, coupon tracking is handled by the preference record
            if (product_type === 'course') {
                await supabase.rpc('redeem_coupon', {
                    p_code: coupon,
                    p_course_id: product_id,
                    p_order_id: payment.id?.toString(),
                    p_price: payment.transaction_amount,
                    p_currency: payment.currency_id || 'ARS',
                });
            }
        }

    } catch (error) {
        console.error('handlePaymentEvent error:', error);
    }
}

// MercadoPago also sends GET requests for validation
export async function GET() {
    return NextResponse.json({ status: 'ok' });
}
