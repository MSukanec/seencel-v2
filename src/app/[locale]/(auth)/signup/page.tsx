"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Mail, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { GoogleAuthButton } from "@/features/auth/components/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/actions/auth/register";
import { getAcquisitionParams, type AcquisitionParams } from "@/lib/acquisition-params";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
    const t = useTranslations("Auth.Register");
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState<{ success?: boolean; error?: string } | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);

    // Acquisition params from sessionStorage
    const [acquisitionParams, setAcquisitionParams] = useState<AcquisitionParams>({
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_content: null,
        landing_page: null,
        referrer: null,
    });

    // Load acquisition params and check feature flag on mount
    useEffect(() => {
        setAcquisitionParams(getAcquisitionParams());

        // Check if registration is enabled (blocks ALL methods)
        const checkFeatureFlag = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('feature_flags')
                .select('status')
                .eq('key', 'auth_registration_enabled')
                .single();

            setRegistrationEnabled(data?.status === 'active');
        };
        checkFeatureFlag();
    }, []);

    const passwordsMatch = password === confirmPassword;
    const canSubmit = password.length > 0 && confirmPassword.length > 0 && passwordsMatch;

    const handleSubmit = (formData: FormData) => {
        // Client-side validation for password match
        if (!passwordsMatch) {
            setState({ error: t("passwordMismatch") || "Las contraseñas no coinciden" });
            return;
        }

        setState(null);
        // Preserve email from form data
        const emailValue = formData.get("email") as string;
        if (emailValue) setEmail(emailValue);

        startTransition(async () => {
            const result = await registerUser(null, formData);
            if (result?.error) {
                // Map server error codes to localized messages
                let errorMessage = t("genericError");
                if (result.error === "weak_password") errorMessage = t("weakPassword");
                if (result.error === "invalid_domain") errorMessage = t("invalidEmail");
                if (result.error === "email_taken") errorMessage = t("emailTaken");
                if (result.error === "registration_blocked") errorMessage = "El registro está temporalmente deshabilitado.";

                setState({ error: errorMessage });
            } else if (result?.success) {
                setState({ success: true });
            }
        });
    };

    return (
        <AuthLayout
            title={t("title")}
            description={t("subtitle")}
            mode="register"
        >
            <div className="grid gap-4">
                {/* Alerta cuando el registro está deshabilitado */}
                {registrationEnabled === false && (
                    <Alert className="bg-orange-500/10 border-orange-500/20 text-orange-600">
                        <AlertCircle className="h-4 w-4 !text-orange-600" />
                        <AlertDescription className="ml-2">
                            El registro de nuevos usuarios está temporalmente deshabilitado.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Google - bloqueado por feature flag */}
                <GoogleAuthButton text={t("googleButton")} disabled={registrationEnabled === false} />

                {!showEmailForm ? (
                    <>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    {t("orEmail")}
                                </span>
                            </div>
                        </div>

                        {/* Botón de Email - bloqueado por feature flag */}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowEmailForm(true)}
                            disabled={registrationEnabled === false}
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Continuar con Email
                        </Button>
                    </>
                ) : (
                    <>
                        {/* Botón para volver */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-fit -mb-2"
                            onClick={() => {
                                setShowEmailForm(false);
                                setState(null);
                            }}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Volver a opciones
                        </Button>

                        {state?.success ? (
                            <Alert className="bg-green-500/10 border-green-500/20 text-green-600">
                                <CheckCircle className="h-4 w-4 !text-green-600" />
                                <AlertTitle className="ml-2 font-semibold">
                                    {t("successTitle")}
                                </AlertTitle>
                                <AlertDescription className="ml-2 mt-1">
                                    {t("successMessage")}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <form action={handleSubmit} className="grid gap-4">
                                {/* Honeypot field - hidden from real users */}
                                <div className="hidden" aria-hidden="true">
                                    <input
                                        name="website_url"
                                        tabIndex={-1}
                                        autoComplete="off"
                                    />
                                </div>

                                {/* UTM Acquisition Hidden Fields */}
                                <input type="hidden" name="utm_source" value={acquisitionParams.utm_source || ""} />
                                <input type="hidden" name="utm_medium" value={acquisitionParams.utm_medium || ""} />
                                <input type="hidden" name="utm_campaign" value={acquisitionParams.utm_campaign || ""} />
                                <input type="hidden" name="utm_content" value={acquisitionParams.utm_content || ""} />
                                <input type="hidden" name="landing_page" value={acquisitionParams.landing_page || ""} />
                                <input type="hidden" name="referrer" value={acquisitionParams.referrer || ""} />

                                <div className="grid gap-2">
                                    <Label htmlFor="email">{t("emailLabel")}</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder={t("emailPlaceholder")}
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">{t("passwordLabel")}</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder={t("passwordPlaceholder")}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder={t("confirmPasswordPlaceholder")}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {confirmPassword.length > 0 && !passwordsMatch && (
                                        <p className="text-xs text-destructive">{t("passwordMismatch")}</p>
                                    )}
                                </div>

                                {state?.error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4 !text-destructive" />
                                        <AlertDescription>{state.error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button type="submit" disabled={isPending || !canSubmit} className="w-full">
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t("submitButton")}
                                </Button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </AuthLayout>
    );
}
