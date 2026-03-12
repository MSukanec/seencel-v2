"use client";

import { CHART_COLORS, getChartColor } from '../chart-config';
import { useMoney } from '@/hooks/use-money';

// ============================================================================
// PROPORTION BAR — Horizontal segmented bar + legend grid
// ============================================================================
// Replaces donut charts in space-constrained cards.
// Top: single horizontal bar with colored segments proportional to values
// Bottom: 2-column grid legend with name, %, and formatted value
// ============================================================================

interface ProportionBarItem {
    name: string;
    value: number;
}

interface ProportionBarProps {
    data: ProportionBarItem[];
    nameKey?: string;
    valueKey?: string;
    /** Max items to show (rest grouped as "Otros") */
    maxItems?: number;
    /** Bar height in px */
    barHeight?: number;
}

export function ProportionBar({
    data,
    nameKey = 'name',
    valueKey = 'value',
    maxItems = 7,
    barHeight = 14,
}: ProportionBarProps) {
    const money = useMoney();

    // Normalize data and group overflow into "Otros"
    const total = data.reduce((sum, d) => sum + (d[valueKey as keyof ProportionBarItem] as number || 0), 0);
    if (total === 0) return null;

    const sorted = [...data]
        .map(d => ({ name: d[nameKey as keyof ProportionBarItem] as string, value: d[valueKey as keyof ProportionBarItem] as number }))
        .sort((a, b) => b.value - a.value);

    let items = sorted.slice(0, maxItems);
    const rest = sorted.slice(maxItems);
    if (rest.length > 0) {
        const otrosValue = rest.reduce((sum, r) => sum + r.value, 0);
        items.push({ name: 'Otros', value: otrosValue });
    }

    return (
        <div className="flex flex-col gap-2 flex-1 w-full">
            {/* Segmented bar — fills available vertical space */}
            <div className="flex w-full overflow-hidden gap-[2px] flex-1 min-h-[20px] rounded-lg">
                {items.map((item, i) => {
                    const pct = (item.value / total) * 100;
                    if (pct < 0.5) return null;
                    return (
                        <div
                            key={item.name}
                            className="h-full transition-all"
                            style={{
                                width: `${pct}%`,
                                backgroundColor: getChartColor(i),
                            }}
                            title={`${item.name}: ${Math.round(pct)}%`}
                        />
                    );
                })}
            </div>

            {/* Legend grid — tooltip-styled container */}
            <div className="bg-background border border-border/50 rounded-lg shadow-xl px-2.5 py-2 shrink-0">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {items.map((item, i) => {
                        const pct = Math.round((item.value / total) * 100);
                        return (
                            <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                                <div
                                    className="w-2 h-2 rounded-[2px] shrink-0"
                                    style={{ backgroundColor: getChartColor(i) }}
                                />
                                <span className="text-[11px] text-foreground truncate">
                                    {item.name}
                                </span>
                                <span className="text-[11px] font-mono text-muted-foreground ml-auto shrink-0">
                                    {pct}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
