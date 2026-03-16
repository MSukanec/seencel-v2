"use client";

import { useMoney } from "@/hooks/use-money";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";

// ============================================================================
// WAFFLE BAR CHART — Vertical bars made of small squares
// ============================================================================

export interface WaffleBarItem {
    label: string;
    value: number;
}

export interface WaffleBarChartProps {
    data: WaffleBarItem[];
    /** Fill color CSS value. Default var(--primary) */
    color?: string;
    /** Gap between squares in px. Default 1. */
    cellGap?: number;
    /** Format values for tooltip */
    formatValue?: (v: number) => string;
    /** Optional reference line value */
    referenceValue?: number;
    /** Reference line label */
    referenceLabel?: string;
}

export function WaffleBarChart({
    data,
    color = "var(--primary)",
    cellGap = 1,
    formatValue,
    referenceValue,
    referenceLabel,
}: WaffleBarChartProps) {
    const money = useMoney();
    const fmt = formatValue || ((v: number) => money.format(v));
    const containerRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ width: 0, height: 0 });
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Measure container ONCE on mount + on resize, but NOT on content changes
    // overflow:hidden on the container prevents content from affecting size
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const w = Math.floor(entry.contentRect.width);
                const h = Math.floor(entry.contentRect.height);
                setDims(prev => {
                    // Only update if meaningfully different (prevent loop)
                    if (Math.abs(prev.width - w) > 2 || Math.abs(prev.height - h) > 2) {
                        return { width: w, height: h };
                    }
                    return prev;
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

    const layout = useMemo(() => {
        if (dims.width === 0 || dims.height === 0) return null;

        const barCount = data.length;
        const barGap = 8;
        const labelHeight = 18;
        const availablePerBar = (dims.width - (barCount - 1) * barGap) / barCount;
        const squaresWide = Math.min(6, Math.max(2, Math.floor(availablePerBar / 8)));
        const cellSize = Math.floor((availablePerBar - (squaresWide - 1) * cellGap) / squaresWide);
        const chartHeight = dims.height - labelHeight;
        const totalRows = Math.floor((chartHeight + cellGap) / (cellSize + cellGap));

        return { cellSize, squaresWide, totalRows, barGap };
    }, [dims, data.length, cellGap]);

    const refRowIdx = layout && referenceValue
        ? Math.round((referenceValue / maxValue) * layout.totalRows)
        : null;

    return (
        <div
            ref={containerRef}
            className="w-full flex-1 min-h-0 relative overflow-hidden"
            onMouseMove={handleMouseMove}
        >
            {layout && layout.totalRows > 0 && (
                <>
                    <div
                        className="h-full flex items-end justify-between"
                        style={{ gap: `${layout.barGap}px`, paddingBottom: 18 }}
                    >
                        {data.map((item, idx) => {
                            const filledRows = Math.max(
                                item.value > 0 ? 1 : 0,
                                Math.round((item.value / maxValue) * layout.totalRows)
                            );

                            return (
                                <div
                                    key={idx}
                                    className="flex-1 flex flex-col items-center cursor-default"
                                    onMouseEnter={() => setHoveredIdx(idx)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                >
                                    <div
                                        className="flex flex-col-reverse items-center"
                                        style={{ gap: `${cellGap}px` }}
                                    >
                                        {Array.from({ length: layout.totalRows }, (_, rowIdx) => {
                                            const isFilled = rowIdx < filledRows;
                                            return (
                                                <div
                                                    key={rowIdx}
                                                    className="flex"
                                                    style={{ gap: `${cellGap}px` }}
                                                >
                                                    {Array.from({ length: layout.squaresWide }, (_, colIdx) => (
                                                        <div
                                                            key={colIdx}
                                                            className="rounded-[1px]"
                                                            style={{
                                                                width: layout.cellSize,
                                                                height: layout.cellSize,
                                                                backgroundColor: isFilled
                                                                    ? `color-mix(in srgb, ${color} ${Math.max(50, Math.round(((rowIdx + 1) / filledRows) * 50) + 50)}%, transparent)`
                                                                    : "rgba(128, 128, 128, 0.12)",
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium text-center truncate w-full mt-1">
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tooltip */}
                    {hoveredIdx !== null && (
                        <div
                            className="fixed z-[100] pointer-events-none"
                            style={{
                                left: (containerRef.current?.getBoundingClientRect().left ?? 0) + mousePos.x + 12,
                                top: (containerRef.current?.getBoundingClientRect().top ?? 0) + mousePos.y - 40,
                            }}
                        >
                            <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                                <div className="font-medium">{data[hoveredIdx].label}</div>
                                <div className="flex w-full items-center gap-2">
                                    <div
                                        className="shrink-0 h-2.5 w-2.5 rounded-[2px]"
                                        style={{ backgroundColor: color }}
                                    />
                                    <div className="flex flex-1 justify-between items-center gap-2">
                                        <span className="text-muted-foreground">Monto</span>
                                        <span className="font-mono font-medium tabular-nums text-foreground">
                                            {fmt(data[hoveredIdx].value)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reference line */}
                    {refRowIdx !== null && referenceLabel && (
                        <div
                            className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                            style={{
                                bottom: `${18 + (refRowIdx / layout.totalRows) * (dims.height - 18)}px`,
                            }}
                        >
                            <div className="border-t border-dashed border-muted-foreground/40 flex-1" />
                            <span className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 bg-card rounded">
                                {referenceLabel}
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
