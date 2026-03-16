"use client";

import { useMoney } from "@/hooks/use-money";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";

// ============================================================================
// WAFFLE HORIZONTAL BAR — Horizontal bars made of small squares
// ============================================================================
// Each row is a horizontal line of tiny squares.
// Labels float INSIDE the bar on the right (overlaid).
// Tooltip follows cursor, matching ChartTooltipContent styling.
// ============================================================================

export interface WaffleHorizontalItem {
    name: string;
    amount: number;
}

export interface WaffleHorizontalBarProps {
    data: WaffleHorizontalItem[];
    /** Total visible slots (pads with empty). Default 5. */
    slots?: number;
    /** Gap between squares in px. Default 1. */
    cellGap?: number;
    /** Fill color CSS value. Default var(--primary) */
    color?: string;
    /** Format values */
    formatValue?: (v: number) => string;
}

export function WaffleHorizontalBar({
    data,
    slots = 5,
    cellGap = 1,
    color = "var(--primary)",
    formatValue,
}: WaffleHorizontalBarProps) {
    const money = useMoney();
    const fmt = formatValue || ((v: number) => money.format(v));
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const w = Math.floor(entry.contentRect.width);
                const h = Math.floor(entry.contentRect.height);
                setDimensions(prev => {
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
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }, []);

    const maxValue = useMemo(() => Math.max(...data.map(d => d.amount), 1), [data]);
    const totalAmount = useMemo(() => data.reduce((s, d) => s + d.amount, 0), [data]);

    const items = useMemo(() => {
        const padded = [...data.slice(0, slots)];
        while (padded.length < slots) {
            padded.push({ name: "", amount: 0 });
        }
        return padded;
    }, [data, slots]);

    const layout = useMemo(() => {
        if (dimensions.width === 0 || dimensions.height === 0) return null;

        const rowGap = 4;
        const rowHeight = (dimensions.height - (slots - 1) * rowGap) / slots;
        const cellSize = Math.max(4, Math.min(8, Math.floor(rowHeight / 2)));
        const squaresHigh = Math.max(1, Math.floor((rowHeight + cellGap) / (cellSize + cellGap)));
        const totalSquares = Math.floor((dimensions.width + cellGap) / (cellSize + cellGap));

        return { cellSize, totalSquares, squaresHigh, rowGap };
    }, [dimensions, slots, cellGap]);

    return (
        <div
            ref={containerRef}
            className="flex-1 w-full min-h-0 overflow-hidden"
            onMouseMove={handleMouseMove}
        >
            {layout && (
                <>
                    <div className="flex flex-col h-full" style={{ gap: `${layout.rowGap}px` }}>
                        {items.map((item, idx) => {
                            const isEmpty = item.amount === 0;
                            const filledSquares = isEmpty
                                ? 0
                                : Math.max(1, Math.round((item.amount / maxValue) * layout.totalSquares));
                            const share = totalAmount > 0
                                ? Math.round((item.amount / totalAmount) * 100)
                                : 0;

                            return (
                                <div
                                    key={isEmpty ? `empty-${idx}` : item.name}
                                    className="relative flex-1 min-h-0 cursor-default"
                                    onMouseEnter={() => !isEmpty && setHoveredIdx(idx)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                >
                                    {/* Squares grid */}
                                    <div
                                        className="flex flex-col w-full"
                                        style={{ gap: `${cellGap}px` }}
                                    >
                                        {Array.from({ length: layout.squaresHigh }, (_, rowIdx) => (
                                            <div
                                                key={rowIdx}
                                                className="flex"
                                                style={{ gap: `${cellGap}px` }}
                                            >
                                                {Array.from({ length: layout.totalSquares }, (_, sqIdx) => {
                                                    const isFilled = sqIdx < filledSquares;
                                                    return (
                                                        <div
                                                            key={sqIdx}
                                                            className="rounded-[1px]"
                                                            style={{
                                                                width: layout.cellSize,
                                                                height: layout.cellSize,
                                                                backgroundColor: isFilled
                                                                    ? `color-mix(in srgb, ${color} ${Math.max(50, 80 - Math.round((sqIdx / Math.max(1, filledSquares)) * 30))}%, transparent)`
                                                                    : "rgba(128, 128, 128, 0.12)",
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Label INSIDE the bar — overlaid at right */}
                                    {!isEmpty && (
                                        <div className="absolute inset-y-0 right-0 flex items-center z-10 pr-1.5">
                                            <div className="bg-background/90 border border-border/50 rounded-md shadow-lg px-2 py-0.5 flex flex-col justify-center min-w-0">
                                                <span className="text-[11px] font-medium text-foreground truncate leading-tight">
                                                    {item.name}
                                                </span>
                                                <span className="text-[10px] font-mono text-muted-foreground leading-tight">
                                                    {fmt(item.amount)} · {share}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Tooltip — follows cursor, ChartTooltipContent styling */}
                    {hoveredIdx !== null && items[hoveredIdx] && items[hoveredIdx].amount > 0 && (
                        <div
                            className="fixed z-[100] pointer-events-none"
                            style={{
                                left: (containerRef.current?.getBoundingClientRect().left ?? 0) + mousePos.x + 12,
                                top: (containerRef.current?.getBoundingClientRect().top ?? 0) + mousePos.y - 40,
                            }}
                        >
                            <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                                <div className="font-medium">{items[hoveredIdx].name}</div>
                                <div className="flex w-full items-center gap-2">
                                    <div
                                        className="shrink-0 h-2.5 w-2.5 rounded-[2px]"
                                        style={{ backgroundColor: color }}
                                    />
                                    <div className="flex flex-1 justify-between items-center gap-2">
                                        <span className="text-muted-foreground">Monto</span>
                                        <span className="font-mono font-medium tabular-nums text-foreground">
                                            {fmt(items[hoveredIdx].amount)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Participación</span>
                                    <span className="font-mono font-medium tabular-nums text-foreground">
                                        {Math.round((items[hoveredIdx].amount / totalAmount) * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
