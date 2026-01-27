'use client';

/**
 * HealthIndicator
 * 
 * Badge compacto que muestra el estado de salud del proyecto
 */

import { cn } from '@/lib/utils';
import { ProjectHealth } from '../types';
import { HEALTH_STATUS_CONFIG } from '../constants';
import { Heart, AlertTriangle, AlertCircle } from 'lucide-react';

interface HealthIndicatorProps {
    health: ProjectHealth;
    /** Mostrar score numérico */
    showScore?: boolean;
    /** Tamaño del indicador */
    size?: 'sm' | 'md' | 'lg';
    /** Clase adicional */
    className?: string;
}

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
};

/**
 * Badge que indica el estado de salud del proyecto
 * 
 * @example
 * ```tsx
 * <HealthIndicator health={projectHealth} showScore />
 * ```
 */
export function HealthIndicator({
    health,
    showScore = false,
    size = 'md',
    className,
}: HealthIndicatorProps) {
    const config = HEALTH_STATUS_CONFIG[health.status];
    const iconSize = iconSizes[size];

    const Icon = {
        healthy: Heart,
        warning: AlertTriangle,
        critical: AlertCircle,
    }[health.status];

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full font-medium',
                config.bgColor,
                config.color,
                config.borderColor,
                'border',
                sizeClasses[size],
                className
            )}
        >
            <Icon size={iconSize} />
            {showScore ? (
                <span>{Math.round(health.score)}</span>
            ) : (
                <span>{config.label}</span>
            )}
        </div>
    );
}

/**
 * Variante mínima: solo el ícono con color
 */
export function HealthDot({
    health,
    className,
}: {
    health: ProjectHealth;
    className?: string;
}) {
    const config = HEALTH_STATUS_CONFIG[health.status];

    return (
        <div
            className={cn(
                'w-2.5 h-2.5 rounded-full',
                health.status === 'healthy' && 'bg-green-500',
                health.status === 'warning' && 'bg-yellow-500',
                health.status === 'critical' && 'bg-red-500',
                className
            )}
            title={`${config.label} - ${Math.round(health.score)}%`}
        />
    );
}
