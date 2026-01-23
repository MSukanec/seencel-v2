"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface TOTPSetupProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function TOTPSetup({ onSuccess, onCancel }: TOTPSetupProps) {
    const t = useTranslations('Settings.Security'); // Assuming we'll add keys here
    const [step, setStep] = React.useState<"init" | "qr" | "verify">("init");
    const [factorId, setFactorId] = React.useState<string>("");
    const [qrCode, setQrCode] = React.useState<string>("");
    const [secret, setSecret] = React.useState<string>("");
    const [verifyCode, setVerifyCode] = React.useState("");
    const [error, setError] = React.useState<string>("");
    const [isLoading, setIsLoading] = React.useState(false);

    const supabase = createClient();

    const startEnrollment = async () => {
        setIsLoading(true);
        setError("");
        try {
            // First, clean up any stale/unverified TOTP factors
            const { data: existingFactors } = await supabase.auth.mfa.listFactors();
            const unverifiedTOTP = existingFactors?.all?.filter(
                (f: any) => f.factor_type === 'totp' && f.status !== 'verified'
            ) || [];

            for (const factor of unverifiedTOTP) {
                await supabase.auth.mfa.unenroll({ factorId: factor.id });
            }

            // Enroll with a unique friendly name
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                friendlyName: `SEENCEL-${Date.now()}`
            });

            if (error) throw error;

            setFactorId(data.id);
            setQrCode(data.totp.uri);
            setSecret(data.totp.secret);
            setStep("qr");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        if (!verifyCode) return;
        setIsLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code: verifyCode,
            });

            if (error) throw error;

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-start enrollment on mount
    React.useEffect(() => {
        startEnrollment();
    }, []);

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            {/* Loading State */}
            {step === "init" && (
                <div className="flex flex-col items-center justify-center p-8 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t('preparing')}</p>
                </div>
            )}

            {/* Error State (shown in any step) */}
            {error && step === "init" && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('error')}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {step === "qr" && (
                <div className="space-y-4">
                    <div className="text-sm">
                        <p className="font-medium">{t('scanQR')}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                            {t('scanQRDesc')}
                        </p>
                    </div>

                    <div className="flex justify-center bg-white p-4 rounded-lg w-fit mx-auto border">
                        {qrCode ? (
                            <QRCodeSVG value={qrCode} size={160} />
                        ) : (
                            <Loader2 className="h-20 w-20 animate-spin text-muted" />
                        )}
                    </div>

                    <div className="text-xs text-center text-muted-foreground break-all font-mono bg-muted p-2 rounded">
                        {t('secretLabel')}: {secret}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-medium">{t('enterCode')}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="code"
                                placeholder="000000"
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="font-mono text-center tracking-widest text-lg"
                                maxLength={6}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') verifyAndEnable();
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t('error')}</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={verifyAndEnable} disabled={isLoading || verifyCode.length !== 6}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('enable2FA')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

