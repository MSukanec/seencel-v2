"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home, ArrowLeft, Zap, Hammer, HardHat, Construction, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useModal } from "@/providers/modal-store";
import { FeedbackForm } from "@/components/shared/forms/feedback-form";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

// Construction themed funny messages
const constructionMessages = [
    { emoji: "🏗️", text: "Se nos cayó la mezcla" },
    { emoji: "🚧", text: "Estamos en obra (y algo salió mal)" },
    { emoji: "📐", text: "El plano estaba al revés" },
    { emoji: "🧱", text: "Nos falta un ladrillo para terminar" },
    { emoji: "🚜", text: "La excavadora tocó un cable" },
    { emoji: "🔨", text: "Martillamos donde no era" },
    { emoji: "🔩", text: "Se nos perdió un tornillo importante" },
    { emoji: "👷", text: "El arquitecto está revisando qué pasó" },
];

export default function DashboardError({ error, reset }: ErrorPageProps) {
    const t = useTranslations('Errors'); // Assuming we keep generic keys or fallback
    const { openModal, closeModal } = useModal();
    const tFeedback = useTranslations('Feedback');

    // Pick a random message
    const randomMessage = constructionMessages[Math.floor(Math.random() * constructionMessages.length)];

    useEffect(() => {
        // Log to error tracking service
        console.error("Dashboard Error:", error);
    }, [error]);

    const handleFeedback = () => {
        openModal(
            <FeedbackForm
                onSuccess={closeModal}
                onCancel={closeModal}
            />,
            {
                title: tFeedback('title') || "Reportar Problema",
                description: tFeedback('modalDescription') || "Cuéntanos qué estabas haciendo cuando ocurrió el error.",
                size: 'md'
            }
        );
    };

    return (
        <div className="min-h-full bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="space-y-6 max-w-md w-full">
                {/* Visual Element - Giant 500 with floating icon */}
                <div className="relative flex justify-center">
                    <div className="text-[10rem] font-bold text-muted/20 leading-none select-none animate-pulse">
                        500
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-4 rounded-full border shadow-lg animate-bounce">
                        <HardHat className="h-12 w-12 text-yellow-500" />
                    </div>
                </div>

                {/* Fun Message */}
                <div className="space-y-2">
                    <div className="text-5xl animate-wiggle">
                        {randomMessage.emoji}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">
                        ¡Alto la obra!
                    </h1>
                    <p className="text-lg text-muted-foreground italic">
                        "{randomMessage.text}"
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Ha ocurrido un error inesperado, pero nuestro equipo de ingenieros ya está revisando los planos.
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
                        onClick={handleFeedback}
                    >
                        <Wrench className="mr-2 h-4 w-4" />
                        Reportar Problema
                    </Button>
                </div>

                {/* Secondary Actions */}
                <div className="pt-2 flex flex-col items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = "/organization"}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Ir al Inicio
                    </Button>
                </div>


                {/* Error ID for support */}
                {error.digest && (
                    <div className="pt-6 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                            ID del error: <code className="font-mono bg-muted px-2 py-1 rounded text-destructive">{error.digest}</code>
                        </p>
                    </div>
                )}

                {/* Fun footer */}
                <div className="pt-8 text-xs text-muted-foreground/50 font-mono flex items-center justify-center gap-2">
                    <Construction className="h-3 w-3" />
                    <span>Error 500 • Obra detenida temporalmente</span>
                    <Hammer className="h-3 w-3" />
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
