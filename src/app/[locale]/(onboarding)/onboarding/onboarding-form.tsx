"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { submitOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { CountrySelector, type Country } from "@/components/ui/country-selector";
import { Loader2, User, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/features/auth/components/auth-layout";

// ============================================================
// TIMEZONE → COUNTRY AUTO-DETECTION
// ============================================================

const TIMEZONE_TO_ALPHA2: Record<string, string> = {
    "America/Argentina": "AR",
    "America/Mexico_City": "MX",
    "America/Bogota": "CO",
    "America/Lima": "PE",
    "America/Santiago": "CL",
    "America/Montevideo": "UY",
    "America/Asuncion": "PY",
    "America/La_Paz": "BO",
    "America/Guayaquil": "EC",
    "America/Caracas": "VE",
    "America/Panama": "PA",
    "America/Costa_Rica": "CR",
    "America/Guatemala": "GT",
    "America/Havana": "CU",
    "America/Santo_Domingo": "DO",
    "America/Tegucigalpa": "HN",
    "America/Managua": "NI",
    "America/El_Salvador": "SV",
    "America/Sao_Paulo": "BR",
    "America/New_York": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "America/Los_Angeles": "US",
    "Europe/Madrid": "ES",
};

function detectCountryFromTimezone(): string | null {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!tz) return null;

        // Direct match
        if (TIMEZONE_TO_ALPHA2[tz]) return TIMEZONE_TO_ALPHA2[tz];

        // Argentina has many sub-timezones (America/Argentina/Buenos_Aires, etc.)
        if (tz.startsWith("America/Argentina")) return "AR";

        // Brazil has many sub-timezones
        if (tz.startsWith("America/") && (
            tz.includes("Belem") || tz.includes("Fortaleza") || tz.includes("Recife") ||
            tz.includes("Bahia") || tz.includes("Manaus") || tz.includes("Cuiaba") ||
            tz.includes("Porto_Velho") || tz.includes("Rio_Branco") || tz.includes("Noronha") ||
            tz.includes("Araguaina") || tz.includes("Maceio") || tz.includes("Campo_Grande")
        )) return "BR";

        return null;
    } catch {
        return null;
    }
}

// ============================================================
// COMPONENT
// ============================================================

interface OnboardingFormProps {
    countries: Country[];
}

export default function OnboardingForm({ countries }: OnboardingFormProps) {
    const t = useTranslations("Onboarding");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [countryId, setCountryId] = useState("");

    // Auto-detect country from browser timezone
    useEffect(() => {
        const detectedAlpha2 = detectCountryFromTimezone();
        if (detectedAlpha2 && countries.length > 0) {
            const match = countries.find(c => c.alpha_2 === detectedAlpha2);
            if (match) {
                setCountryId(match.id);
            }
        }
    }, [countries]);

    const handleSubmit = (formData: FormData) => {
        setError(null);

        // Detect Timezone for user preferences
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        formData.append("timezone", timezone);

        // Append country
        if (countryId) {
            formData.append("countryId", countryId);
        }

        startTransition(async () => {
            const result = await submitOnboarding(null, formData);

            if (result?.error) {
                console.error("Onboarding error:", result.message);
                setError("Ocurrió un error inesperado. Por favor intentá nuevamente. Si el problema persiste, contactanos en contacto@seencel.com");
            } else if (result?.success) {
                router.push("/hub");
                router.refresh();
            }
        });
    };

    return (
        <AuthLayout
            title={t("title")}
            description={t("subtitle")}
            mode="onboarding"
        >
            <form action={handleSubmit} className="space-y-8 w-full">

                {/* Personal Info Section */}
                <Section title={t("steps.personal")} icon={<User className="w-5 h-5 text-primary" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label={t("form.firstName")} htmlFor="firstName" required>
                            <Input
                                id="firstName"
                                name="firstName"
                                required
                                className="h-10"
                                placeholder={t("form.firstName")}
                            />
                        </FormGroup>

                        <FormGroup label={t("form.lastName")} htmlFor="lastName" required>
                            <Input
                                id="lastName"
                                name="lastName"
                                required
                                className="h-10"
                                placeholder={t("form.lastName")}
                            />
                        </FormGroup>
                    </div>
                </Section>

                {/* Country Section */}
                <Section title="Ubicación" icon={<Globe className="w-5 h-5 text-primary" />}>
                    <FormGroup label="País" htmlFor="country">
                        <CountrySelector
                            value={countryId}
                            onChange={setCountryId}
                            countries={countries}
                            placeholder="Seleccioná tu país..."
                        />
                    </FormGroup>
                </Section>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="pt-4 space-y-4">
                    <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("form.submit")}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={async () => {
                                const { createClient } = await import("@/lib/supabase/client");
                                const supabase = createClient();
                                await supabase.auth.signOut();
                                router.push("/login");
                                router.refresh();
                            }}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
                        >
                            {t("form.logout") || "¿No eres tú? Cerrar sesión"}
                        </button>
                    </div>
                </div>
            </form>
        </AuthLayout>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
                {icon}
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            </div>
            {children}
        </div>
    );
}
