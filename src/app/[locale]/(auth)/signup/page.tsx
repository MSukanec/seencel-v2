"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // If session exists, user is logged in (email confirmation might be off)
        if (data.session) {
            router.push("/organization");
            router.refresh();
        } else {
            // Email confirmation required
            setError("Registro exitoso. Por favor revisa tu email para confirmar tu cuenta.");
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Crear una cuenta"
            description="Comienza a gestionar tus proyectos de construcción hoy mismo."
            mode="register"
        >
            <div className="grid gap-4">
                <GoogleAuthButton text="Registrarse con Google" />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            O con correo electrónico
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSignup} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="nombre@empresa.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <Alert variant={error.includes("exitoso") ? "default" : "destructive"} className={error.includes("exitoso") ? "bg-green-500/10 border-green-500/20 text-green-600" : ""}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrarse con Email
                    </Button>
                </form>
            </div>
        </AuthLayout>
    );
}
