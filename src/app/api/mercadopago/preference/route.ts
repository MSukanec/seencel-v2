import { NextRequest, NextResponse } from 'next/server';
import { preferenceApi } from '@/lib/mercadopago/client';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlag } from '@/actions/feature-flags';

// Test mode price: ~$0.10 USD in ARS (minimum for real testing)
const TEST_PRICE_ARS = 150;

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if test mode is active
        const isTestMode = await getFeatureFlag('mercadopago_modo_test');

        // Get request body
        const body = await request.json();
        const {
            productType,     // 'subscription' | 'course' | 'seats'
            productId,       // plan_id or course_id (not required for seats)
            organizationId,  // required for subscriptions and seats
            billingPeriod,   // 'monthly' | 'annual'
            amount,          // in ARS
            title,           // product title
            couponCode,      // optional
            couponDiscount,  // optional discount amount
            seatsQuantity,   // required for seats
        } = body;

        // Validate required fields
        // productId is required for subscription and course, not for seats
        if (!productType || !amount || !title) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        if (productType !== 'seats' && !productId) {
            return NextResponse.json(
                { error: 'Missing productId for non-seats order' },
                { status: 400 }
            );
        }

        // Get user email from supabase
        const { data: userData } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('auth_id', user.id)
            .single();

        // Build external_reference with compact format (MP limit: 256 chars)
        // Format: type|user_id|org_id|product_id|billing_period|coupon_code|is_test|seats_qty
        // Use 'x' for null values to keep parsing simple
        const externalReference = [
            productType, // subscription | course | seats
            user.id.slice(0, 36), // auth user UUID
            organizationId || 'x',
            productId ? productId.slice(0, 36) : 'x', // plan_id or course_id (x for seats)
            billingPeriod || 'x',
            couponCode || 'x',
            isTestMode ? '1' : '0',
            productType === 'seats' ? String(seatsQuantity || 1) : 'x',
        ].join('|');

        // Validate length (MP max 256)
        if (externalReference.length > 256) {
            console.error('external_reference too long:', externalReference.length);
            return NextResponse.json(
                { error: 'Reference too long' },
                { status: 400 }
            );
        }

        // Calculate final amount - override to test price if test mode is active
        let finalAmount: number;
        if (isTestMode) {
            finalAmount = TEST_PRICE_ARS;
            console.log('[TEST MODE] MercadoPago price overridden to', TEST_PRICE_ARS, 'ARS');
        } else {
            finalAmount = couponDiscount
                ? Math.max(0, amount - couponDiscount)
                : amount;
        }

        // Build back URLs with product info for success page
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';

        // Add product type and ID to success URL for proper routing
        let productParams: string;
        if (productType === 'course') {
            productParams = `product_type=course&course_id=${productId}`;
        } else if (productType === 'seats') {
            productParams = `product_type=seats&org_id=${organizationId || ''}&seats=${seatsQuantity || 1}`;
        } else {
            productParams = `product_type=subscription&org_id=${organizationId || ''}`;
        }

        const successUrl = `${baseUrl}/checkout/success?source=mercadopago&${productParams}`;
        const pendingUrl = `${baseUrl}/checkout/pending?source=mercadopago&${productParams}`;
        const failureUrl = `${baseUrl}/checkout/failure?source=mercadopago&${productParams}`;

        // Create preference
        const preference = await preferenceApi.create({
            body: {
                items: [
                    {
                        id: productId || `seats-${organizationId}`,
                        title: title,
                        quantity: productType === 'seats' ? (seatsQuantity || 1) : 1,
                        unit_price: productType === 'seats' ? Math.round(finalAmount / (seatsQuantity || 1)) : finalAmount,
                        currency_id: 'ARS',
                    }
                ],
                payer: {
                    email: userData?.email || user.email || '',
                    name: userData?.full_name || '',
                },
                external_reference: externalReference,
                back_urls: {
                    success: successUrl,
                    pending: pendingUrl,
                    failure: failureUrl,
                },
                auto_return: 'approved',
                notification_url: `${baseUrl}/api/mercadopago/webhook`,
                statement_descriptor: 'SEENCEL',
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            }
        });

        // Store preference in mp_preferences table
        const { data: internalUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (internalUser && preference.id) {
            await supabase.from('mp_preferences').insert({
                id: preference.id,
                user_id: internalUser.id,
                organization_id: organizationId || null,
                plan_id: productType === 'subscription' ? productId : null,
                course_id: productType === 'course' ? productId : null,
                billing_period: billingPeriod || 'monthly',
                amount: finalAmount,
                currency: 'ARS',
                coupon_id: null, // TODO: look up coupon ID if code provided
                discount_amount: couponDiscount || 0,
                init_point: preference.init_point || null,
                status: 'pending',
                product_type: productType,
                payer_email: userData?.email || user.email || '',
                seats_quantity: productType === 'seats' ? (seatsQuantity || 1) : null,
            });
        }

        return NextResponse.json({
            preference_id: preference.id,
            init_point: preference.init_point,
            sandbox_init_point: preference.sandbox_init_point,
        });

    } catch (error) {
        console.error('MercadoPago preference error:', error);
        return NextResponse.json(
            { error: 'Failed to create preference' },
            { status: 500 }
        );
    }
}
