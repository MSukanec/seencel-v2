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

        // Check if sandbox mode is enabled
        const sandboxMode = await getFeatureFlag('paypal_sandbox_mode');

        // Get order ID from request
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Capture the payment
        const captureResult = await capturePayPalOrder(orderId, sandboxMode);

        if (captureResult.status !== 'COMPLETED') {
            return NextResponse.json({
                error: 'Payment not completed',
                status: captureResult.status
            }, { status: 400 });
        }

        // Get order details for metadata
        const orderDetails = await getPayPalOrderDetails(orderId, sandboxMode);
        const purchaseUnit = orderDetails.purchase_units?.[0];
        const customId = purchaseUnit?.custom_id;

        if (!customId) {
            return NextResponse.json({ error: 'Missing order metadata' }, { status: 400 });
        }

        // Parse metadata
        let metadata;
        try {
            metadata = JSON.parse(customId);
        } catch {
            return NextResponse.json({ error: 'Invalid order metadata' }, { status: 400 });
        }

        const {
            product_type,
            product_id,
            organization_id,
            billing_period,
            coupon_code,
        } = metadata;

        // Get capture details for payment amount
        const capture = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
        const captureAmount = parseFloat(capture?.amount?.value || '0');
        const captureCurrency = capture?.amount?.currency_code || 'USD';
        const captureId = capture?.id;

        // Get internal user_id
        const adminSupabase = await createAdminClient();
        const { data: userData } = await adminSupabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 400 });
        }

        const internalUserId = userData.id;

        // Log payment event
        await adminSupabase.from('payment_events').insert({
            provider: 'paypal',
            provider_event_id: orderId,
            provider_event_type: 'PAYMENT.CAPTURE.COMPLETED',
            provider_payment_id: captureId,
            order_id: orderId,
            amount: captureAmount,
            currency: captureCurrency,
            raw_payload: captureResult,
            status: 'PROCESSED',
            processed_at: new Date().toISOString(),
        });

        // Call appropriate handler based on product type
        if (product_type === 'course') {
            const { data, error } = await adminSupabase.rpc('handle_payment_course_success', {
                p_provider: 'paypal',
                p_provider_payment_id: captureId,
                p_user_id: internalUserId,
                p_course_id: product_id,
                p_amount: captureAmount,
                p_currency: captureCurrency,
                p_metadata: { paypal_order_id: orderId, paypal_capture_id: captureId },
            });

            if (error) {
                console.error('handle_payment_course_success error:', error);
                return NextResponse.json({ error: 'Failed to process course payment' }, { status: 500 });
            }

        } else if (product_type === 'subscription') {
            const { data, error } = await adminSupabase.rpc('handle_payment_subscription_success', {
                p_provider: 'paypal',
                p_provider_payment_id: captureId,
                p_user_id: internalUserId,
                p_organization_id: organization_id,
                p_plan_id: product_id,
                p_billing_period: billing_period || 'monthly',
                p_amount: captureAmount,
                p_currency: captureCurrency,
                p_metadata: { paypal_order_id: orderId, paypal_capture_id: captureId },
            });

            if (error) {
                console.error('handle_payment_subscription_success error:', error);
                return NextResponse.json({ error: 'Failed to process subscription payment' }, { status: 500 });
            }
        }

        // Redeem coupon if applicable
        if (coupon_code && product_type === 'course') {
            await adminSupabase.rpc('redeem_coupon', {
                p_code: coupon_code,
                p_course_id: product_id,
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

    } catch (error) {
        console.error('PayPal capture error:', error);
        return NextResponse.json(
            { error: 'Failed to capture payment' },
            { status: 500 }
        );
    }
}
