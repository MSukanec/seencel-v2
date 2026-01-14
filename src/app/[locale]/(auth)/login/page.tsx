"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, Link } from "@/i18n/routing";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { GoogleAuthButton } from "@/features/auth/components/google-auth-button";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    // MFA State
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
    const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError("Credenciales inválidas. Por favor intenta de nuevo.");
            setLoading(false);
            return;
        }

        // Check if user has MFA factors
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

        if (factorsError) {
            router.push("/organization");
            router.refresh();
            return;
        }

        const verifiedFactors = factorsData?.totp?.filter((f: any) => f.status === 'verified') || [];

        if (verifiedFactors.length > 0) {
            const factor = verifiedFactors[0];
            setMfaFactorId(factor.id);

            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: factor.id,
            });

            if (challengeError) {
                setError(challengeError.message);
                setLoading(false);
                return;
            }

            setMfaChallengeId(challengeData.id);
            setMfaRequired(true);
            setLoading(false);
        } else {
            router.push("/organization");
            router.refresh();
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mfaFactorId || !mfaChallengeId || mfaCode.length !== 6) return;

        setLoading(true);
        setError(null);

        const { error: verifyError } = await supabase.auth.mfa.verify({
            factorId: mfaFactorId,
            challengeId: mfaChallengeId,
            code: mfaCode,
        });

        if (verifyError) {
            setError("Código incorrecto. Intenta de nuevo.");
            setLoading(false);
            return;
        }

        router.push("/organization");
        router.refresh();
    };

    return (
        <AuthLayout
            title={mfaRequired ? "Verificación en dos pasos" : "Bienvenido de nuevo"}
            description={mfaRequired ? "Ingresa el código de tu aplicación autenticadora." : "Ingresa tus credenciales para acceder a tu cuenta."}
            mode="login"
        >
            {!mfaRequired ? (
                <>
                    <div className="grid gap-4">
                        <GoogleAuthButton text="Iniciar sesión con Google" />

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

                        <form onSubmit={handleLogin} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nombre@empresa.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Link href="/forgot-password" className="text-xs text-primary hover:underline" tabIndex={-1}>
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11"
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" disabled={loading} className="w-full h-11">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Iniciar Sesión
                            </Button>
                        </form>
                    </div>
                </>
            ) : (
                <form onSubmit={handleMfaVerify} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Código de Autenticación</Label>
                        <Input
                            type="text"
                            placeholder="000000"
                            required
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="font-mono text-center tracking-widest text-xl h-14"
                            maxLength={6}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={loading || mfaCode.length !== 6} className="w-full h-11">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verificar
                    </Button>

                    <Button variant="ghost" type="button" onClick={() => setMfaRequired(false)} className="w-full">
                        Volver
                    </Button>
                </form>
            )}
        </AuthLayout>
    );
}
