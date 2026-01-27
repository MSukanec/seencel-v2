'use client';

/**
 * MiniBudget - Demo Interactivo de Presupuestos
 * 
 * Mini visualización de presupuesto con barras interactivas
 * y gráfico de avance de costos.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetItem {
    id: string;
    name: string;
    budgeted: number;
    spent: number;
    category: string;
}

const INITIAL_ITEMS: BudgetItem[] = [
    { id: '1', name: 'Materiales de construcción', budgeted: 50000, spent: 42000, category: 'Materiales' },
    { id: '2', name: 'Mano de obra', budgeted: 30000, spent: 28500, category: 'RRHH' },
    { id: '3', name: 'Instalaciones eléctricas', budgeted: 15000, spent: 18200, category: 'Electricidad' },
    { id: '4', name: 'Plomería', budgeted: 10000, spent: 6500, category: 'Plomería' },
    { id: '5', name: 'Acabados', budgeted: 25000, spent: 12000, category: 'Acabados' },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export function MiniBudget() {
    const [items, setItems] = useState<BudgetItem[]>(INITIAL_ITEMS);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    // Calcular totales
    const totalBudgeted = items.reduce((sum, item) => sum + item.budgeted, 0);
    const totalSpent = items.reduce((sum, item) => sum + item.spent, 0);
    const remaining = totalBudgeted - totalSpent;
    const percentUsed = (totalSpent / totalBudgeted) * 100;

    // Simular agregar gasto
    const handleAddSpent = (itemId: string, amount: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, spent: Math.max(0, item.spent + amount) };
            }
            return item;
        }));
    };

    const getStatusIcon = (item: BudgetItem) => {
        const percent = (item.spent / item.budgeted) * 100;
        if (percent > 100) return <AlertCircle size={12} className="text-red-500" />;
        if (percent > 90) return <TrendingUp size={12} className="text-yellow-500" />;
        if (percent < 50) return <TrendingDown size={12} className="text-green-500" />;
        return <Minus size={12} className="text-muted-foreground" />;
    };

    const getBarColor = (item: BudgetItem) => {
        const percent = (item.spent / item.budgeted) * 100;
        if (percent > 100) return 'bg-red-500';
        if (percent > 90) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="w-full space-y-4">
            {/* Header con totales */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Demo en vivo</span>
                </div>
                <span className="text-xs text-muted-foreground">Clickeá las barras para simular gastos</span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Presupuesto</p>
                    <p className="text-sm font-bold">{formatCurrency(totalBudgeted)}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Gastado</p>
                    <p className={cn('text-sm font-bold', totalSpent > totalBudgeted ? 'text-red-500' : 'text-foreground')}>
                        {formatCurrency(totalSpent)}
                    </p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Restante</p>
                    <p className={cn('text-sm font-bold', remaining < 0 ? 'text-red-500' : 'text-green-500')}>
                        {formatCurrency(remaining)}
                    </p>
                </div>
            </div>

            {/* Progress Bar Total */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Uso total del presupuesto</span>
                    <span className={cn(
                        'font-medium',
                        percentUsed > 100 ? 'text-red-500' : percentUsed > 90 ? 'text-yellow-500' : 'text-green-500'
                    )}>
                        {percentUsed.toFixed(1)}%
                    </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-500',
                            percentUsed > 100 ? 'bg-red-500' : percentUsed > 90 ? 'bg-yellow-500' : 'bg-green-500'
                        )}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                </div>
            </div>

            {/* Budget Items */}
            <div className="space-y-2">
                {items.map((item) => {
                    const percent = (item.spent / item.budgeted) * 100;
                    const isHovered = hoveredItem === item.id;

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                'p-2 rounded-lg border transition-all duration-200 cursor-pointer',
                                'hover:border-primary/30 hover:bg-muted/30',
                                isHovered && 'ring-1 ring-primary/20'
                            )}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={() => handleAddSpent(item.id, 2000)}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    {getStatusIcon(item)}
                                    <span className="text-xs font-medium truncate max-w-[120px]">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-muted-foreground">
                                        {formatCurrency(item.spent)}
                                    </span>
                                    <span className="text-muted-foreground/50">/</span>
                                    <span className="text-muted-foreground">
                                        {formatCurrency(item.budgeted)}
                                    </span>
                                </div>
                            </div>

                            {/* Bar */}
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-300',
                                        getBarColor(item)
                                    )}
                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                />
                            </div>

                            {/* Hover info */}
                            {isHovered && (
                                <p className="text-[9px] text-muted-foreground mt-1 text-center animate-in fade-in">
                                    Click para agregar $2,000 de gasto
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border/50 flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground text-center">
                    Controlá costos en tiempo real con alertas automáticas
                </p>
            </div>
        </div>
    );
}
