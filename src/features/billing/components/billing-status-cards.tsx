"use client";

import React, { useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Plan } from "@/actions/plans";
import { Link } from "@/i18n/routing";
import { getPlanTier } from "./plan-cards-grid";
import { getPlanDisplayName } from "@/lib/plan-utils";
import { getPlanConfig, MATERIALS, resolvePlanSlug, type Material } from "@/components/shared/plan-badge";
import { cn } from "@/lib/utils";

interface BillingStatusCardsProps {
    plans: Plan[];
    currentPlanId?: string | null;
    organizationId?: string | null;
    isAdmin?: boolean;
}

export function BillingStatusCards({
    plans,
    currentPlanId,
    organizationId,
    isAdmin = false,
}: BillingStatusCardsProps) {
    const currentPlan = (currentPlanId ? plans.find(p => p.id === currentPlanId) : plans.find(p => getPlanTier(p.name) === 0)) || plans[0];
    const currentTier = currentPlan ? getPlanTier(currentPlan.name) : 0;
    
    const availablePlans = plans.filter(p => !p.name.toLowerCase().includes('enterprise'));
    const nextTier = currentTier + 1;
    let nextPlan = availablePlans.find(p => getPlanTier(p.name) === nextTier);

    if (!nextPlan && currentTier > 0 && currentTier < 3) {
        nextPlan = plans.find(p => p.name.toLowerCase().includes('enterprise'));
    }

    const currentConfig = getPlanConfig(currentPlan?.name || '');
    const currentDisplayName = getPlanDisplayName(currentPlan?.name || '');
    const currentMat = MATERIALS[resolvePlanSlug(currentPlan?.name)];
    const isFree = currentTier === 0;

    const getCheckoutUrl = (plan: Plan) => {
        if (!plan) return "/checkout";
        const currentSlug = currentPlan?.slug?.toLowerCase() || currentPlan?.name?.toLowerCase() || '';
        const targetSlug = plan.slug?.toLowerCase() || plan.name?.toLowerCase() || '';

        if (currentSlug.includes('pro') && targetSlug.includes('team') && organizationId) {
            return `/checkout?type=upgrade&org=${organizationId}&target=${targetSlug}`;
        }
        return `/checkout?product=plan-${targetSlug}&cycle=annual`;
    };

    return (
        <div className="flex flex-col gap-5">
            <StatusMaterialCard planName={currentPlan.name} className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-start justify-between relative z-10 w-full">
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-3">
                            <span 
                                className="uppercase font-bold text-lg flex items-center gap-2"
                                style={{
                                    backgroundImage: currentMat.cutFill,
                                    WebkitBackgroundClip: "text",
                                    backgroundClip: "text",
                                    color: "transparent",
                                    letterSpacing: currentMat.letterSpacing,
                                    WebkitTextFillColor: "transparent",
                                    textShadow: currentMat.cutDepth
                                }}
                            >
                                <span className="flex items-center justify-center mt-[-2px]">
                                    <currentConfig.mark color={currentMat.markColor} />
                                </span>
                                Plan {currentDisplayName}
                            </span>
                            <Badge variant="secondary" className="bg-white/5 border-white/10 text-white/70 font-medium px-2 py-0.5 backdrop-blur-sm shadow-sm ml-2">
                                Actual
                            </Badge>
                        </div>
                        <div className="text-sm text-white/50 font-medium tracking-wide">
                            {isFree ? "GRATIS PARA TODOS LOS USUARIOS" : `SUSCRIPCIÓN ACTIVA`}
                        </div>
                    </div>
                </div>
            </StatusMaterialCard>

            {nextPlan && (
                <StatusMaterialCard planName={nextPlan.name} className="flex flex-col p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10 w-full">
                        <div className="flex flex-col gap-1">
                            <h3 
                                className="uppercase font-bold text-base"
                                style={{
                                    backgroundImage: MATERIALS[resolvePlanSlug(nextPlan.name)].cutFill,
                                    WebkitBackgroundClip: "text",
                                    backgroundClip: "text",
                                    color: "transparent",
                                    letterSpacing: MATERIALS[resolvePlanSlug(nextPlan.name)].letterSpacing,
                                    WebkitTextFillColor: "transparent",
                                    textShadow: MATERIALS[resolvePlanSlug(nextPlan.name)].cutDepth
                                }}
                            >
                                Mejorar al Plan {getPlanDisplayName(nextPlan.name)}
                            </h3>
                            <p className="text-sm font-medium tracking-wide text-white/60">
                                {nextPlan.name.toLowerCase().includes('enterprise')
                                    ? "Para organizaciones con necesidades avanzadas"
                                    : `US$ ${nextPlan.monthly_amount || (nextPlan.name.toLowerCase().includes('pro') ? 16 : 24)} por usuario/mes`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex bg-background/5 border-white/10 hover:bg-background/10 hover:text-white text-white/60 transition-colors shadow-sm font-medium">
                                <Link href={"/settings/billing/plans" as any}>
                                    Ver todos los planes
                                </Link>
                            </Button>
                            {nextPlan.name.toLowerCase().includes('enterprise') ? (
                                <Button size="sm" asChild className="px-5 font-semibold bg-white text-black hover:bg-white/90">
                                    <Link href="/contact" className="px-5">Contactar Ventas</Link>
                                </Button>
                            ) : isAdmin ? (
                                <Button size="sm" className="px-5 font-bold shadow-md opacity-90 hover:opacity-100 transition-opacity" asChild style={{ background: MATERIALS[resolvePlanSlug(nextPlan.name)].cutFill, color: "#111", border: "1px solid rgba(255,255,255,0.2)" }}>
                                    <Link href={getCheckoutUrl(nextPlan) as any}>Mejorar ahora</Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>
                    
                    <div className="h-px w-full mb-5 relative z-10 opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${MATERIALS[resolvePlanSlug(nextPlan.name)].markColor}, transparent)` }} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 relative z-10 w-full">
                        <FeatureItem 
                            text={nextPlan.features?.can_invite_members ? "Miembros ilimitados" : "Solo un miembro"} 
                            mat={MATERIALS[resolvePlanSlug(nextPlan.name)]}
                        />
                        <FeatureItem 
                            text={(nextPlan.features?.max_active_projects ?? 0) >= 999 ? "Proyectos ilimitados" : `Hasta ${nextPlan.features?.max_active_projects || 0} proyectos`} 
                            mat={MATERIALS[resolvePlanSlug(nextPlan.name)]}
                        />
                        <FeatureItem 
                            text={(nextPlan.features?.max_storage_mb ?? 0) >= 1024 
                                ? `${Math.round((nextPlan.features?.max_storage_mb || 0) / 1024)} GB de espacio` 
                                : `${nextPlan.features?.max_storage_mb || 0} MB de espacio`} 
                            mat={MATERIALS[resolvePlanSlug(nextPlan.name)]}
                        />
                        {(nextPlan.features?.max_external_advisors ?? 0) > 0 && (
                            <FeatureItem 
                                text={(nextPlan.features?.max_external_advisors ?? 0) >= 999 
                                    ? "Asesores externos ilimitados" 
                                    : `Hasta ${nextPlan.features?.max_external_advisors || 0} asesores`} 
                                mat={MATERIALS[resolvePlanSlug(nextPlan.name)]}
                            />
                        )}
                        {nextPlan.features?.analytics_level && (
                            <FeatureItem 
                                text={nextPlan.features?.analytics_level === "basic" 
                                    ? "Analíticas básicas" 
                                    : nextPlan.features?.analytics_level === "advanced" ? "Analíticas avanzadas" : "Analíticas personalizadas"} 
                                mat={MATERIALS[resolvePlanSlug(nextPlan.name)]}
                            />
                        )}
                        {nextPlan.features?.export_excel && (
                            <FeatureItem text="Exportación a Excel/CSV" mat={MATERIALS[resolvePlanSlug(nextPlan.name)]} />
                        )}
                        {nextPlan.features?.custom_pdf_templates && (
                            <FeatureItem text="Plantillas personalizadas" mat={MATERIALS[resolvePlanSlug(nextPlan.name)]} />
                        )}
                        {nextPlan.features?.api_access && (
                            <FeatureItem text="Acceso a API y Webhooks" mat={MATERIALS[resolvePlanSlug(nextPlan.name)]} />
                        )}
                    </div>
                </StatusMaterialCard>
            )}
        </div>
    );
}

function FeatureItem({ text, mat }: { text: string; mat: Material }) {
    return (
        <div className="flex items-start gap-2.5 text-sm">
            <Check className="w-4 h-4 shrink-0 mt-[2px]" style={{ color: mat.markColor, opacity: 0.8 }} />
            <span className="opacity-80 text-white/90 font-medium tracking-wide">{text}</span>
        </div>
    );
}

function StatusMaterialCard({ planName, children, className }: { planName: string; children: React.ReactNode; className?: string }) {
    const slug = resolvePlanSlug(planName);
    const mat = MATERIALS[slug];
    const plateRef = useRef<HTMLDivElement>(null);
    const lightRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!plateRef.current || !lightRef.current) return;
        const rect = plateRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        lightRef.current.style.background = `radial-gradient(${mat.hoverShape} at ${x}px ${y}px, ${mat.lightColor}, transparent)`;
        lightRef.current.style.opacity = String(mat.hoverIntensity);
    }, [mat]);

    const handleMouseLeave = useCallback(() => {
        if (lightRef.current) {
            lightRef.current.style.opacity = "0";
        }
    }, []);

    return (
        <div
            ref={plateRef}
            className={cn(
                "relative overflow-hidden rounded-xl",
                className
            )}
            style={{
                background: mat.surface,
                border: `1px solid ${mat.border}`,
                boxShadow: [
                    `inset 0 1px 0 ${mat.bevelLight}`,
                    `inset 0 -1px 0 ${mat.bevelDark}`,
                    mat.dropShadow,
                    ...(mat.innerGlow ? [mat.innerGlow] : []),
                ].join(", "),
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {mat.brushTexture && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: mat.brushTexture }}
                />
            )}

            {mat.hasSheen && (
                <div
                    className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-[3]"
                    style={{
                        background:
                            "linear-gradient(90deg, transparent 0%, transparent 10%, rgba(255,255,255,0.25) 46%, rgba(255,255,255,0.08) 54%, transparent 90%, transparent 100%)",
                        animation: "plan-reflection 12s linear infinite",
                    }}
                />
            )}

            <div
                ref={lightRef}
                className="absolute inset-0 pointer-events-none z-[2] transition-opacity duration-300"
                style={{ opacity: 0 }}
            />

            {children}
        </div>
    );
}
