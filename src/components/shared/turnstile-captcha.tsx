"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, forwardRef, useImperativeHandle } from "react";

interface TurnstileCaptchaProps {
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

export interface TurnstileCaptchaRef {
    reset: () => void;
}

export const TurnstileCaptcha = forwardRef<TurnstileCaptchaRef, TurnstileCaptchaProps>(
    ({ onVerify, onError, onExpire }, ref) => {
        const turnstileRef = useRef<TurnstileInstance>(null);
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

        useImperativeHandle(ref, () => ({
            reset: () => {
                turnstileRef.current?.reset();
            },
        }));

        // Don't render in development if no site key
        if (!siteKey) {
            console.warn("Turnstile: NEXT_PUBLIC_TURNSTILE_SITE_KEY not set");
            // In dev, auto-verify with a dummy token
            if (process.env.NODE_ENV === "development") {
                // Auto-call onVerify with test token after a short delay
                setTimeout(() => onVerify("dev-bypass-token"), 100);
            }
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
