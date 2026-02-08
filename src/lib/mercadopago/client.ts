import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// ============================================================
// MercadoPago Client — Dynamic Sandbox/Production Mode
// Pattern: Same as PayPal client (lib/paypal/client.ts)
// ============================================================

/**
 * Get MercadoPago config based on sandbox mode
 * sandboxMode = true  → uses SANDBOX credentials (for testing)
 * sandboxMode = false → uses PRODUCTION credentials (real payments)
 */
export function getMPConfig(sandboxMode: boolean = false) {
    if (sandboxMode) {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN_SANDBOX;
        if (!accessToken) {
            throw new Error('MERCADOPAGO_ACCESS_TOKEN_SANDBOX is not defined');
        }
        return {
            accessToken,
            webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET_SANDBOX || process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
            environment: 'sandbox' as const,
        };
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined');
    }
    return {
        accessToken,
        webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
        environment: 'production' as const,
    };
}

/**
 * Create a MercadoPago client instance for the given mode
 */
export function createMPClient(sandboxMode: boolean = false) {
    const config = getMPConfig(sandboxMode);
    const client = new MercadoPagoConfig({
        accessToken: config.accessToken,
        options: { timeout: 5000 }
    });

    return {
        client,
        preferenceApi: new Preference(client),
        paymentApi: new Payment(client),
        environment: config.environment,
    };
}

// ============================================================
// Legacy exports (backward compatible)
// Default to production credentials for any code that still
// imports the singleton. Will be removed once all callers migrate.
// ============================================================
const defaultConfig = getMPConfig(false);
export const mercadoPagoClient = new MercadoPagoConfig({
    accessToken: defaultConfig.accessToken,
    options: { timeout: 5000 }
});
export const preferenceApi = new Preference(mercadoPagoClient);
export const paymentApi = new Payment(mercadoPagoClient);

// Webhook signature validation
export function validateWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
    sandboxMode: boolean = false
): boolean {
    const crypto = require('crypto');
    const config = getMPConfig(sandboxMode);
    const secret = config.webhookSecret;

    if (!secret) {
        console.error('MercadoPago webhook secret is not defined');
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
