"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Receipt, Sparkles, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";

// Confetti particle component
function ConfettiPiece({ delay, left }: { delay: number; left: number }) {
    const colors = [
        "bg-green-400",
        "bg-blue-400",
        "bg-yellow-400",
        "bg-pink-400",
        "bg-purple-400",
        "bg-orange-400",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomSize = Math.random() * 8 + 6; // 6-14px
    const randomDuration = Math.random() * 2 + 3; // 3-5s

    return (
        <div
            className={`absolute ${randomColor} rounded-sm opacity-90`}
            style={{
                left: `${left}%`,
                top: "-20px",
                width: `${randomSize}px`,
                height: `${randomSize}px`,
                animation: `confetti-fall ${randomDuration}s ease-out ${delay}s forwards`,
            }}
        />
    );
}

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const [confettiPieces, setConfettiPieces] = useState<{ id: number; delay: number; left: number }[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureError, setCaptureError] = useState<string | null>(null);
    const [capturedPaymentId, setCapturedPaymentId] = useState<string | null>(null);

    const source = searchParams.get("source") || "mercadopago";
    const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id") || capturedPaymentId;
    const status = searchParams.get("status") || searchParams.get("collection_status");

    // PayPal returns the order ID as 'token' parameter
    const paypalToken = searchParams.get("token");

    // Product type detection - from external_reference parsing
    const productType = searchParams.get("product_type"); // "subscription" | "course"
    const courseId = searchParams.get("course_id");

    const isCourse = productType === "course" || !!courseId;

    // Capture PayPal payment when returning from PayPal approval
    useEffect(() => {
        async function capturePayPalPayment() {
            if (source !== "paypal" || !paypalToken || capturedPaymentId) return;

            setIsCapturing(true);
            try {
                const response = await fetch("/api/paypal/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: paypalToken }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Error al capturar el pago");
                }

                const data = await response.json();
                setCapturedPaymentId(data.captureId || data.orderId);
            } catch (error) {
                console.error("PayPal capture error:", error);
                setCaptureError(error instanceof Error ? error.message : "Error al procesar el pago");
            } finally {
                setIsCapturing(false);
            }
        }

        capturePayPalPayment();
    }, [source, paypalToken, capturedPaymentId]);

    // Generate confetti on mount (only if not capturing or after successful capture)
    useEffect(() => {
        if (isCapturing) return;
        const pieces = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            delay: Math.random() * 2,
            left: Math.random() * 100,
        }));
        setConfettiPieces(pieces);
    }, [isCapturing]);

    // Show loading state while capturing PayPal payment
    if (isCapturing) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="flex flex-col items-center text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">Procesando tu pago con PayPal...</p>
                </div>
            </div>
        );
    }

    // Show error if capture failed
    if (captureError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="flex flex-col items-center text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-destructive">Error en el pago</h1>
                    <p className="text-muted-foreground">{captureError}</p>
                    <Button asChild>
                        <Link href="/checkout">Intentar de nuevo</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Confetti Animation Styles */}
            <style jsx global>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                @keyframes pulse-glow {
                    0%, 100% {
                        box-shadow: 0 0 20px 0 oklch(var(--primary) / 0.4);
                    }
                    50% {
                        box-shadow: 0 0 40px 10px oklch(var(--primary) / 0.6);
                    }
                }
                @keyframes bounce-in {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.2);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>

            {/* Confetti Container */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                {confettiPieces.map((piece) => (
                    <ConfettiPiece key={piece.id} delay={piece.delay} left={piece.left} />
                ))}
            </div>

            {/* Main Content - Centered */}
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-primary/5">
                <div className="flex flex-col items-center text-center space-y-8 max-w-md">
                    {/* Success Icon with Animation */}
                    <div
                        className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-2xl"
                        style={{
                            animation: "bounce-in 0.6s ease-out, pulse-glow 2s ease-in-out infinite",
                        }}
                    >
                        {isCourse ? (
                            <GraduationCap className="w-16 h-16 text-white" strokeWidth={2} />
                        ) : (
                            <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2.5} />
                        )}
                    </div>

                    {/* Title with Sparkles - Differentiated by product type */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                            <h1 className="text-4xl font-bold text-primary">
                                {isCourse ? "¡Curso Adquirido!" : "¡Pago Exitoso!"}
                            </h1>
                            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                        </div>
                        <p className="text-muted-foreground text-lg">
                            {isCourse ? (
                                <>
                                    Ya tienes acceso completo al curso. <br />
                                    <span className="text-primary font-medium">¡Comienza a aprender ahora!</span>
                                </>
                            ) : (
                                <>
                                    Tu pago ha sido procesado correctamente. <br />
                                    <span className="text-primary font-medium">¡Bienvenido al equipo!</span>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Payment Details Card */}
                    {paymentId && (
                        <div className="bg-card border rounded-xl px-8 py-5 space-y-2 w-full shadow-lg">
                            <p className="text-sm text-muted-foreground">ID de Transacción</p>
                            <p className="font-mono text-sm bg-muted px-3 py-1.5 rounded">{paymentId}</p>
                            {status === "approved" && (
                                <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> Pago Aprobado
                                </span>
                            )}
                        </div>
                    )}

                    {/* Source Badge */}
                    <p className="text-sm text-muted-foreground">
                        Procesado via <span className="capitalize font-semibold text-foreground">{source}</span>
                    </p>

                    {/* Actions - Differentiated by product type */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
                        {isCourse ? (
                            <>
                                <Button size="lg" className="flex-1" asChild>
                                    <Link href="/academy/my-courses">
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Ver Mis Cursos
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" className="flex-1" asChild>
                                    <Link href="/">
                                        <Home className="w-4 h-4 mr-2" />
                                        Ir al Inicio
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button size="lg" className="flex-1" asChild>
                                    <Link href="/">
                                        <Home className="w-4 h-4 mr-2" />
                                        Ir al Inicio
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" className="flex-1" asChild>
                                    <Link href="/organizacion/configuracion?tab=billing">
                                        <Receipt className="w-4 h-4 mr-2" />
                                        Ver Suscripción
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}
