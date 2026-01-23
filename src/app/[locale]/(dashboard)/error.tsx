"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home, ArrowLeft, Zap, Coffee, Bug } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

// Fun error messages to randomly display
const funMessages = [
    { emoji: "🔥", text: "Esto no debería arder, pero lo hace" },
    { emoji: "🤖", text: "Los robots también se equivocan" },
    { emoji: "🎭", text: "Un error dramático apareció en escena" },
    { emoji: "🌪️", text: "Algo hizo tornado en el código" },
    { emoji: "🦄", text: "Un unicornio pisó un cable importante" },
    { emoji: "🍕", text: "Alguien derramó café en los servidores" },
    { emoji: "🚀", text: "Houston, tenemos un problema" },
    { emoji: "🐛", text: "Un bug se puso cómodo por aquí" },
];

export default function DashboardError({ error, reset }: ErrorPageProps) {
    const t = useTranslations('Errors');

    // Pick a random fun message
    const randomMessage = funMessages[Math.floor(Math.random() * funMessages.length)];

    useEffect(() => {
        // Log to error tracking service
        console.error("Dashboard Error:", error);
    }, [error]);

    return (
        <div className="min-h-full bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="space-y-6 max-w-md w-full">
                {/* Visual Element - Giant 500 with floating icon */}
                <div className="relative flex justify-center">
                    <div className="text-[10rem] font-bold text-muted/20 leading-none select-none animate-pulse">
                        500
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-4 rounded-full border shadow-lg animate-bounce">
                        <Bug className="h-12 w-12 text-destructive" />
                    </div>
                </div>

                {/* Fun Message */}
                <div className="space-y-2">
                    <div className="text-5xl animate-wiggle">
                        {randomMessage.emoji}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-destructive to-orange-500 bg-clip-text text-transparent">
                        ¡Oops! Algo salió mal
                    </h1>
                    <p className="text-lg text-muted-foreground italic">
                        "{randomMessage.text}"
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Nuestro equipo de hamsters ya fue notificado y están corriendo en sus ruedas para arreglarlo.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button onClick={() => reset()} size="lg" className="group">
                        <RefreshCw className="mr-2 h-4 w-4 group-hover:animate-spin" />
                        Reintentar
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.location.href = "/organization"}
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Ir al Inicio
                    </Button>
                </div>

                {/* Go Back */}
                <div className="pt-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.history.back()}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver atrás
                    </Button>
                </div>

                {/* Error ID for support */}
                {error.digest && (
                    <div className="pt-6 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                            ID del error: <code className="font-mono bg-muted px-2 py-1 rounded text-destructive">{error.digest}</code>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 opacity-60">
                            (Guarda este código si contactas a soporte)
                        </p>
                    </div>
                )}

                {/* Fun footer */}
                <div className="pt-8 text-xs text-muted-foreground/50 font-mono flex items-center justify-center gap-2">
                    <Coffee className="h-3 w-3" />
                    <span>Error 500 • Probablemente no es tu culpa</span>
                    <Zap className="h-3 w-3" />
                </div>
            </div>

            {/* Custom CSS for wiggle animation */}
            <style jsx>{`
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                }
                .animate-wiggle {
                    animation: wiggle 0.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
