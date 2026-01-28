import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal/client';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlag } from '@/actions/feature-flags';

// Test mode price: $0.10 USD (minimum for real testing)
const TEST_PRICE_USD = 0.10;

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if test mode is enabled via feature flag
        const isTestMode = await getFeatureFlag('paypal_modo_test');
        // Sandbox uses different credentials (for PayPal sandbox environment)
        const sandboxMode = await getFeatureFlag('paypal_sandbox_mode');

        // Get request body
        const body = await request.json();
        const {
            productType,     // 'subscription' | 'course'
            productId,       // plan_id or course_id
            organizationId,  // required for subscriptions
            billingPeriod,   // 'monthly' | 'annual'
            amount,          // in USD
            title,           // product title
            couponCode,      // optional
            couponDiscount,  // optional discount amount
        } = body;

        // Validate required fields
        if (!productType || !productId || !amount || !title) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Calculate final amount - override to test price if test mode is active
        let finalAmount: number;
        if (isTestMode) {
            finalAmount = TEST_PRICE_USD;
            console.log('[TEST MODE] PayPal price overridden to', TEST_PRICE_USD, 'USD');
        } else {
            finalAmount = couponDiscount
                ? Math.max(0, amount - couponDiscount)
                : amount;
        }

        // Build custom_id with all metadata (similar to MP's external_reference)
        const customId = JSON.stringify({
            user_id: user.id,
            product_type: productType,
            product_id: productId,
            organization_id: organizationId || null,
            billing_period: billingPeriod || null,
            coupon_code: couponCode || null,
            coupon_discount: couponDiscount || null,
            is_test: isTestMode, // Mark as test payment
        });

        // Create PayPal order
        const order = await createPayPalOrder({
            amount: finalAmount,
            currency: 'USD',
            description: isTestMode ? `[TEST] ${title}` : title,
            customId,
            sandboxMode,
        });

        return NextResponse.json({
            orderId: order.id,
            status: order.status,
        });

    } catch (error) {
        console.error('PayPal create order error:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
