"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    className?: string;
    intent?: "positive" | "negative" | "neutral" | "warning" | "info";
    strokeWidth?: number;
}

export function Sparkline({
    data,
    width = 100,
    height = 40,
    className,
    intent = "neutral",
    strokeWidth = 2
}: SparklineProps) {

    const points = useMemo(() => {
        if (!data || data.length < 2) return "";

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        const stepX = width / (data.length - 1);

        return data.map((d, i) => {
            const x = i * stepX;
            // Normalize y: (val - min) / range * height
            // Invert y because SVG 0 is top
            const normalizedY = ((d - min) / range) * (height - strokeWidth * 2);
            const y = height - strokeWidth - normalizedY;
            return `${x},${y}`;
        }).join(" ");
    }, [data, width, height, strokeWidth]);

    const getColor = () => {
        switch (intent) {
            case "positive": return "stroke-emerald-500";
            case "negative": return "stroke-red-500";
            case "warning": return "stroke-amber-500";
            case "info": return "stroke-blue-500";
            case "neutral": default: return "stroke-muted-foreground/50";
        }
    };

    if (!data || data.length < 2) return null;

    return (
        <svg
            width={width}
            height={height}
            className={cn("overflow-visible", className)}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
        >
            <polyline
                points={points}
                fill="none"
                className={cn(getColor(), "transition-colors duration-300")}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
