// PayPal API Client
// Uses feature flag 'paypal_sandbox_mode' to switch between sandbox and production

const PAYPAL_API_SANDBOX = 'https://api-m.sandbox.paypal.com';
const PAYPAL_API_PRODUCTION = 'https://api-m.paypal.com';

/**
 * Get PayPal credentials based on sandbox mode
 */
export function getPayPalConfig(sandboxMode: boolean = false) {
    if (sandboxMode) {
        return {
            clientId: process.env.PAYPAL_CLIENT_ID_SANDBOX!,
            clientSecret: process.env.PAYPAL_CLIENT_SECRET_SANDBOX!,
            apiBase: PAYPAL_API_SANDBOX,
            environment: 'sandbox' as const,
        };
    }
    return {
        clientId: process.env.PAYPAL_CLIENT_ID!,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
        apiBase: PAYPAL_API_PRODUCTION,
        environment: 'production' as const,
    };
}

/**
 * Get PayPal access token
 */
export async function getPayPalAccessToken(sandboxMode: boolean = false): Promise<string> {
    const config = getPayPalConfig(sandboxMode);

    const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

    const response = await fetch(`${config.apiBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal auth failed: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Create PayPal order
 */
export async function createPayPalOrder({
    amount,
    currency = 'USD',
    description,
    customId,
    sandboxMode = false,
}: {
    amount: number;
    currency?: string;
    description: string;
    customId: string; // JSON string with metadata
    sandboxMode?: boolean;
}) {
    const config = getPayPalConfig(sandboxMode);
    const accessToken = await getPayPalAccessToken(sandboxMode);

    const response = await fetch(`${config.apiBase}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: currency,
                        value: amount.toFixed(2),
                    },
                    description,
                    custom_id: customId,
                },
            ],
            application_context: {
                brand_name: 'SEENCEL',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal create order failed: ${error}`);
    }

    return response.json();
}

/**
 * Capture PayPal order (after user approves)
 */
export async function capturePayPalOrder(orderId: string, sandboxMode: boolean = false) {
    const config = getPayPalConfig(sandboxMode);
    const accessToken = await getPayPalAccessToken(sandboxMode);

    const response = await fetch(`${config.apiBase}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal capture failed: ${error}`);
    }

    return response.json();
}

/**
 * Get order details
 */
export async function getPayPalOrderDetails(orderId: string, sandboxMode: boolean = false) {
    const config = getPayPalConfig(sandboxMode);
    const accessToken = await getPayPalAccessToken(sandboxMode);

    const response = await fetch(`${config.apiBase}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal get order failed: ${error}`);
    }

    return response.json();
}
