import { createMPClient } from './client';

// ============================================================
// external_reference format (pipe-delimited, 256 char max):
// [0] productType  — subscription | course | seats | upgrade
// [1] userId       — users.id (internal UUID, NOT auth_id)
// [2] orgId        — organization UUID or 'x'
// [3] productId    — plan_id or course_id or 'x'
// [4] billingPeriod — monthly | annual | 'x'
// [5] couponCode   — string or 'x'
// [6] isTest       — '1' or '0'
// [7] seatsQty     — number or 'x'
// [8] prorationCredit — number or 'x'
// ============================================================

interface ExternalReferenceData {
    productType: string;
    userId: string | null;
    organizationId: string | null;
    productId: string | null;
    billingPeriod: string | null;
    couponCode: string | null;
    isTest: boolean;
    seatsQty: number | null;
    prorationCredit: number | null;
}

function parseExternalReference(ref: string): ExternalReferenceData {
    const parts = ref.split('|');
    const val = (index: number): string | null => {
        const v = parts[index];
        return v && v !== 'x' ? v : null;
    };

    return {
        productType: parts[0] || 'unknown',
        userId: val(1),
        organizationId: val(2),
        productId: val(3),
        billingPeriod: val(4),
        couponCode: val(5),
        isTest: parts[6] === '1',
        seatsQty: val(7) ? parseInt(parts[7], 10) : null,
        prorationCredit: val(8) ? parseFloat(parts[8]) : null,
    };
}

export async function handlePaymentEvent(paymentId: string, supabase: any, sandboxMode: boolean) {
    console.log(`[MP Handler] Handling payment ${paymentId} (Sandbox: ${sandboxMode})`);

    try {
        // 1. Fetch Payment Details from MercadoPago API
        const { paymentApi } = createMPClient(sandboxMode);
        const paymentData = await paymentApi.get({ id: paymentId });

        if (!paymentData) {
            console.error('[MP Handler] Payment not found in MP API');
            return;
        }

        const { status, transaction_amount, currency_id } = paymentData;

        // 2. Only process approved payments
        if (status !== 'approved') {
            console.log(`[MP Handler] Payment status is ${status}. Skipping logic.`);
            return;
        }

        // 3. Parse external_reference (MP persists this, NOT metadata)
        const rawRef = (paymentData as any).external_reference || '';
        const ref = parseExternalReference(rawRef);
        const { productType, userId, organizationId: orgId, productId, billingPeriod, couponCode } = ref;

        console.log(`[MP Handler] Processing ${productType} for user ${userId}`);
        console.log(`[MP Handler] external_reference parsed:`, JSON.stringify(ref));

        if (!userId) {
            console.error('[MP Handler] Missing user_id in external_reference');
            return;
        }

        // Build metadata object for RPC calls (audit purposes)
        const rpcMetadata = {
            external_reference: rawRef,
            product_type: productType,
            coupon_code: couponCode,
            is_test: ref.isTest,
        };

        // 4. Dispatch to Database RPCs
        let rpcResult;

        if (productType === 'course') {
            const courseId = productId;

            rpcResult = await supabase.rpc('handle_payment_course_success', {
                p_provider: 'mercadopago',
                p_provider_payment_id: paymentId.toString(),
                p_user_id: userId,
                p_course_id: courseId,
                p_amount: transaction_amount,
                p_currency: currency_id || 'ARS',
                p_metadata: rpcMetadata
            });

            // Handle Coupon Redemption if applicable
            if (couponCode && courseId) {
                const redeemResult = await supabase.rpc('redeem_coupon_universal', {
                    p_code: couponCode,
                    p_product_type: 'course',
                    p_product_id: courseId,
                    p_price: transaction_amount,
                    p_currency: currency_id || 'ARS',
                });
                if (redeemResult.error) {
                    console.error('[MP Handler] Coupon redemption failed (non-blocking):', redeemResult.error);
                } else {
                    console.log('[MP Handler] Coupon redeemed:', redeemResult.data);
                }
            }

        } else if (productType === 'subscription') {
            const planId = productId;

            rpcResult = await supabase.rpc('handle_payment_subscription_success', {
                p_provider: 'mercadopago',
                p_provider_payment_id: paymentId.toString(),
                p_user_id: userId,
                p_organization_id: orgId,
                p_plan_id: planId,
                p_amount: transaction_amount,
                p_currency: currency_id || 'ARS',
                p_billing_period: billingPeriod,
                p_metadata: rpcMetadata
            });

        } else if (productType === 'upgrade') {
            const planId = productId;

            rpcResult = await supabase.rpc('handle_upgrade_subscription_success', {
                p_provider: 'mercadopago',
                p_provider_payment_id: paymentId.toString(),
                p_user_id: userId,
                p_organization_id: orgId,
                p_plan_id: planId,
                p_amount: transaction_amount,
                p_currency: currency_id || 'ARS',
                p_billing_period: billingPeriod,
                p_metadata: rpcMetadata
            });

        } else if (productType === 'seat_purchase' || productType === 'seats') {
            const seatsQty = ref.seatsQty;

            // Seats require plan_id — fetch from organization's current plan
            let planId = productId; // might be in external_reference
            if (!planId && orgId) {
                const { data: orgData } = await supabase
                    .schema('iam').from('organizations')
                    .select('plan_id')
                    .eq('id', orgId)
                    .single();
                planId = orgData?.plan_id || null;
            }

            rpcResult = await supabase.rpc('handle_member_seat_purchase', {
                p_provider: 'mercadopago',
                p_provider_payment_id: paymentId.toString(),
                p_user_id: userId,
                p_organization_id: orgId,
                p_plan_id: planId,
                p_seats_purchased: seatsQty,
                p_amount: transaction_amount,
                p_currency: currency_id || 'ARS',
                p_metadata: rpcMetadata
            });
        } else {
            console.warn(`[MP Handler] Unknown product type: ${productType}`);
        }

        if (rpcResult && rpcResult.error) {
            console.error('[MP Handler] RPC Error:', rpcResult.error);
        } else {
            console.log('[MP Handler] RPC Success:', rpcResult?.data);
        }

    } catch (error) {
        console.error('[MP Handler] Processing Failed:', error);
        // Do not throw, so webhook returns 200 via detached promise logic
    }
}
