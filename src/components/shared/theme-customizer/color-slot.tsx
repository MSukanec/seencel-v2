"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns '#000000' or '#ffffff' depending on background luminance */
function getContrastColor(hex: string): string {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.substring(0, 2), 16) / 255;
    const g = parseInt(cleaned.substring(2, 4), 16) / 255;
    const b = parseInt(cleaned.substring(4, 6), 16) / 255;
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.35 ? '#000000' : '#ffffff';
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ColorSlotProps {
    /** Display label, e.g. "Primario", "Fondo" */
    label: string;
    /** Current hex color value */
    value: string;
    /** The original extracted color (for reset) */
    originalValue: string;
    /** Callback when color changes */
    onChange: (hex: string) => void;
    /** Optional className */
    className?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * ColorSlot — A labeled color swatch with inline native color picker.
 * 
 * Features:
 * - Shows label + hex code
 * - Click opens a Popover with native color input + reset button
 * - Click on hex copies to clipboard via sonner toast
 * - Smart text contrast (white on dark, black on light)
 */
export function ColorSlot({
    label,
    value,
    originalValue,
    onChange,
    className,
}: ColorSlotProps) {
    const [open, setOpen] = React.useState(false);
    const isModified = value.toLowerCase() !== originalValue.toLowerCase();
    const contrastColor = getContrastColor(value);

    const handleCopyHex = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value.toUpperCase());
        toast.success(`${value.toUpperCase()} copiado`);
    };

    const handleReset = () => {
        onChange(originalValue);
    };

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            {/* Label */}
            <span className="text-[11px] font-medium text-muted-foreground leading-none">
                {label}
            </span>

            {/* Swatch */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "relative group/slot flex items-center justify-center",
                            "w-full h-12 rounded-lg",
                            "shadow-sm ring-1 ring-white/10",
                            "transition-all hover:ring-white/30 hover:scale-[1.02]",
                            "cursor-pointer",
                            isModified && "ring-2 ring-primary/50"
                        )}
                        style={{ backgroundColor: value }}
                    >
                        {/* Hex value — click to copy */}
                        <span
                            onClick={handleCopyHex}
                            className={cn(
                                "text-[10px] font-mono font-semibold leading-none",
                                "opacity-60 group-hover/slot:opacity-100 transition-opacity",
                                "cursor-copy"
                            )}
                            style={{ color: contrastColor }}
                        >
                            {value.toUpperCase()}
                        </span>

                        {/* Modified indicator dot */}
                        {isModified && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-52 p-3"
                    side="bottom"
                    align="center"
                    sideOffset={6}
                >
                    <div className="flex flex-col gap-3">
                        {/* Native color picker */}
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
                            />
                            <div className="flex-1">
                                <p className="text-xs font-medium">{label}</p>
                                <p className="text-[10px] font-mono text-muted-foreground">
                                    {value.toUpperCase()}
                                </p>
                            </div>
                        </div>

                        {/* Reset button — only if modified */}
                        {isModified && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className={cn(
                                    "flex items-center justify-center gap-1.5",
                                    "w-full h-8 rounded-md",
                                    "text-xs font-medium text-muted-foreground",
                                    "bg-muted/50 hover:bg-muted transition-colors"
                                )}
                            >
                                <RotateCcw className="h-3 w-3" />
                                Restaurar original
                                <span
                                    className="ml-1 w-3 h-3 rounded-sm ring-1 ring-white/10"
                                    style={{ backgroundColor: originalValue }}
                                />
                            </button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
