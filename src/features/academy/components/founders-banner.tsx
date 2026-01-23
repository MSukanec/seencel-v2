"use client";

import { Crown, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FoundersBannerProps {
    isDashboard?: boolean;
    className?: string;
    coursePrice?: number;
}

export function FoundersBanner({ isDashboard = false, className, coursePrice }: FoundersBannerProps) {
    const href = isDashboard ? "/dashboard/founders" : "/founders";

    return (
        <section className={cn("w-full py-16 md:py-24 bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 border-y border-lime-100 relative overflow-hidden", className)}>
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-300/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-300/10 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">

                    {/* Left Column: Value Proposition */}
                    <div className="flex-1 space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100/80 border border-lime-200 text-lime-800 text-sm font-medium backdrop-blur-sm">
                            <Crown className="h-4 w-4" />
                            <span>Programa Fundadores</span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-lime-950 tracking-tight">
                                Este curso está incluido <span className="text-lime-600">GRATIS</span>
                            </h2>
                            <p className="text-lg text-lime-900/80 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Al suscribirte a los planes anuales PRO o TEAMS, obtienes acceso ilimitado a este curso y muchos más beneficios exclusivos.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-8 bg-white/50 p-4 rounded-2xl border border-lime-100/50 backdrop-blur-md w-fit mx-auto lg:mx-0">
                            <div>
                                <span className="block text-xs uppercase tracking-wider text-lime-700 font-semibold mb-1">Precio Normal</span>
                                <span className="text-xl text-zinc-500 line-through font-medium">
                                    ${coursePrice || 169}/año
                                </span>
                            </div>
                            <ArrowRight className="h-6 w-6 text-lime-400 hidden sm:block" />
                            <div className="w-px h-10 bg-lime-200 hidden sm:block" />
                            <div>
                                <span className="block text-xs uppercase tracking-wider text-lime-700 font-semibold mb-1">Con Fundadores</span>
                                <span className="text-2xl font-black text-lime-600 tracking-tight">
                                    GRATIS
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Benefits & CTA */}
                    <div className="w-full lg:w-[420px] bg-white rounded-3xl p-8 shadow-xl shadow-lime-900/5 border border-lime-100">
                        <h3 className="text-xl font-bold text-lime-950 mb-6 flex items-center gap-2">
                            <Crown className="h-5 w-5 text-lime-500" />
                            Beneficios Exclusivos
                        </h3>
                        <ul className="space-y-4 mb-8">
                            {[
                                "Acceso vitalicio a cursos y actualizaciones",
                                "Beneficio extensible a toda tu organización",
                                "Voz y voto en el roadmap de productos",
                                "Soporte prioritario y comunidad privada"
                            ].map((benefit, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-lime-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="h-3 w-3 text-lime-600" />
                                    </div>
                                    <span className="text-lime-800 text-sm font-medium leading-tight">{benefit}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            asChild
                            size="lg"
                            className="w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-600/20 transition-all hover:scale-[1.02]"
                        >
                            <Link href={href}>
                                Obtener oferta Fundadores
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <p className="text-xs text-center text-lime-700/60 mt-4">
                            Oferta válida por tiempo limitado
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

