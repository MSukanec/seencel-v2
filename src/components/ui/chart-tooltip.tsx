"use client";

import { cn } from "@/lib/utils";

interface ChartTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    hideLabel?: boolean;
    indicator?: "line" | "dot" | "dashed";
}

export function ChartTooltip({ active, payload, label, hideLabel = false }: ChartTooltipProps) {
    if (!active || !payload || !payload.length) {
        return null;
    }

    return (
        <div className="rounded-lg border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            {!hideLabel && label && (
                <div className="mb-1 border-b border-border/50 pb-1 font-medium text-xs text-muted-foreground">
                    {label}
                </div>
            )}
            <div className="flex flex-col gap-1.5">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: entry.color || entry.fill }}
                        />
                        <div className="flex flex-1 items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                                {entry.name}:
                            </span>
                            <span className="font-mono font-bold tabular-nums text-foreground">
                                {entry.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Specialized Tooltip for Pie Charts (often no label, just one item focused)
export function PieChartTooltip({ active, payload }: ChartTooltipProps) {
    if (!active || !payload || !payload.length) {
        return null;
    }

    // Usually pie charts send 1 payload item on hover
    const data = payload[0];

    return (
        <div className="rounded-lg border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-2">
                <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: data.payload.fill || data.color }}
                />
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                        {data.name}:
                    </span>
                    <span className="font-bold tabular-nums text-foreground">
                        {data.value}%
                    </span>
                </div>
            </div>
        </div>
    );
}
