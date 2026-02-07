"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, Receipt, Loader2, Rocket, GraduationCap, PartyPopper, Sparkles } from "lucide-react";
import Link from "next/link";

// Floating emoji component
function FloatingEmoji({ emoji, delay, x }: { emoji: string; delay: number; x: number }) {
    return (
        <div
            className="absolute text-4xl opacity-0"
            style={{
                left: `${x}%`,
                bottom: "-50px",
                animation: `float-up 4s ease-out ${delay}s forwards`,
            }}
        >
            {emoji}
        </div>
    );
}

export function BillingCheckoutSuccessView() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedPaymentId, setCapturedPaymentId] = useState<string | null>(null);
    const [capturedProductType, setCapturedProductType] = useState<string | null>(null);
    const [capturedCourseId, setCapturedCourseId] = useState<string | null>(null);
    const [showContent, setShowContent] = useState(false);

    // Use ref to prevent double capture in React StrictMode
    const captureAttemptedRef = useRef(false);

    const source = searchParams.get("source") || "mercadopago";
    const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id") || capturedPaymentId;
    const status = searchParams.get("status") || searchParams.get("collection_status");

    // PayPal returns the order ID as 'token' parameter
    const paypalToken = searchParams.get("token");

    // Product type detection - from URL params OR captured from PayPal response
    const productType = searchParams.get("product_type") || capturedProductType;
    const courseId = searchParams.get("course_id") || capturedCourseId;

    const isCourse = productType === "course" || !!courseId;

    // Capture PayPal payment when returning from PayPal approval
    useEffect(() => {
        async function capturePayPalPayment() {
            // Skip if not PayPal, no token, already captured, or already attempted
            if (source !== "paypal" || !paypalToken || capturedPaymentId || captureAttemptedRef.current) return;

            // Mark as attempted immediately to prevent double execution
            captureAttemptedRef.current = true;

            setIsCapturing(true);
            try {
                const response = await fetch("/api/paypal/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: paypalToken }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("PayPal capture error:", errorData);
                    // Redirect to failure page with error details
                    const errorMessage = encodeURIComponent(errorData.error || "Error al procesar el pago");
                    router.replace(`/checkout/failure?source=paypal&error=${errorMessage}&token=${paypalToken}`);
                    return;
                }

                const data = await response.json();
                setCapturedPaymentId(data.captureId || data.orderId);

                // Set product type from PayPal response for correct UI
                if (data.productType) {
                    setCapturedProductType(data.productType);
                }
                if (data.courseId) {
                    setCapturedCourseId(data.courseId);
                }

                // Force refresh of server components (sidebar, etc.) to update plan/founder status
                router.refresh();
            } catch (error) {
                console.error("PayPal capture error:", error);
                const errorMessage = encodeURIComponent(error instanceof Error ? error.message : "Error al procesar el pago");
                router.replace(`/checkout/failure?source=paypal&error=${errorMessage}`);
            } finally {
                setIsCapturing(false);
            }
        }

        capturePayPalPayment();
    }, [source, paypalToken, capturedPaymentId, router]);

    // Trigger content animation after capturing completes
    useEffect(() => {
        if (!isCapturing) {
            const timer = setTimeout(() => setShowContent(true), 100);
            return () => clearTimeout(timer);
        }
    }, [isCapturing]);

    // For non-PayPal payments (MercadoPago, transfer), refresh on mount to update sidebar
    useEffect(() => {
        if (source !== "paypal") {
            router.refresh();
        }
    }, [source, router]);

    // Floating emojis data
    const emojis = isCourse
        ? ["🎓", "📚", "✨", "🎉", "🌟", "💡", "🚀", "📖"]
        : ["🚀", "⭐", "🎉", "💪", "🔥", "✨", "🏆", "💎"];

    // Show loading state while capturing PayPal payment
    if (isCapturing) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-primary/5">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-primary" />
                        <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
                    </div>
                    <p className="text-xl text-muted-foreground">Procesando tu pago...</p>
                    <p className="text-sm text-muted-foreground/60">Esto solo tomará un momento ✨</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Animation Styles */}
            <style jsx global>{`
                @keyframes float-up {
                    0% {
                        transform: translateY(0) rotate(0deg) scale(1);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100vh) rotate(360deg) scale(0.5);
                        opacity: 0;
                    }
                }
                @keyframes bounce-in {
                    0% {
                        transform: scale(0) rotate(-10deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.2) rotate(5deg);
                    }
                    70% {
                        transform: scale(0.9) rotate(-3deg);
                    }
                    100% {
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }
                @keyframes slide-up {
                    0% {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                    100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes pulse-glow {
                    0%, 100% {
                        filter: drop-shadow(0 0 20px oklch(var(--primary) / 0.5));
                    }
                    50% {
                        filter: drop-shadow(0 0 40px oklch(var(--primary) / 0.8));
                    }
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                }
            `}</style>

            {/* Floating Emojis Container */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
                {emojis.map((emoji, i) => (
                    <FloatingEmoji
                        key={i}
                        emoji={emoji}
                        delay={i * 0.3}
                        x={10 + (i * 12)}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-primary/5">
                <div className="relative flex flex-col items-center text-center space-y-8 max-w-md">

                    {/* Big Background Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none pointer-events-none">
                        <span className="text-[12rem] font-black text-muted/10 leading-none whitespace-nowrap">
                            {isCourse ? "🎓" : "🚀"}
                        </span>
                    </div>

                    {/* Animated Icon */}
                    <div
                        className={`relative transition-all duration-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}
                        style={{ animation: showContent ? 'bounce-in 0.8s ease-out' : 'none' }}
                    >
                        <div
                            className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl"
                            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                        >
                            {isCourse ? (
                                <GraduationCap className="w-16 h-16 text-white" strokeWidth={2} />
                            ) : (
                                <Rocket className="w-16 h-16 text-white" strokeWidth={2} />
                            )}
                        </div>
                        {/* Decorative sparkles */}
                        <Sparkles
                            className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400"
                            style={{ animation: 'wiggle 0.5s ease-in-out infinite' }}
                        />
                        <PartyPopper
                            className="absolute -bottom-1 -left-3 w-7 h-7 text-pink-400"
                            style={{ animation: 'wiggle 0.6s ease-in-out infinite reverse' }}
                        />
                    </div>

                    {/* Title & Description */}
                    <div
                        className={`space-y-3 transition-all duration-700 delay-200 ${showContent ? 'opacity-100' : 'opacity-0'}`}
                        style={{ animation: showContent ? 'slide-up 0.6s ease-out 0.2s both' : 'none' }}
                    >
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                            {isCourse ? "¡A aprender! 🎉" : "¡Bienvenido al equipo! 🚀"}
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            {isCourse ? (
                                <>Tu curso ya está listo. <span className="text-primary font-medium">¡Comienza cuando quieras!</span></>
                            ) : (
                                <>Tu plan está activo. <span className="text-primary font-medium">¡Hora de construir!</span></>
                            )}
                        </p>
                    </div>

                    {/* Payment Details Card */}
                    {paymentId && (
                        <div
                            className={`bg-card/80 backdrop-blur border rounded-2xl px-6 py-4 space-y-2 w-full shadow-xl transition-all duration-700 delay-400 ${showContent ? 'opacity-100' : 'opacity-0'}`}
                            style={{ animation: showContent ? 'slide-up 0.6s ease-out 0.4s both' : 'none' }}
                        >
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">ID de Transacción</p>
                            <p className="font-mono text-sm bg-muted/50 px-3 py-1.5 rounded-lg">{paymentId}</p>
                            <p className="text-xs text-muted-foreground">
                                via <span className="capitalize font-semibold text-foreground">{source}</span>
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div
                        className={`flex flex-col sm:flex-row gap-3 pt-2 w-full transition-all duration-700 delay-600 ${showContent ? 'opacity-100' : 'opacity-0'}`}
                        style={{ animation: showContent ? 'slide-up 0.6s ease-out 0.6s both' : 'none' }}
                    >
                        {isCourse ? (
                            <>
                                <Button size="lg" className="flex-1 h-12 text-base font-medium" asChild>
                                    <a href="/academy/my-courses">
                                        <BookOpen className="w-5 h-5 mr-2" />
                                        Ir al Curso
                                    </a>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button size="lg" className="flex-1 h-12 text-base font-medium" asChild>
                                    <Link href="/organization">
                                        <Rocket className="w-5 h-5 mr-2" />
                                        Ir al Dashboard
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" className="flex-1 h-12" asChild>
                                    <Link href="/organization/settings?tab=billing">
                                        <Receipt className="w-5 h-5 mr-2" />
                                        Ver Plan
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Fun footer message */}
                    <p
                        className={`text-sm text-muted-foreground/70 pt-4 transition-all duration-700 delay-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {isCourse
                            ? "El conocimiento es poder 💪"
                            : "Grandes cosas están por venir ✨"
                        }
                    </p>
                </div>
            </div>
        </>
    );
}
