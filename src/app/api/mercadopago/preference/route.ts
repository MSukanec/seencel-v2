import { NextRequest, NextResponse } from 'next/server';
import { createMPClient } from '@/lib/mercadopago/client';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlag } from '@/actions/feature-flags';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if MP is enabled (same pattern as PayPal)
        // When disabled (mp_enabled = false): use sandbox credentials
        // When enabled (mp_enabled = true): use production credentials
        const mpEnabled = await getFeatureFlag('mp_enabled');
        const sandboxMode = !mpEnabled;
        const isTestMode = sandboxMode;

        // Create MP client with appropriate credentials
        const { preferenceApi: mpPreferenceApi } = createMPClient(sandboxMode);

        // Get request body
        const body = await request.json();
        const {
            productType,     // 'subscription' | 'course' | 'seats' | 'upgrade'
            productId,       // plan_id or course_id (not required for seats)
            organizationId,  // required for subscriptions, seats, and upgrades
            billingPeriod,   // 'monthly' | 'annual'
            amount,          // in ARS
            title,           // product title
            couponCode,      // optional
            couponDiscount,  // optional discount amount
            seatsQuantity,   // required for seats
            // Upgrade-specific fields
            is_upgrade,      // boolean - true if this is a plan upgrade
            proration_credit, // number - credit from current plan
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

        // Get internal user (users.id) — NEVER use auth_id as FK (Rule 6)
        const { data: internalUser } = await supabase
            .schema('iam').from('users')
            .select('id, email, full_name')
            .eq('auth_id', user.id)
            .single();

        if (!internalUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Build external_reference with compact format (MP limit: 256 chars)
        // Format: type|user_id|org_id|product_id|billing_period|coupon_code|is_test|seats_qty|proration_credit
        // user_id = users.id (internal), NOT auth_id
        // Use 'x' for null values to keep parsing simple
        const externalReference = [
            productType, // subscription | course | seats | upgrade
            internalUser.id, // users.id (internal UUID)
            organizationId || 'x',
            productId ? productId.slice(0, 36) : 'x', // plan_id or course_id (x for seats)
            billingPeriod || 'x',
            couponCode || 'x',
            isTestMode ? '1' : '0',
            productType === 'seats' ? String(seatsQuantity || 1) : 'x',
            productType === 'upgrade' && proration_credit ? String(proration_credit) : 'x',
        ].join('|');

        // Validate length (MP max 256)
        if (externalReference.length > 256) {
            console.error('external_reference too long:', externalReference.length);
            return NextResponse.json(
                { error: 'Reference too long' },
                { status: 400 }
            );
        }

        // The frontend sends `amount` = computed.finalPrice * exchangeRate (already discounted).
        // couponDiscount is metadata only — DO NOT subtract it again.
        const finalAmount = amount;

        if (sandboxMode) {
            console.log(`[MP SANDBOX] Using sandbox credentials, amount: ${finalAmount} ARS`);
        }

        // Build back URLs with product info for success page
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';

        // Add product type and ID to success URL for proper routing
        let productParams: string;
        if (productType === 'course') {
            productParams = `product_type=course&course_id=${productId}`;
        } else if (productType === 'seats') {
            productParams = `product_type=seats&org_id=${organizationId || ''}&seats=${seatsQuantity || 1}`;
        } else if (productType === 'upgrade') {
            productParams = `product_type=upgrade&org_id=${organizationId || ''}`;
        } else {
            productParams = `product_type=subscription&org_id=${organizationId || ''}`;
        }

        const successUrl = `${baseUrl}/checkout/success?source=mercadopago&${productParams}`;
        const pendingUrl = `${baseUrl}/checkout/pending?source=mercadopago&${productParams}`;
        const failureUrl = `${baseUrl}/checkout/failure?source=mercadopago&${productParams}`;

        // Create preference
        // Note: MercadoPago rejects localhost URLs for back_urls/auto_return/notification_url
        const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
        const preference = await mpPreferenceApi.create({
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
                    email: internalUser.email || user.email || '',
                    name: internalUser.full_name || '',
                },
                external_reference: externalReference,
                // Only set back_urls and auto_return for non-localhost (MP rejects localhost)
                ...(isLocalhost ? {} : {
                    back_urls: {
                        success: successUrl,
                        pending: pendingUrl,
                        failure: failureUrl,
                    },
                    auto_return: 'approved' as const,
                    notification_url: `${baseUrl}/api/mercadopago/webhook`,
                }),
                statement_descriptor: 'SEENCEL',
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            }
        });

        // Resolve coupon_id from code if provided
        let couponId: string | null = null;
        if (couponCode) {
            const { data: coupon } = await supabase
                .schema('billing').from('coupons')
                .select('id')
                .ilike('code', couponCode)
                .single();
            couponId = coupon?.id || null;
        }

        // Store preference in mp_preferences table
        if (preference.id) {
            await supabase.schema('billing').from('mp_preferences').insert({
                id: preference.id,
                user_id: internalUser.id,
                organization_id: organizationId || null,
                plan_id: (productType === 'subscription' || productType === 'upgrade') ? productId : null,
                course_id: productType === 'course' ? productId : null,
                billing_period: billingPeriod || 'monthly',
                amount: finalAmount,
                currency: 'ARS',
                coupon_id: couponId,
                discount_amount: couponDiscount || 0,
                init_point: preference.init_point || null,
                status: 'pending',
                product_type: productType,
                payer_email: internalUser.email || user.email || '',
                seats_quantity: productType === 'seats' ? (seatsQuantity || 1) : null,
                is_sandbox: sandboxMode,
                is_test: isTestMode,
            });
        }

        return NextResponse.json({
            preference_id: preference.id,
            init_point: preference.init_point,
            sandbox_init_point: preference.sandbox_init_point,
        });

    } catch (error) {
        console.error('MercadoPago preference error (full):', JSON.stringify(error, null, 2));
        console.error('MercadoPago preference error (raw):', error);
        let errorMessage = 'Failed to create preference';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
            errorMessage = (error as any).message || (error as any).cause || JSON.stringify(error);
        }
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
