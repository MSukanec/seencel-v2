'use client';

/**
 * ProjectHealthView - Vista de Diagnóstico
 * 
 * Muestra cada indicador en una card separada con:
 * - Origen de los datos (qué tablas/campos)
 * - Valores actuales
 * - Estado de disponibilidad del dato
 */

import { useProjectHealth } from '../hooks/use-project-health';
import { HealthIndicator } from '../components/health-indicator';
import { HealthBlob } from '../components/health-blob';
import { HEALTH_STATUS_CONFIG } from '../constants';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertCircle,
    Clock,
    DollarSign,
    Activity,
    Flame,
    Gauge,
    Scale,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Database,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectHealthViewProps {
    projectId: string;
}

// =============================================
// COMPONENTE: DataSourceItem
// Muestra si un dato está disponible o no
// =============================================
function DataSourceItem({
    label,
    value,
    source,
    isAvailable,
    isMocked = false,
}: {
    label: string;
    value: string | number | null;
    source: string;
    isAvailable: boolean;
    isMocked?: boolean;
}) {
    return (
        <div className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0">
            <div className="flex-1">
                <div className="flex items-center gap-1.5">
                    {isAvailable ? (
                        <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                    ) : isMocked ? (
                        <AlertTriangle size={12} className="text-yellow-500 shrink-0" />
                    ) : (
                        <XCircle size={12} className="text-red-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 ml-4">
                    <Database size={10} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-mono">{source}</span>
                </div>
            </div>
            <div className="text-right">
                <span className={cn(
                    "text-sm font-mono",
                    !isAvailable && "text-muted-foreground italic"
                )}>
                    {value ?? 'N/A'}
                </span>
                {isMocked && (
                    <div className="text-[10px] text-yellow-600">mock</div>
                )}
            </div>
        </div>
    );
}

// =============================================
// COMPONENTE: IndicatorCard
// Card genérica para cada indicador - Layout 2 columnas
// =============================================
function IndicatorCard({
    title,
    icon: Icon,
    score,
    formula,
    children,
    status = 'info',
}: {
    title: string;
    icon: React.ElementType;
    score: number;
    formula: string;
    children: React.ReactNode;
    status?: 'healthy' | 'warning' | 'critical' | 'info';
}) {
    const getColors = () => {
        if (status === 'info') return 'border-blue-500/30 bg-blue-500/5';
        if (score >= 80) return 'border-green-500/30 bg-green-500/5';
        if (score >= 60) return 'border-yellow-500/30 bg-yellow-500/5';
        return 'border-red-500/30 bg-red-500/5';
    };

    const getScoreColor = () => {
        if (status === 'info') return 'text-blue-500';
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className={cn('rounded-xl border-2 p-4 transition-colors', getColors())}>
            {/* Layout 2 columnas: Blob | Datos */}
            <div className="flex gap-4">
                {/* Columna Izquierda: Blob Grande */}
                <div className="flex-shrink-0 flex items-center justify-center">
                    <HealthBlob score={score} size="lg" />
                </div>

                {/* Columna Derecha: Título + Datos */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <Icon size={18} className={getScoreColor()} />
                        <h3 className="font-semibold text-foreground">{title}</h3>
                    </div>

                    {/* Fórmula */}
                    <div className="mb-2 p-1.5 rounded-md bg-muted/50">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Info size={9} className="text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Fórmula</span>
                        </div>
                        <code className="text-[10px] text-muted-foreground font-mono line-clamp-1">{formula}</code>
                    </div>

                    {/* Data Sources */}
                    <div className="space-y-0 text-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export function ProjectHealthView({ projectId }: ProjectHealthViewProps) {
    const { health, metrics, isLoading, error, refresh } = useProjectHealth(projectId);

    // Loading State
    if (isLoading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                    <div>
                        <h3 className="font-semibold text-lg">Error al calcular salud</h3>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                    <Button variant="outline" onClick={() => refresh()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    // No Data State
    if (!health || !metrics) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                        <h3 className="font-semibold text-lg">Sin datos disponibles</h3>
                        <p className="text-sm text-muted-foreground">
                            No se pudo obtener información de este proyecto.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Helpers para determinar disponibilidad
    const hasProjectDates = metrics.startDate && metrics.endDate;
    const hasTasks = metrics.tasksTotal > 0;
    const hasBudget = metrics.budgetTotal > 0;

    // Gradiente de fondo según estado
    const getAmbientGradient = () => {
        if (health.status === 'healthy') {
            return 'from-green-500/5 via-transparent to-emerald-500/5';
        }
        if (health.status === 'warning') {
            return 'from-yellow-500/5 via-transparent to-amber-500/5';
        }
        return 'from-indigo-500/5 via-transparent to-purple-500/5';
    };

    return (
        <div className={cn(
            'relative min-h-full bg-gradient-to-br transition-colors duration-1000',
            getAmbientGradient()
        )}>
            {/* Efecto de fondo adicional */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

            {/* Contenido */}
            <div className="relative space-y-6 p-6">
                {/* Header con Score Principal */}
                <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-xl bg-gradient-to-br from-card to-muted/30 border">
                    {/* Blob Principal Animado */}
                    <HealthBlob score={health.score} size="lg" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold">Diagnóstico de Salud</h2>
                            <HealthIndicator health={health} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                            {HEALTH_STATUS_CONFIG[health.status].description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-green-500" />
                                Dato disponible
                            </span>
                            <span className="flex items-center gap-1">
                                <AlertTriangle size={12} className="text-yellow-500" />
                                Valor mock/por defecto
                            </span>
                            <span className="flex items-center gap-1">
                                <XCircle size={12} className="text-red-500" />
                                Dato faltante
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refresh()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar
                    </Button>
                </div>

                {/* Grid de Indicadores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* =============================================
            SALUD DE TIEMPO
        ============================================= */}
                    <IndicatorCard
                        title="Salud de Tiempo"
                        icon={Clock}
                        score={health.time.score}
                        formula="100 - |avance_real - avance_esperado| × 100"
                    >
                        <DataSourceItem
                            label="Fecha de Inicio"
                            value={metrics.startDate?.toLocaleDateString('es-AR') ?? null}
                            source="project_data.start_date"
                            isAvailable={!!metrics.startDate}
                            isMocked={!hasProjectDates}
                        />
                        <DataSourceItem
                            label="Fecha Fin Estimada"
                            value={metrics.endDate?.toLocaleDateString('es-AR') ?? null}
                            source="project_data.estimated_end"
                            isAvailable={!!metrics.endDate}
                            isMocked={!hasProjectDates}
                        />
                        <DataSourceItem
                            label="Tareas Totales"
                            value={metrics.tasksTotal}
                            source="construction_tasks (count)"
                            isAvailable={hasTasks}
                        />
                        <DataSourceItem
                            label="Tareas Completadas"
                            value={metrics.tasksCompleted}
                            source="construction_tasks.status = 'completed'"
                            isAvailable={hasTasks}
                        />
                        <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Avance Real</span>
                                <span className="font-mono">{(health.time.actualProgress * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Avance Esperado</span>
                                <span className="font-mono">{(health.time.expectedProgress * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium">
                                <span>Diferencia</span>
                                <span className={cn(
                                    health.time.progressDelta >= 0 ? 'text-green-500' : 'text-red-500'
                                )}>
                                    {health.time.progressDelta >= 0 ? '+' : ''}{(health.time.progressDelta * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </IndicatorCard>

                    {/* =============================================
            SALUD DE COSTO
        ============================================= */}
                    <IndicatorCard
                        title="Salud de Costo"
                        icon={DollarSign}
                        score={health.cost.score}
                        formula="100 - max(0, ratio_costo - ratio_avance) × 100"
                    >
                        <DataSourceItem
                            label="Presupuesto Total"
                            value={hasBudget ? `$${metrics.budgetTotal.toLocaleString('es-AR')}` : null}
                            source="quotes_view.total_with_tax (approved/signed)"
                            isAvailable={hasBudget}
                        />
                        <DataSourceItem
                            label="Costo Ejecutado"
                            value={`$${metrics.costExecuted.toLocaleString('es-AR')}`}
                            source="client_payments.amount (confirmed)"
                            isAvailable={true}
                        />
                        <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Ratio de Costo</span>
                                <span className="font-mono">{(health.cost.costRatio * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Ratio de Avance</span>
                                <span className="font-mono">{(health.cost.progressRatio * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium">
                                <span>Desviación</span>
                                <span className={cn(
                                    health.cost.costDelta <= 0 ? 'text-green-500' : 'text-red-500'
                                )}>
                                    {health.cost.costDelta >= 0 ? '+' : ''}{(health.cost.costDelta * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </IndicatorCard>

                    {/* =============================================
            ESTABILIDAD
        ============================================= */}
                    <IndicatorCard
                        title="Estabilidad"
                        icon={Activity}
                        score={health.stability.score}
                        formula="100 - eventos_inestables × FACTOR_ESTABILIDAD"
                    >
                        <DataSourceItem
                            label="Cambios en el Período"
                            value={health.stability.changesCount}
                            source="activity_logs / project_changes"
                            isAvailable={false}
                            isMocked={true}
                        />
                        <DataSourceItem
                            label="Tareas Reabiertas"
                            value={health.stability.reopenedCount}
                            source="construction_tasks.reopened_count"
                            isAvailable={false}
                            isMocked={true}
                        />
                        <DataSourceItem
                            label="Cambios de Fecha"
                            value={health.stability.dateChangesCount}
                            source="activity_logs (date_change)"
                            isAvailable={false}
                            isMocked={true}
                        />
                        <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Total Eventos Inestables</span>
                                <span className="font-mono">{health.stability.totalUnstableEvents}</span>
                            </div>
                        </div>
                        <div className="mt-2 p-2 rounded bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs">
                            ⚠️ Este indicador usa valores por defecto. Necesita implementar tracking de eventos.
                        </div>
                    </IndicatorCard>

                    {/* =============================================
            FRICCIÓN
        ============================================= */}
                    <IndicatorCard
                        title="Fricción"
                        icon={Flame}
                        score={100 - health.friction.level}
                        formula="(bloqueadas + pausadas + dependencias) / total × 100"
                        status="info"
                    >
                        <DataSourceItem
                            label="Tareas Bloqueadas"
                            value={health.friction.blockedTasks}
                            source="construction_tasks.is_blocked"
                            isAvailable={false}
                            isMocked={true}
                        />
                        <DataSourceItem
                            label="Tareas Pausadas"
                            value={health.friction.pausedTasks}
                            source="construction_tasks.status = 'paused'"
                            isAvailable={hasTasks}
                        />
                        <DataSourceItem
                            label="Dependencias No Resueltas"
                            value={health.friction.unresolvedDependencies}
                            source="task_dependencies (pending)"
                            isAvailable={false}
                            isMocked={true}
                        />
                        <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Nivel de Fricción</span>
                                <span className="font-mono text-orange-500">{health.friction.level}/100</span>
                            </div>
                        </div>
                    </IndicatorCard>

                    {/* =============================================
            TENSIÓN
        ============================================= */}
                    <IndicatorCard
                        title="Tensión"
                        icon={Gauge}
                        score={100 - health.tension.level}
                        formula="fricción × 0.6 + (100 - estabilidad) × 0.4"
                        status="info"
                    >
                        <DataSourceItem
                            label="Componente Fricción (60%)"
                            value={health.tension.frictionComponent.toFixed(1)}
                            source="calculado desde fricción"
                            isAvailable={true}
                        />
                        <DataSourceItem
                            label="Componente Inestabilidad (40%)"
                            value={health.tension.instabilityComponent.toFixed(1)}
                            source="calculado desde estabilidad"
                            isAvailable={true}
                        />
                        <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Nivel de Tensión</span>
                                <span className="font-mono text-purple-500">{health.tension.level}/100</span>
                            </div>
                        </div>
                        <div className="mt-2 p-2 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs">
                            ℹ️ Indicador derivado: depende de Fricción y Estabilidad.
                        </div>
                    </IndicatorCard>

                    {/* =============================================
            INERCIA
        ============================================= */}
                    <IndicatorCard
                        title="Inercia"
                        icon={Scale}
                        score={health.inertia.level}
                        formula="promedio(avance_real, costo_ejecutado/presupuesto) × 100"
                        status="info"
                    >
                        <DataSourceItem
                            label="Componente Avance"
                            value={`${(health.inertia.progressComponent * 100).toFixed(1)}%`}
                            source="calculado desde tareas"
                            isAvailable={hasTasks}
                        />
                        <DataSourceItem
                            label="Componente Costo"
                            value={`${(health.inertia.costComponent * 100).toFixed(1)}%`}
                            source="calculado desde presupuesto"
                            isAvailable={hasBudget}
                        />
                        <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Nivel de Inercia</span>
                                <span className="font-mono text-blue-500">{health.inertia.level}/100</span>
                            </div>
                        </div>
                        <div className="mt-2 p-2 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs">
                            ℹ️ Qué tan avanzado está el proyecto = resistencia al cambio.
                        </div>
                    </IndicatorCard>

                </div>

                {/* Resumen de Métricas Raw */}
                <details className="rounded-lg border bg-muted/50 p-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                        🔍 Debug: Métricas Raw del Query
                    </summary>
                    <pre className="mt-4 text-xs overflow-auto p-4 bg-card rounded-md">
                        {JSON.stringify(metrics, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
}
