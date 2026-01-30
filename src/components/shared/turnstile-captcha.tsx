"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";

interface TurnstileCaptchaProps {
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

export interface TurnstileCaptchaRef {
    reset: () => void;
}

/**
 * Cloudflare Turnstile CAPTCHA component.
 * 
 * CURRENTLY DISABLED: Auto-bypasses if NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.
 * To enable: Add the env vars and the widget will appear automatically.
 * 
 * See: src/features/emails/README.md for setup instructions.
 */
export const TurnstileCaptcha = forwardRef<TurnstileCaptchaRef, TurnstileCaptchaProps>(
    ({ onVerify, onError, onExpire }, ref) => {
        const turnstileRef = useRef<TurnstileInstance>(null);
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

        useImperativeHandle(ref, () => ({
            reset: () => {
                turnstileRef.current?.reset();
            },
        }));

        // BYPASS: If no site key configured, auto-verify immediately
        // This allows registration to work without Turnstile configured
        useEffect(() => {
            if (!siteKey) {
                // Auto-call onVerify with bypass token
                onVerify("turnstile-not-configured-bypass");
            }
        }, [siteKey, onVerify]);

        // Don't render widget if no site key
        if (!siteKey) {
            return null;
        }

        return (
            <div className="flex justify-center my-4">
                <Turnstile
                    ref={turnstileRef}
                    siteKey={siteKey}
                    onSuccess={onVerify}
                    onError={onError}
                    onExpire={onExpire}
                    options={{
                        theme: "auto",
                        size: "normal",
                    }}
                />
            </div>
        );
    }
);

TurnstileCaptcha.displayName = "TurnstileCaptcha";

