"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function ForgotPasswordPage() {
    const t = useTranslations("Auth.ForgotPassword");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={t("title")}
            description={t("subtitle")}
            mode="login"
        >
            {!success ? (
                <form onSubmit={handleReset} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">{t("emailLabel")}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={t("emailPlaceholder")}
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11"
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={loading} className="w-full h-11">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("submitButton")}
                    </Button>

                    <div className="text-center text-sm">
                        <Link href="/login" className="text-primary hover:underline flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            {t("backToLogin")}
                        </Link>
                    </div>
                </form>
            ) : (
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/20">
                            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <p className="text-muted-foreground">
                        {t("success")}
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="w-full mt-4">
                            {t("backToLogin")}
                        </Button>
                    </Link>
                </div>
            )}
        </AuthLayout>
    );
}
