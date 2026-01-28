import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Initialize MercadoPago client with access token
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined');
}

export const mercadoPagoClient = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 }
});

// Export pre-configured API instances
export const preferenceApi = new Preference(mercadoPagoClient);
export const paymentApi = new Payment(mercadoPagoClient);

// Webhook signature validation
export function validateWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string
): boolean {
    const crypto = require('crypto');
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!secret) {
        console.error('MERCADOPAGO_WEBHOOK_SECRET is not defined');
        return false;
    }

    // Parse x-signature header: ts=xxx,v1=xxx
    const parts = xSignature.split(',');
    const tsMatch = parts.find(p => p.startsWith('ts='));
    const v1Match = parts.find(p => p.startsWith('v1='));

    if (!tsMatch || !v1Match) {
        return false;
    }

    const ts = tsMatch.replace('ts=', '');
    const v1 = v1Match.replace('v1=', '');

    // Build the manifest string
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Calculate HMAC
    const hmac = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

    return hmac === v1;
}
