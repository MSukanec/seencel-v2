/**
 * Server-side verification for Cloudflare Turnstile tokens
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
    success: boolean;
    "error-codes"?: string[];
    challenge_ts?: string;
    hostname?: string;
}

export async function verifyTurnstileToken(token: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    // Allow bypass in development
    if (process.env.NODE_ENV === "development") {
        if (token === "dev-bypass-token" || !secretKey) {
            return { success: true };
        }
    }

    if (!secretKey) {
        console.error("Turnstile: TURNSTILE_SECRET_KEY not set");
        return { success: false, error: "Server configuration error" };
    }

    if (!token) {
        return { success: false, error: "Captcha token missing" };
    }

    try {
        const response = await fetch(TURNSTILE_VERIFY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
            }),
        });

        const data: TurnstileVerifyResponse = await response.json();

        if (data.success) {
            return { success: true };
        } else {
            console.warn("Turnstile verification failed:", data["error-codes"]);
            return {
                success: false,
                error: "Captcha verification failed. Please try again."
            };
        }
    } catch (error) {
        console.error("Turnstile verification error:", error);
        return { success: false, error: "Captcha verification error" };
    }
}
