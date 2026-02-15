"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { submitOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import { Loader2, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/features/auth/components/auth-layout";

export default function OnboardingForm() {
    const t = useTranslations("Onboarding");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (formData: FormData) => {
        setError(null);

        // Detect Timezone for user preferences
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        formData.append("timezone", timezone);

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
