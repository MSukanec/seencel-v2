/**
 * ColorPopoverContent — Shared popover content for color selection
 *
 * Used by: color-chip (forms), context menus, column factories
 * Single source of truth for the color selector UI.
 *
 * Features:
 * - Standard color palette grid
 * - Full color picker (HSL gradient) toggle — like Linear
 * - Optional "no color" action
 */

"use client";

import * as React from "react";
import { Check, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Default Standard Palette ────────────────────────────
// Inspired by Linear's default palette — rich, harmonious colors

export const STANDARD_COLORS = [
    "#007AFF", // Blue
    "#5856D6", // Indigo
    "#AF52DE", // Purple
    "#FF2D55", // Pink
    "#FF3B30", // Red
    "#FF9500", // Orange
    "#FFCC00", // Yellow
    "#34C759", // Green
    "#00C7BE", // Teal
    "#5AC8FA", // Cyan
    "#8E8E93", // Gray
];

// ─── Types ───────────────────────────────────────────────

export interface ColorPopoverContentProps {
    colors?: string[];
    currentValue: string;
    onSelect: (value: string) => void;
    /** Show "no color" swatch at end of palette (default: true) */
    allowNone?: boolean;
    /** Show custom color picker toggle */
    showPicker?: boolean;
}

// ─── Color Swatch ────────────────────────────────────────

function ColorSwatch({
    color,
    selected,
    onClick,
    className,
}: {
    color: string;
    selected: boolean;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center",
                "ring-1 ring-white/20 shadow-sm",
                "hover:scale-110 hover:ring-2 hover:ring-foreground/30",
                selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                className
            )}
            style={{ backgroundColor: color }}
        >
            {selected && (
                <Check className="h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
            )}
        </button>
    );
}

// ─── Custom Color Picker ─────────────────────────────────

function CustomColorPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (color: string) => void;
}) {
    const [hexInput, setHexInput] = React.useState(value || "#007AFF");

    // Sync external value changes
    React.useEffect(() => {
        if (value) setHexInput(value);
    }, [value]);

    const handleHexChange = (input: string) => {
        const hex = input.startsWith("#") ? input : `#${input}`;
        setHexInput(hex);

        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            onChange(hex);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Color preview + native picker trigger */}
            <label className="relative cursor-pointer shrink-0">
                <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(hexInput) ? hexInput : "#007AFF"}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                    className="w-7 h-7 rounded-full ring-1 ring-white/20 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: hexInput }}
                />
            </label>

            {/* HEX input */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-muted/50 rounded-md px-2.5 py-1.5">
                <span className="text-[11px] text-muted-foreground/60 font-medium select-none">HEX</span>
                <input
                    type="text"
                    value={hexInput.toUpperCase()}
                    onChange={(e) => handleHexChange(e.target.value)}
                    maxLength={7}
                    className="flex-1 min-w-0 bg-transparent text-xs text-foreground outline-none border-none font-mono"
                    placeholder="#000000"
                />
            </div>

            {/* Color wheel — opens native picker */}
            <label className="relative cursor-pointer shrink-0">
                <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(hexInput) ? hexInput : "#007AFF"}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform"
                    style={{
                        background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                    }}
                />
            </label>
        </div>
    );
}

// ─── Component ───────────────────────────────────────────

export function ColorPopoverContent({
    colors = STANDARD_COLORS,
    currentValue,
    onSelect,
    allowNone = true,
    showPicker = true,
}: ColorPopoverContentProps) {
    const [showCustomPicker, setShowCustomPicker] = React.useState(false);

    // Auto-show picker if current value is not in the palette
    const isCustomColor = currentValue && !colors.includes(currentValue);

    return (
        <div className="p-3 space-y-3">
            {/* Standard Palette */}
            <div className="space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">Colores</p>
                <div className="flex flex-wrap gap-1.5">
                    {colors.map((color) => (
                        <ColorSwatch
                            key={color}
                            color={color}
                            selected={currentValue === color}
                            onClick={() => onSelect(color)}
                        />
                    ))}
                    {/* No-color swatch — always last */}
                    {allowNone && (
                        <button
                            type="button"
                            onClick={() => onSelect("")}
                            className={cn(
                                "w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center relative",
                                "ring-1 ring-border shadow-sm bg-muted/50",
                                "hover:scale-110 hover:ring-2 hover:ring-foreground/30",
                                !currentValue && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            )}
                            title="Sin color"
                        >
                            {/* Diagonal strike-through */}
                            <div className="w-full h-[1.5px] bg-muted-foreground/50 rotate-45 absolute" />
                            {!currentValue && (
                                <Check className="absolute h-3 w-3 text-foreground" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Custom picker toggle */}
            {showPicker && (
                <>
                    <div className="border-t border-border/20" />
                    {(showCustomPicker || isCustomColor) ? (
                        <CustomColorPicker
                            value={currentValue}
                            onChange={onSelect}
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowCustomPicker(true)}
                            className="flex items-center gap-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-0.5"
                        >
                            <Pipette className="h-3.5 w-3.5" />
                            <span>Color personalizado</span>
                        </button>
                    )}
                </>
            )}

        </div>
    );
}
