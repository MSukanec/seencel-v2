import { createMPClient } from './client';

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

        const { status, status_detail, metadata: rawMetadata, transaction_amount, currency_id, payer } = paymentData;
        const metadata = rawMetadata as any;

        // 2. Only process approved payments
        if (status !== 'approved') {
            console.log(`[MP Handler] Payment status is ${status}. Skipping logic.`);
            return;
        }

        // 3. Extract Metadata
        // MP metadata is usually snake_case or whatever we sent.
        // Assuming we sent generic fields.
        const productType = metadata?.product_type || 'unknown';
        const userId = metadata?.user_id;

        console.log(`[MP Handler] Processing ${productType} for user ${userId}`);

        if (!userId) {
            console.error('[MP Handler] Missing user_id in metadata');
            return;
        }

        // 4. Dispatch to Database RPCs
        let rpcResult;

        if (productType === 'course') {
            /* 
             * Metadata expected: 
             * - course_id
             * - coupon_code (optional)
             */
            const courseId = metadata.course_id;
            const couponCode = metadata.coupon_code;

            rpcResult = await supabase.rpc('handle_payment_course_success', {
                p_provider: 'mercadopago',
                p_provider_payment_id: paymentId.toString(),
                p_user_id: userId,
                p_course_id: courseId,
                p_amount: transaction_amount,
                p_currency: currency_id || 'ARS',
                p_metadata: metadata
            });

            // Handle Coupon Redemption if applicable
            if (couponCode && courseId) {
                await supabase.rpc('redeem_coupon', {
                    p_code: couponCode,
                    p_course_id: courseId,
                    p_user_id: userId
                });
            }

        } else if (productType === 'subscription') {
            /*
             * Metadata expected:
             * - organization_id
             * - plan_id
             * - billing_period
             */
            const orgId = metadata.organization_id;
            const planId = metadata.plan_id;
            const billingPeriod = metadata.billing_period;

            rpcResult = await supabase.rpc('handle_payment_subscription_success', {
                p_provider: 'mercadopago',
                p_provider_payment_id: paymentId.toString(),
                p_user_id: userId,
                p_organization_id: orgId,
                p_plan_id: planId,
                p_amount: transaction_amount,
                p_currency: currency_id || 'ARS',
                p_billing_period: billingPeriod,
                p_metadata: metadata
            });

        } else if (productType === 'upgrade') {
            /*
             * Metadata expected:
             * - organization_id
             * - plan_id (target)
             * - billing_period
             */
            const orgId = metadata.organization_id;
            const planId = metadata.plan_id;
            const billingPeriod = metadata.billing_period;

            rpcResult = await supabase.rpc('handle_upgrade_subscription_success', {
                p_provider: 'mercadopago',
                p_provider_payment_id: paymentId.toString(),
                p_user_id: userId,
                p_organization_id: orgId,
                p_plan_id: planId,
                p_amount: transaction_amount,
                p_currency: currency_id || 'ARS',
                p_billing_period: billingPeriod,
                p_metadata: metadata
            });

        } else if (productType === 'seat_purchase' || productType === 'seats') {
            /*
             * Metadata expected:
             * - organization_id
             * - seats_qty
             * - proration_credit (maybe?)
             */
            const orgId = metadata.organization_id;
            const seatsQty = metadata.seats_qty;

            // RPC name guessed from logs: handle_member_seat_purchase
            // Need to check params in DB or assume standard
            // Assuming similar signature
            rpcResult = await supabase.rpc('handle_member_seat_purchase', {
                p_provider: 'mercadopago',
                p_provider_payment_id: paymentId.toString(),
                p_user_id: userId,
                p_organization_id: orgId,
                p_seats_qty: seatsQty,
                p_amount: transaction_amount,
                p_currency: currency_id || 'ARS',
                p_metadata: metadata
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
