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
            productType,     // 'subscription' | 'course'
            productId,       // plan_id or course_id
            organizationId,  // required for subscriptions
            billingPeriod,   // 'monthly' | 'annual'
            amount,          // in ARS
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

        // Get user email from supabase
        const { data: userData } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('auth_id', user.id)
            .single();

        // Build external_reference with compact format (MP limit: 256 chars)
        // Format: type|user_id|org_id|product_id|billing_period|coupon_code|is_test
        // Use 'x' for null values to keep parsing simple
        const externalReference = [
            productType, // subscription | course
            user.id.slice(0, 36), // auth user UUID
            organizationId || 'x',
            productId.slice(0, 36), // plan_id or course_id
            billingPeriod || 'x',
            couponCode || 'x',
            isTestMode ? '1' : '0',
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

        // Build back URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';
        const successUrl = `${baseUrl}/checkout/success?source=mercadopago`;
        const pendingUrl = `${baseUrl}/checkout/pending?source=mercadopago`;
        const failureUrl = `${baseUrl}/checkout/failure?source=mercadopago`;

        // Create preference
        const preference = await preferenceApi.create({
            body: {
                items: [
                    {
                        id: productId,
                        title: title,
                        quantity: 1,
                        unit_price: finalAmount,
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
