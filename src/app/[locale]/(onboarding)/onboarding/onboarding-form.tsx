"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { submitOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { Loader2, Building2, User, Coins, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Available currencies for selection - SORTED ALPHABETICALLY BY NAME
const AVAILABLE_CURRENCIES = [
    { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$', country: 'US' },
    { code: 'EUR', name: 'Euro', symbol: '€', country: 'ES' },
    { code: 'ARS', name: 'Peso Argentino', symbol: '$', country: 'AR' },
    { code: 'CLP', name: 'Peso Chileno', symbol: '$', country: 'CL' },
    { code: 'COP', name: 'Peso Colombiano', symbol: '$', country: 'CO' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: '$', country: 'MX' },
    { code: 'UYU', name: 'Peso Uruguayo', symbol: '$', country: 'UY' },
    { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', country: 'BR' },
    { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', country: 'PE' },
];

// Map browser locale to currency code
function detectCurrencyFromLocale(): string {
    if (typeof navigator === 'undefined') return 'ARS';

    const locale = navigator.language || 'es-AR';
    const countryCode = locale.split('-')[1]?.toUpperCase() || '';

    const match = AVAILABLE_CURRENCIES.find(c => c.country === countryCode);
    return match?.code || 'ARS'; // Default to ARS
}

export default function OnboardingForm({ countryCode }: { countryCode?: string }) {
    const t = useTranslations("Onboarding");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Server-safe initialization (prop only)
    const getInitialCurrency = () => {
        if (countryCode) {
            const match = AVAILABLE_CURRENCIES.find(c => c.country === countryCode.toUpperCase());
            if (match) return match.code;
        }
        return undefined;
    };

    const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(getInitialCurrency());

    // Client-side auto-detection (runs only on browser after hydration)
    useEffect(() => {
        if (!selectedCurrency && !countryCode && typeof navigator !== 'undefined') {
            const locale = navigator.language;
            const country = locale.split('-')[1]?.toUpperCase();
            const match = AVAILABLE_CURRENCIES.find(c => c.country === country);
            if (match) {
                setSelectedCurrency(match.code);
            }
        }
    }, []); // Run once on mount

    const handleSubmit = (formData: FormData) => {
        setError(null);

        if (!selectedCurrency) {
            setError("Por favor selecciona una moneda principal.");
            return;
        }

        // Detect Timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        formData.append("timezone", timezone);
        formData.append("baseCurrency", selectedCurrency);
        if (countryCode) {
            formData.append("countryCode", countryCode);
        }

        startTransition(async () => {
            const result = await submitOnboarding(null, formData);

            if (result?.error) {
                // Use the specific message if available, otherwise fallback to generic
                setError(result.message || t("form.error"));
            } else if (result?.success) {
                router.push("/organization");
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

                {/* Organization Section */}
                <Section title={t("steps.organization")} icon={<Building2 className="w-5 h-5 text-primary" />}>
                    <FormGroup
                        label={t("form.orgName")}
                        htmlFor="orgName"
                        required
                        helpText={t("form.orgHelper")}
                    >
                        <Input
                            id="orgName"
                            name="orgName"
                            required
                            className="h-10"
                            placeholder={t("form.orgNamePlaceholder")}
                        />
                    </FormGroup>
                </Section>

                {/* Currency Section - NEW */}
                <Section title="Moneda Base" icon={<Coins className="w-5 h-5 text-primary" />}>
                    <FormGroup
                        label="Moneda Principal"
                        htmlFor="baseCurrency"
                        required
                    >
                        <Select
                            value={selectedCurrency}
                            onValueChange={setSelectedCurrency}
                        >
                            <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Selecciona una moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_CURRENCIES.map(c => (
                                    <SelectItem key={c.code} value={c.code}>
                                        {c.name} ({c.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Permanent Warning */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-200/80">
                            <strong>Importante:</strong> La moneda base no podrá ser modificada después de completar la configuración.
                            Todos los cálculos financieros usarán esta moneda como referencia.
                        </p>
                    </div>
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
                                router.push("/login"); // or "/"
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

