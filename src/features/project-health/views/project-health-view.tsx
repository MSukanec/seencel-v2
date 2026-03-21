'use client';

/**
 * ProjectHealthView — Vista de Diagnóstico de Salud del Proyecto
 * Muestra indicadores: Tiempo, Costo, Estabilidad, Fricción, Tensión, Inercia
 */

import { useProjectHealth } from '../hooks/use-project-health';
import { HealthIndicator } from '../components/health-indicator';
import { HealthBlob } from '../components/health-blob';
import { DataSourceItem, IndicatorCard } from '../components/indicator-cards';
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
    HeartPulse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActiveProjectId } from '@/stores/layout-store';

interface ProjectHealthViewProps {
    projectId?: string;
}

export function ProjectHealthView({ projectId: projectIdProp }: ProjectHealthViewProps) {
    const activeProjectId = useActiveProjectId();
    const projectId = projectIdProp || activeProjectId;
    const { health, metrics, isLoading, error, refresh } = useProjectHealth(projectId || '');

    // No project selected
    if (!projectId) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <HeartPulse size={48} className="mx-auto text-muted-foreground" />
                    <div>
                        <h3 className="font-semibold text-lg">Seleccioná un proyecto</h3>
                        <p className="text-sm text-muted-foreground">
                            Para ver el diagnóstico de salud, primero seleccioná un proyecto activo.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

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

    const hasProjectDates = metrics.startDate && metrics.endDate;
    const hasTasks = metrics.tasksTotal > 0;
    const hasBudget = metrics.budgetTotal > 0;

    const getAmbientGradient = () => {
        if (health.status === 'healthy') return 'from-green-500/5 via-transparent to-emerald-500/5';
        if (health.status === 'warning') return 'from-yellow-500/5 via-transparent to-amber-500/5';
        return 'from-indigo-500/5 via-transparent to-purple-500/5';
    };

    return (
        <div className={cn('relative min-h-full bg-gradient-to-br transition-colors duration-1000', getAmbientGradient())}>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

            <div className="relative space-y-6 p-6">
                {/* Header con Score Principal */}
                <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-xl bg-gradient-to-br from-card to-muted/30 border">
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
                                <CheckCircle2 size={12} className="text-green-500" /> Dato disponible
                            </span>
                            <span className="flex items-center gap-1">
                                <AlertTriangle size={12} className="text-yellow-500" /> Valor mock
                            </span>
                            <span className="flex items-center gap-1">
                                <XCircle size={12} className="text-red-500" /> Dato faltante
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refresh()}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
                    </Button>
                </div>

                {/* Grid de Indicadores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tiempo */}
                    <IndicatorCard title="Salud de Tiempo" icon={Clock} score={health.time.score} formula="100 - |avance_real - avance_esperado| × 100">
                        <DataSourceItem label="Fecha de Inicio" value={metrics.startDate?.toLocaleDateString('es-AR') ?? null} source="construction_tasks (min planned_start)" isAvailable={!!metrics.startDate} isMocked={!hasProjectDates} />
                        <DataSourceItem label="Fecha Fin Estimada" value={metrics.endDate?.toLocaleDateString('es-AR') ?? null} source="construction_tasks (max planned_end)" isAvailable={!!metrics.endDate} isMocked={!hasProjectDates} />
                        <DataSourceItem label="Tareas Totales" value={metrics.tasksTotal} source="construction_tasks (count)" isAvailable={hasTasks} />
                        <DataSourceItem label="Tareas Completadas" value={metrics.tasksCompleted} source="construction_tasks.status = 'completed'" isAvailable={hasTasks} />
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
                                <span className={cn(health.time.progressDelta >= 0 ? 'text-green-500' : 'text-red-500')}>
                                    {health.time.progressDelta >= 0 ? '+' : ''}{(health.time.progressDelta * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </IndicatorCard>

                    {/* Costo */}
                    <IndicatorCard title="Salud de Costo" icon={DollarSign} score={health.cost.score} formula="100 - max(0, ratio_costo - ratio_avance) × 100">
                        <DataSourceItem label="Presupuesto Total" value={hasBudget ? `$${metrics.budgetTotal.toLocaleString('es-AR')}` : null} source="quotes_view.total_with_tax (approved/signed)" isAvailable={hasBudget} />
                        <DataSourceItem label="Costo Ejecutado" value={`$${metrics.costExecuted.toLocaleString('es-AR')}`} source="client_payments.amount (confirmed)" isAvailable={true} />
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
                                <span className={cn(health.cost.costDelta <= 0 ? 'text-green-500' : 'text-red-500')}>
                                    {health.cost.costDelta >= 0 ? '+' : ''}{(health.cost.costDelta * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </IndicatorCard>

                    {/* Estabilidad */}
                    <IndicatorCard title="Estabilidad" icon={Activity} score={health.stability.score} formula="100 - eventos_inestables × FACTOR_ESTABILIDAD">
                        <DataSourceItem label="Cambios en el Período" value={health.stability.changesCount} source="activity_logs / project_changes" isAvailable={false} isMocked={true} />
                        <DataSourceItem label="Tareas Reabiertas" value={health.stability.reopenedCount} source="construction_tasks.reopened_count" isAvailable={false} isMocked={true} />
                        <DataSourceItem label="Cambios de Fecha" value={health.stability.dateChangesCount} source="activity_logs (date_change)" isAvailable={false} isMocked={true} />
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

                    {/* Fricción */}
                    <IndicatorCard title="Fricción" icon={Flame} score={100 - health.friction.level} formula="(bloqueadas + pausadas + dependencias) / total × 100" status="info">
                        <DataSourceItem label="Tareas Bloqueadas" value={health.friction.blockedTasks} source="construction_tasks.is_blocked" isAvailable={false} isMocked={true} />
                        <DataSourceItem label="Tareas Pausadas" value={health.friction.pausedTasks} source="construction_tasks.status = 'paused'" isAvailable={hasTasks} />
                        <DataSourceItem label="Dependencias No Resueltas" value={health.friction.unresolvedDependencies} source="task_dependencies (pending)" isAvailable={false} isMocked={true} />
                        <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Nivel de Fricción</span>
                                <span className="font-mono text-orange-500">{health.friction.level}/100</span>
                            </div>
                        </div>
                    </IndicatorCard>

                    {/* Tensión */}
                    <IndicatorCard title="Tensión" icon={Gauge} score={100 - health.tension.level} formula="fricción × 0.6 + (100 - estabilidad) × 0.4" status="info">
                        <DataSourceItem label="Componente Fricción (60%)" value={health.tension.frictionComponent.toFixed(1)} source="calculado desde fricción" isAvailable={true} />
                        <DataSourceItem label="Componente Inestabilidad (40%)" value={health.tension.instabilityComponent.toFixed(1)} source="calculado desde estabilidad" isAvailable={true} />
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

                    {/* Inercia */}
                    <IndicatorCard title="Inercia" icon={Scale} score={health.inertia.level} formula="promedio(avance_real, costo_ejecutado/presupuesto) × 100" status="info">
                        <DataSourceItem label="Componente Avance" value={`${(health.inertia.progressComponent * 100).toFixed(1)}%`} source="calculado desde tareas" isAvailable={hasTasks} />
                        <DataSourceItem label="Componente Costo" value={`${(health.inertia.costComponent * 100).toFixed(1)}%`} source="calculado desde presupuesto" isAvailable={hasBudget} />
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
            </div>
        </div>
    );
}
