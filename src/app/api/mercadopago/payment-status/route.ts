import { NextRequest, NextResponse } from 'next/server';
import { paymentApi } from '@/lib/mercadopago/client';

/**
 * GET /api/mercadopago/payment-status?payment_id=xxx
 * 
 * Polling endpoint for pending payments.
 * Returns the current status of a MercadoPago payment.
 */
export async function GET(request: NextRequest) {
    try {
        const paymentId = request.nextUrl.searchParams.get('payment_id');

        if (!paymentId) {
            return NextResponse.json({ error: 'payment_id is required' }, { status: 400 });
        }

        const payment = await paymentApi.get({ id: paymentId });

        return NextResponse.json({
            status: payment.status, // approved, pending, rejected, cancelled, etc.
            status_detail: payment.status_detail,
            product_type: payment.external_reference
                ? payment.external_reference.split('|')[1] || null
                : null,
        });
    } catch (error) {
        console.error('Error checking payment status:', error);
        return NextResponse.json(
            { error: 'Failed to check payment status' },
            { status: 500 }
        );
    }
}
