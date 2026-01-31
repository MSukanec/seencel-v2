import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal/client';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlag } from '@/actions/feature-flags';
import crypto from 'crypto';

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

        // Check if PayPal is enabled
        // When disabled (paypal_enabled = false): use sandbox credentials + test prices
        // When enabled (paypal_enabled = true): use production credentials + real prices
        const paypalEnabled = await getFeatureFlag('paypal_enabled');
        const sandboxMode = !paypalEnabled;
        const isTestMode = !paypalEnabled; // Same logic - disabled = test mode

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

        // Generate a short unique ID for paypal_preferences (fits in PayPal's 127 char limit)
        const preferenceId = crypto.randomUUID().replace(/-/g, '').substring(0, 21); // 21 chars, URL-safe

        // Get coupon_id if coupon code was provided
        let couponId: string | null = null;
        if (couponCode) {
            const { data: coupon } = await supabase
                .from('coupons')
                .select('id')
                .ilike('code', couponCode)
                .single();
            couponId = coupon?.id || null;
        }

        // Get plan slug if this is a subscription
        let planSlug: string | null = null;
        if (productType === 'subscription') {
            const { data: plan } = await supabase
                .from('plans')
                .select('slug')
                .eq('id', productId)
                .single();
            planSlug = plan?.slug || null;
        }

        // Get internal user_id (users.id) from auth_id (same pattern as MercadoPago)
        const { data: internalUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!internalUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 400 }
            );
        }

        // Save preference to database (similar to mp_preferences pattern)
        const { error: insertError } = await supabase
            .from('paypal_preferences')
            .insert({
                id: preferenceId,
                user_id: internalUser.id,
                organization_id: productType === 'subscription' ? organizationId : null,
                plan_id: productType === 'subscription' ? productId : null,
                plan_slug: planSlug,
                billing_period: billingPeriod || null,
                amount: finalAmount,
                currency: 'USD',
                product_type: productType,
                course_id: productType === 'course' ? productId : null,
                coupon_id: couponId,
                coupon_code: couponCode || null,
                discount_amount: couponDiscount || 0,
                is_test: isTestMode,
                is_sandbox: sandboxMode,
                status: 'pending',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
            });

        if (insertError) {
            console.error('Error saving PayPal preference:', insertError);
            return NextResponse.json(
                { error: 'Failed to save order data' },
                { status: 500 }
            );
        }

        // Create PayPal order with preference ID as custom_id
        const order = await createPayPalOrder({
            amount: finalAmount,
            currency: 'USD',
            description: isTestMode ? `[TEST] ${title}` : title,
            customId: preferenceId, // Short ID that fits PayPal's limit
            sandboxMode,
        });

        // Update preference with PayPal order ID
        await supabase
            .from('paypal_preferences')
            .update({ order_id: order.id })
            .eq('id', preferenceId);

        // Find the approval URL from PayPal's response links
        const approveLink = order.links?.find(
            (link: { rel: string; href: string }) => link.rel === 'approve'
        );

        return NextResponse.json({
            orderId: order.id,
            status: order.status,
            approveUrl: approveLink?.href || null,
        });

    } catch (error) {
        console.error('PayPal create order error:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
