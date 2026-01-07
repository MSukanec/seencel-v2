"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import { Building2, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
            setError(signInError.message);
            setLoading(false);
            return;
        }

        // Check if user has MFA factors
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

        if (factorsError) {
            // No MFA, proceed normally
            router.push("/organization");
            router.refresh();
            return;
        }

        const verifiedFactors = factorsData?.totp?.filter((f: any) => f.status === 'verified') || [];

        if (verifiedFactors.length > 0) {
            // User has MFA enabled - need to challenge
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
            // No MFA, proceed normally
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
            setError(verifyError.message);
            setLoading(false);
            return;
        }

        // MFA verified, proceed to dashboard
        router.push("/organization");
        router.refresh();
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
            <div className="absolute h-[500px] w-[500px] bg-primary/5 rounded-full blur-3xl -top-24 -left-24" />
            <div className="absolute h-[500px] w-[500px] bg-blue-500/5 rounded-full blur-3xl -bottom-24 -right-24" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="flex flex-col items-center text-center">
                    <div className="p-4 bg-background/50 backdrop-blur-xl border border-border/50 rounded-2xl mb-6 shadow-xl">
                        {mfaRequired ? (
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        ) : (
                            <Building2 className="w-8 h-8 text-primary" />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                        {mfaRequired ? "Verificación de Seguridad" : "Bienvenido a SEENCEL"}
                    </h1>
                    <p className="text-muted-foreground mt-3 text-lg">
                        {mfaRequired
                            ? "Ingresa el código de tu aplicación de autenticación."
                            : "Tu sistema operativo de construcción."}
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-2xl rounded-2xl p-8">
                    {!mfaRequired ? (
                        // Standard Login Form
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email corporativo</label>
                                <input
                                    type="email"
                                    placeholder="nombre@empresa.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Contraseña</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar Sesión"}
                            </button>
                        </form>
                    ) : (
                        // MFA Challenge Form
                        <form onSubmit={handleMfaVerify} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Código de Autenticación</label>
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
                                <p className="text-xs text-muted-foreground text-center mt-2">
                                    Abre tu app de autenticación (Google Authenticator, Authy, etc.)
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                disabled={loading || mfaCode.length !== 6}
                                className="w-full h-12"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar"}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={() => {
                                    setMfaRequired(false);
                                    setMfaCode("");
                                    setError(null);
                                }}
                            >
                                Volver al inicio de sesión
                            </Button>
                        </form>
                    )}
                </div>

                {!mfaRequired && (
                    <p className="text-center text-sm text-muted-foreground">
                        ¿No tienes cuenta?{" "}
                        <a href="/signup" className="underline underline-offset-4 hover:text-primary transition-colors">
                            Contacta a Ventas
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
}
