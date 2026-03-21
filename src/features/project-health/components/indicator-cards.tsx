'use client';

/**
 * Health Indicator Cards — Componentes internos de la vista de Salud
 */

import { cn } from '@/lib/utils';
import { HealthBlob } from './health-blob';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Database,
    Info,
} from 'lucide-react';

// =============================================
// DataSourceItem — Muestra si un dato está disponible
// =============================================

export function DataSourceItem({
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
// IndicatorCard — Card genérica para cada indicador
// =============================================

export function IndicatorCard({
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
            <div className="flex gap-4">
                {/* Blob */}
                <div className="flex-shrink-0 flex items-center justify-center">
                    <HealthBlob score={score} size="lg" />
                </div>

                {/* Datos */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon size={18} className={getScoreColor()} />
                        <h3 className="font-semibold text-foreground">{title}</h3>
                    </div>

                    <div className="mb-2 p-1.5 rounded-md bg-muted/50">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Info size={9} className="text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Fórmula</span>
                        </div>
                        <code className="text-[10px] text-muted-foreground font-mono line-clamp-1">{formula}</code>
                    </div>

                    <div className="space-y-0 text-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
