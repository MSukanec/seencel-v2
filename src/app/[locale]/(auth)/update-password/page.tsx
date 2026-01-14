"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";

export default function UpdatePasswordPage() {
    const t = useTranslations("Auth.UpdatePassword");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            // Optionally redirect after a few seconds, but showing success UI is better UX first
        }
    };

    return (
        <AuthLayout
            title={t("title")}
            description={t("subtitle")}
            mode="login" // Reusing login mode for layout
        >
            {!success ? (
                <form onSubmit={handleUpdate} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">{t("passwordLabel")}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={t("passwordPlaceholder")}
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                </form>
            ) : (
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/20">
                            <Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <p className="text-muted-foreground">
                        {t("success")}
                    </p>
                    <Link href="/organization">
                        <Button className="w-full mt-4">
                            {t("backToDashboard")}
                        </Button>
                    </Link>
                </div>
            )}
        </AuthLayout>
    );
}
