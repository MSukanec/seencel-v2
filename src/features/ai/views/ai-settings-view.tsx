"use client";

import { Sparkles, Zap, MessageSquare, Activity, Settings2, ShieldCheck, ChevronRight } from "lucide-react";
import { SettingsSection } from "@/components/shared/settings-section";
import { PageIntro } from "@/components/layout";
import { MetricCard, ChartCard } from "@/components/cards";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================================
// AI SETTINGS VIEW
// ============================================================================

interface AiSettingsViewProps {
    limits: any; // ai_organization_usage_limits row
    metrics: {
        totalTokens: number;
        totalCost: number;
        usageByContext: Record<string, number>;
        totalRequests: number;
    };
}

export function AiSettingsView({ limits, metrics }: AiSettingsViewProps) {
    // defaults if no row exists yet
    const dailyLimit = limits?.daily_requests_limit || 10;
    const usedToday = limits?.requests_used_today || 0;
    const progress = Math.min((usedToday / dailyLimit) * 100, 100);

    const isNearLimit = progress >= 80;
    const isAtLimit = progress >= 100;

    const handleFeatureToggle = (feature: string) => {
        toast.info(`Configuración de ${feature} próximamente`, {
            description: "Estamos trabajando para permitir habilitar/deshabilitar estas funciones individualmente."
        });
    };

    return (
        <div className="space-y-6">
            <PageIntro
                icon={Sparkles}
                title="Inteligencia Artificial"
                description="Gestioná el consumo de créditos de IA, configurá los límites del espacio de trabajo y controlá el acceso a las funciones inteligentes."
            />

            <SettingsSection
                title="Consumo y Límites"
                description="Resumen global del uso de la IA en toda la organización y monitoreo en tiempo real."
                icon={Activity}
            >
                <div className="space-y-4">
                    {/* Tarjeta Monolítica de Límite Diario (Usando ChartCard as preset) */}
                    <ChartCard
                        title="Gasto Diario de IA"
                        description={`Límite de interacciones del plan ${limits?.plan || 'Free'}`}
                        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                        headerAction={
                            <div className="text-right">
                                <p className="text-lg font-bold tabular-nums leading-tight">
                                    {usedToday} <span className="text-sm font-normal text-muted-foreground">/ {dailyLimit}</span>
                                </p>
                            </div>
                        }
                    >
                        <div className="w-full space-y-2 mt-4">
                            <Progress 
                                value={progress} 
                                className={cn("h-2", isAtLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-amber-500" : "[&>div]:bg-violet-500")}
                            />
                            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                                <span>{progress.toFixed(0)}% consumido hoy</span>
                                <span>Se resetea a las 00:00</span>
                            </div>
                        </div>
                    </ChartCard>

                    {/* Usage stats globales */}
                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard
                            title="Tokens Procesados"
                            value={metrics.totalTokens.toLocaleString("es-AR")}
                            icon={<Zap className="h-4 w-4 text-muted-foreground" />}
                            description="Toda la historia"
                        />
                        <MetricCard
                            title="Solicitudes IA"
                            value={metrics.totalRequests.toLocaleString("es-AR")}
                            icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
                            description="Toda la historia"
                        />
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection
                title="Funcionalidades Inteligentes"
                description="Activá o desactivá módulos de IA generativa para todo tu equipo."
                icon={Settings2}
            >
                <div className="space-y-3">
                    <div className="cincel-island overflow-hidden">
                        <FeatureToggleRow
                            icon={Sparkles}
                            title="Asistente de Recetas"
                            description="Sugiere materiales y mano de obra automáticamente en el catálogo técnico basándose en parámetros."
                            checked={true}
                            onChange={() => handleFeatureToggle("Asistente de Recetas")}
                        />
                    </div>
                    
                    <div className="cincel-island overflow-hidden">
                        <FeatureToggleRow
                            icon={ShieldCheck}
                            title="Importación Asistida"
                            description="Pre-procesa archivos de Excel complejos para entender su estructura jerárquica automáticamente."
                            checked={true}
                            onChange={() => handleFeatureToggle("Importación Asistida")}
                        />
                    </div>
                </div>
            </SettingsSection>
        </div>
    );
}

// ── Helpers Locales ──
function FeatureToggleRow({
    icon: Icon,
    title,
    description,
    checked,
    onChange,
}: {
    icon: any;
    title: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
}) {
    return (
        <div className="px-5 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
            <div className="mt-0.5 rounded-full p-1.5 bg-background shrink-0 border shadow-sm text-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium leading-none">{title}</h4>
                    <Switch checked={checked} onCheckedChange={onChange} />
                </div>
                <p className="text-[13px] text-muted-foreground pr-8 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
