/**
 * ColorChip — Chip for color selection
 *
 * Renders a small color swatch + detected color name. Popover shows ColorPopoverContent.
 * Same component works in forms, tables, and detail panels.
 */

"use client";

import * as React from "react";
import { Paintbrush } from "lucide-react";
import { ColorPopoverContent, STANDARD_COLORS } from "@/components/shared/popovers";
import { ChipBase } from "../chip-base";

// ─── Color Name Detection ────────────────────────────────

/** Known colors from STANDARD_COLORS with their Spanish names */
const COLOR_NAMES: Record<string, string> = {
    "#007AFF": "Azul",
    "#5856D6": "Índigo",
    "#AF52DE": "Púrpura",
    "#FF2D55": "Rosa",
    "#FF3B30": "Rojo",
    "#FF9500": "Naranja",
    "#FFCC00": "Amarillo",
    "#34C759": "Verde",
    "#00C7BE": "Turquesa",
    "#5AC8FA": "Celeste",
    "#8E8E93": "Gris",
};

/** For custom colors, detect family by hue */
function hexToHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return [h * 360, s, l];
}

function getColorNameByHue(hex: string): string {
    const [h, s, l] = hexToHsl(hex);
    if (s < 0.1) return l < 0.3 ? "Negro" : l > 0.8 ? "Blanco" : "Gris";
    if (h < 15 || h >= 345) return "Rojo";
    if (h < 40) return "Naranja";
    if (h < 65) return "Amarillo";
    if (h < 160) return "Verde";
    if (h < 195) return "Turquesa";
    if (h < 250) return "Azul";
    if (h < 290) return "Púrpura";
    if (h < 345) return "Rosa";
    return "Rojo";
}

function getColorName(hex: string): string {
    if (!hex) return "";
    const upper = hex.toUpperCase();
    return COLOR_NAMES[upper] || getColorNameByHue(hex);
}

// ─── Types ───────────────────────────────────────────────

export interface ColorChipProps {
    value: string;
    onChange: (value: string) => void | Promise<void>;
    /** Available color options (hex values). Defaults to STANDARD_COLORS */
    colors?: string[];
    /** Label when no color selected */
    emptyLabel?: string;
    /** Allow clearing the selection */
    allowNone?: boolean;
    /** Show custom color picker */
    showPicker?: boolean;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Color Swatch Icon ───────────────────────────────────

function ColorSwatchIcon({ color }: { color: string }) {
    return (
        <div
            className="h-3.5 w-3.5 rounded-full ring-1 ring-white/20 shadow-sm"
            style={{ backgroundColor: color }}
        />
    );
}

// ─── Component ───────────────────────────────────────────

export function ColorChip({
    value,
    onChange,
    colors = STANDARD_COLORS,
    emptyLabel = "Color",
    allowNone = false,
    showPicker = true,
    readOnly = false,
    disabled = false,
    className,
}: ColorChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const hasValue = !!value;
    const colorLabel = hasValue ? getColorName(value) : "";

    const handleSelect = async (newValue: string) => {
        if (newValue === value) {
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            await onChange(newValue);
        } finally {
            setLoading(false);
            if (!newValue || colors.includes(newValue)) {
                setOpen(false);
            }
        }
    };

    return (
        <ChipBase
            icon={
                hasValue
                    ? <ColorSwatchIcon color={value} />
                    : <Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />
            }
            label={hasValue ? colorLabel : emptyLabel}
            hasValue={hasValue}
            readOnly={readOnly}
            disabled={disabled}
            loading={loading}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={280}
            className={className}
        >
            <ColorPopoverContent
                colors={colors}
                currentValue={value}
                onSelect={handleSelect}
                allowNone={allowNone}
                showPicker={showPicker}
            />
        </ChipBase>
    );
}
