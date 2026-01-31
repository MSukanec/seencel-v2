import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder, getPayPalOrderDetails } from '@/lib/paypal/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getFeatureFlag } from '@/actions/feature-flags';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // When PayPal is disabled for users (paypal_enabled = false), use sandbox credentials
        const paypalEnabled = await getFeatureFlag('paypal_enabled');
        const sandboxMode = !paypalEnabled;

        // Get order ID from request
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Log the mode being used
        console.log(`[PayPal Capture] orderId=${orderId}, sandboxMode=${sandboxMode}, paypalEnabled=${paypalEnabled}`);

        // Capture the payment
        let captureResult;
        let alreadyCaptured = false;

        try {
            captureResult = await capturePayPalOrder(orderId, sandboxMode);
        } catch (captureError: any) {
            const errorMessage = captureError.message || '';
            console.error('[PayPal Capture] Failed:', errorMessage);

            // Check if the order was already captured (idempotency)
            if (errorMessage.includes('ORDER_ALREADY_CAPTURED')) {
                console.log('[PayPal Capture] Order already captured, treating as success');
                alreadyCaptured = true;
                // Get the order details to continue processing
                try {
                    captureResult = await getPayPalOrderDetails(orderId, sandboxMode);
                    captureResult.status = 'COMPLETED'; // Force status for already captured
                } catch (detailsError: any) {
                    console.error('[PayPal Capture] Failed to get order details:', detailsError.message);
                    return NextResponse.json({
                        error: 'Order already captured but failed to retrieve details',
                        details: detailsError.message
                    }, { status: 400 });
                }
            } else {
                return NextResponse.json({
                    error: errorMessage || 'Failed to capture PayPal payment',
                    details: 'Check server logs for more information'
                }, { status: 400 });
            }
        }

        console.log(`[PayPal Capture] Result status: ${captureResult.status}, alreadyCaptured: ${alreadyCaptured}`);

        if (captureResult.status !== 'COMPLETED') {
            console.error('[PayPal Capture] Not completed:', captureResult);
            return NextResponse.json({
                error: 'Payment not completed',
                status: captureResult.status
            }, { status: 400 });
        }

        // Get order details for custom_id (which is our preference ID)
        const orderDetails = await getPayPalOrderDetails(orderId, sandboxMode);
        const purchaseUnit = orderDetails.purchase_units?.[0];
        const preferenceId = purchaseUnit?.custom_id;

        if (!preferenceId) {
            return NextResponse.json({ error: 'Missing order metadata' }, { status: 400 });
        }

        const adminSupabase = await createAdminClient();

        // Look up preference from database (new pattern using paypal_preferences table)
        const { data: preference, error: prefError } = await adminSupabase
            .from('paypal_preferences')
            .select('*')
            .eq('id', preferenceId)
            .single();

        if (prefError || !preference) {
            console.error('PayPal preference not found:', preferenceId, prefError);
            return NextResponse.json({ error: 'Order metadata not found' }, { status: 400 });
        }

        // Get capture details for payment amount
        const capture = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
        const captureAmount = parseFloat(capture?.amount?.value || '0');
        const captureCurrency = capture?.amount?.currency_code || 'USD';
        const captureId = capture?.id;

        // Get internal user_id from preference (it's already the internal ID)
        const internalUserId = preference.user_id;

        // Log payment event
        await adminSupabase.from('payment_events').insert({
            provider: 'paypal',
            provider_event_id: orderId,
            provider_event_type: 'PAYMENT.CAPTURE.COMPLETED',
            provider_payment_id: captureId,
            order_id: orderId,
            custom_id: preferenceId,
            amount: captureAmount,
            currency: captureCurrency,
            raw_payload: captureResult,
            status: 'PROCESSED',
            processed_at: new Date().toISOString(),
        });

        // Update preference status
        await adminSupabase
            .from('paypal_preferences')
            .update({
                status: 'completed',
                captured_at: new Date().toISOString(),
            })
            .eq('id', preferenceId);

        // Call appropriate handler based on product type
        if (preference.product_type === 'course') {
            const { error } = await adminSupabase.rpc('handle_payment_course_success', {
                p_provider: 'paypal',
                p_provider_payment_id: captureId,
                p_user_id: internalUserId,
                p_course_id: preference.course_id,
                p_amount: captureAmount,
                p_currency: captureCurrency,
                p_metadata: {
                    paypal_order_id: orderId,
                    paypal_capture_id: captureId,
                    preference_id: preferenceId,
                },
            });

            if (error) {
                console.error('handle_payment_course_success error:', error);
                return NextResponse.json({ error: 'Failed to process course payment' }, { status: 500 });
            }

        } else if (preference.product_type === 'subscription') {
            const { error } = await adminSupabase.rpc('handle_payment_subscription_success', {
                p_provider: 'paypal',
                p_provider_payment_id: captureId,
                p_user_id: internalUserId,
                p_organization_id: preference.organization_id,
                p_plan_id: preference.plan_id,
                p_billing_period: preference.billing_period || 'monthly',
                p_amount: captureAmount,
                p_currency: captureCurrency,
                p_metadata: {
                    paypal_order_id: orderId,
                    paypal_capture_id: captureId,
                    preference_id: preferenceId,
                },
            });

            if (error) {
                console.error('handle_payment_subscription_success error:', error);
                return NextResponse.json({ error: 'Failed to process subscription payment' }, { status: 500 });
            }
        }

        // Redeem coupon if applicable
        if (preference.coupon_code && preference.product_type === 'course') {
            await adminSupabase.rpc('redeem_coupon', {
                p_code: preference.coupon_code,
                p_course_id: preference.course_id,
                p_order_id: orderId,
                p_price: captureAmount,
                p_currency: captureCurrency,
            });
        }

        return NextResponse.json({
            success: true,
            orderId,
            captureId,
            status: 'COMPLETED',
        });

    } catch (error: any) {
        console.error('[PayPal Capture] Unhandled error:', error);
        console.error('[PayPal Capture] Error stack:', error?.stack);
        return NextResponse.json(
            { error: error?.message || 'Failed to capture payment', stack: error?.stack },
            { status: 500 }
        );
    }
}
