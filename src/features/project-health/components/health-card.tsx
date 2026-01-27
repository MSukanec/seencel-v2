'use client';

/**
 * HealthCard
 * 
 * Card que muestra el estado de salud del proyecto con detalles
 */

import { cn } from '@/lib/utils';
import { ProjectHealth } from '../types';
import { HEALTH_STATUS_CONFIG, getStatusColors } from '../constants';
import { getHealthSummary } from '../lib/calculators';
import { HealthIndicator } from './health-indicator';
import {
    Clock,
    DollarSign,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    Info
} from 'lucide-react';

interface HealthCardProps {
    health: ProjectHealth;
    /** Mostrar detalles expandidos */
    showDetails?: boolean;
    /** Clase adicional */
    className?: string;
}

/**
 * Componente para mostrar un indicador individual
 */
function MetricRow({
    icon: Icon,
    label,
    value,
    score,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    score: number;
}) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-500';
        if (s >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon size={16} />
                <span className="text-sm">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">{value}</span>
                <span className={cn('text-sm font-medium', getScoreColor(score))}>
                    {Math.round(score)}%
                </span>
            </div>
        </div>
    );
}

/**
 * Card con estado de salud detallado
 */
export function HealthCard({
    health,
    showDetails = true,
    className,
}: HealthCardProps) {
    const colors = getStatusColors(health.status);
    const summary = getHealthSummary(health);

    // Determinar tendencia de tempo
    const getTrendIcon = (delta: number) => {
        if (delta > 0.05) return TrendingUp;
        if (delta < -0.05) return TrendingDown;
        return Minus;
    };

    const TrendIcon = getTrendIcon(health.time.progressDelta);

    return (
        <div
            className={cn(
                'rounded-lg border bg-card p-4',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
                            health.status === 'healthy' && 'bg-green-500/10 text-green-500',
                            health.status === 'warning' && 'bg-yellow-500/10 text-yellow-500',
                            health.status === 'critical' && 'bg-red-500/10 text-red-500'
                        )}
                    >
                        {Math.round(health.score)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Salud del Proyecto</h3>
                        <HealthIndicator health={health} size="sm" />
                    </div>
                </div>
                <TrendIcon
                    size={20}
                    className={cn(
                        health.time.progressDelta > 0.05 && 'text-green-500',
                        health.time.progressDelta < -0.05 && 'text-red-500',
                        Math.abs(health.time.progressDelta) <= 0.05 && 'text-muted-foreground'
                    )}
                />
            </div>

            {/* Summary */}
            <p className="text-sm text-muted-foreground mb-4">
                {summary}
            </p>

            {/* Details */}
            {showDetails && (
                <div className="border-t pt-3 space-y-1">
                    <MetricRow
                        icon={Clock}
                        label="Tiempo"
                        value={health.time.daysDelta > 0
                            ? `+${health.time.daysDelta}d`
                            : `${health.time.daysDelta}d`}
                        score={health.time.score}
                    />
                    <MetricRow
                        icon={DollarSign}
                        label="Costo"
                        value={`${Math.round(health.cost.costRatio * 100)}% gastado`}
                        score={health.cost.score}
                    />
                    <MetricRow
                        icon={Activity}
                        label="Estabilidad"
                        value={`${health.stability.totalUnstableEvents} eventos`}
                        score={health.stability.score}
                    />
                </div>
            )}

            {/* Info */}
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t text-xs text-muted-foreground">
                <Info size={12} />
                <span>
                    Calculado: {health.calculatedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
}
