"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Loader2,
    Play,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { getMonitoringDashboard, runOpsChecks, type MonitoringDashboard } from "../monitoring-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export function MonitoringDashboardView() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<MonitoringDashboard | null>(null);
    const [runningChecks, setRunningChecks] = useState(false);

    const fetchDashboard = async () => {
        setLoading(true);
        const result = await getMonitoringDashboard();
        if (result.success && result.data) {
            setData(result.data);
        }
        setLoading(false);
    };

    const handleRunChecks = async () => {
        setRunningChecks(true);
        const result = await runOpsChecks();
        if (result.success) {
            toast.success("Chequeos ejecutados correctamente");
            await fetchDashboard();
        } else {
            toast.error("Error al ejecutar chequeos", { description: result.error });
        }
        setRunningChecks(false);
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Error al cargar el dashboard</span>
            </div>
        );
    }

    const statusConfig = {
        healthy: {
            icon: ShieldCheck,
            label: "Sistema Sano",
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/30",
            badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
        },
        warning: {
            icon: AlertTriangle,
            label: "Advertencias",
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/30",
            badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30",
        },
        critical: {
            icon: ShieldAlert,
            label: "Crítico",
            color: "text-red-500",
            bgColor: "bg-red-500/10",
            borderColor: "border-red-500/30",
            badgeClass: "bg-red-500/15 text-red-600 border-red-500/30",
        },
    };

    const status = statusConfig[data.systemStatus];
    const StatusIcon = status.icon;

    return (
        <div className="flex flex-col gap-6">
            {/* Estado General del Sistema */}
            <div className={`flex items-center justify-between p-5 rounded-xl border ${status.borderColor} ${status.bgColor}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${status.bgColor}`}>
                        <StatusIcon className={`h-8 w-8 ${status.color}`} />
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${status.color}`}>{status.label}</h2>
                        <p className="text-sm text-muted-foreground">
                            {data.systemStatus === 'healthy'
                                ? "No se detectaron problemas en las últimas 24 horas"
                                : data.systemStatus === 'warning'
                                    ? "Hay items que requieren atención"
                                    : "Se detectaron problemas críticos que requieren acción inmediata"
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRunChecks}
                        disabled={runningChecks}
                        className="gap-2"
                    >
                        {runningChecks ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        Ejecutar Chequeos
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fetchDashboard}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Errores 24h */}
                <KPICard
                    icon={XCircle}
                    label="Errores (24h)"
                    value={data.errorsLast24h}
                    subtitle={`${data.criticalErrorsLast24h} críticos`}
                    variant={data.criticalErrorsLast24h > 0 ? 'danger' : data.errorsLast24h > 0 ? 'warning' : 'success'}
                />

                {/* Alertas Abiertas */}
                <KPICard
                    icon={AlertTriangle}
                    label="Alertas Abiertas"
                    value={data.openAlerts}
                    subtitle={`${data.criticalAlerts} críticas`}
                    variant={data.criticalAlerts > 0 ? 'danger' : data.openAlerts > 0 ? 'warning' : 'success'}
                />

                {/* Último Chequeo */}
                <KPICard
                    icon={Activity}
                    label="Último Chequeo"
                    value={data.lastCheckRun
                        ? formatDistanceToNow(new Date(data.lastCheckRun.createdAt), { locale: es })
                        : "Nunca"
                    }
                    subtitle={data.lastCheckRun?.status === 'success' ? 'Exitoso' : data.lastCheckRun?.status || 'Sin datos'}
                    variant={data.lastCheckRun?.status === 'success' ? 'success' : 'warning'}
                    isText
                />

                {/* Estado General */}
                <KPICard
                    icon={data.systemStatus === 'healthy' ? CheckCircle2 : ShieldAlert}
                    label="Estado"
                    value={status.label}
                    subtitle={data.systemStatus === 'healthy' ? 'Todo operativo' : 'Requiere atención'}
                    variant={data.systemStatus === 'healthy' ? 'success' : data.systemStatus === 'warning' ? 'warning' : 'danger'}
                    isText
                />
            </div>

            {/* Información del último chequeo */}
            {data.lastCheckRun && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <Clock className="h-3 w-3" />
                    <span>
                        Último chequeo: {formatDistanceToNow(new Date(data.lastCheckRun.createdAt), { addSuffix: true, locale: es })}
                        {data.lastCheckRun.durationMs && ` (${data.lastCheckRun.durationMs}ms)`}
                    </span>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// KPI Card Component
// =============================================================================

function KPICard({
    icon: Icon,
    label,
    value,
    subtitle,
    variant,
    isText,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    subtitle: string;
    variant: 'success' | 'warning' | 'danger';
    isText?: boolean;
}) {
    const colors = {
        success: {
            icon: "text-emerald-500",
            bg: "bg-emerald-500/10",
            value: "text-foreground",
        },
        warning: {
            icon: "text-amber-500",
            bg: "bg-amber-500/10",
            value: "text-amber-600",
        },
        danger: {
            icon: "text-red-500",
            bg: "bg-red-500/10",
            value: "text-red-600",
        },
    };

    const c = colors[variant];

    return (
        <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">{label}</span>
                <div className={`p-1.5 rounded-lg ${c.bg}`}>
                    <Icon className={`h-4 w-4 ${c.icon}`} />
                </div>
            </div>
            <div>
                <p className={`${isText ? 'text-lg' : 'text-3xl'} font-bold ${c.value}`}>
                    {value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
}
