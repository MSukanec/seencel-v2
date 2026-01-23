"use client";

import { Check, Wand2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

export type ColorPreset = {
    name: string;
    hex: string;
    h?: number; // Optional hue value for custom logic if needed, primarily using Hex for presets
};

const PRESETS: ColorPreset[] = [
    { name: "Blue", hex: "#007AFF" },
    { name: "Green", hex: "#34C759" },
    { name: "Yellow", hex: "#FFCC00" },
    { name: "Red", hex: "#FF3B30" },
    { name: "Purple", hex: "#AF52DE" },
    { name: "Indigo", hex: "#5856D6" },
    { name: "Teal", hex: "#00C7BE" },
    { name: "Lime", hex: "#A4D01C" }, // Just an example additional color
];

interface ColorPickerProps {
    color?: string; // Current HEX color
    customHue?: number; // Current Custom Hue (0-360)
    useCustomColor?: boolean;
    onChange: (color: string, isCustom: boolean, hue?: number) => void;
    className?: string;
}

export function ColorPicker({
    color,
    customHue = 258, // Default purple-ish
    useCustomColor = false,
    onChange,
    className,
}: ColorPickerProps) {
    const t = useTranslations('Project.form');

    // Helper to convert Hue to Hex (simplistic for full saturation/value)
    // In a real app we might want a utility for this.
    // hsl(h, 100%, 50%) -> Hex
    const hueToHex = (h: number): string => {
        const s = 100;
        const l = 50;
        const a = s * Math.min(l / 100, 1 - l / 100) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    const handlePresetClick = (preset: ColorPreset) => {
        if (useCustomColor) {
            // If we were in custom mode, maybe we strictly want to stay? 
            // Or switching to preset turns off custom mode. 
            // Usually clicking a preset means "I want this specific color", so disable custom.
            onChange(preset.hex, false, undefined);
        } else {
            onChange(preset.hex, false, undefined);
        }
    };

    const handleCustomToggle = (checked: boolean) => {
        if (checked) {
            // Switch ON custom
            const newHex = hueToHex(customHue);
            onChange(newHex, true, customHue);
        } else {
            // Switch OFF custom - ideally revert to last preset or default.
            // For now, let's pick the first preset if we don't store "last preset".
            onChange(PRESETS[0].hex, false, undefined);
        }
    };

    const handleHueChange = (vals: number[]) => {
        const newHue = vals[0];
        const newHex = hueToHex(newHue);
        onChange(newHex, true, newHue);
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-3 p-1">
                    {PRESETS.map((preset) => {
                        const isSelected = !useCustomColor && color?.toLowerCase() === preset.hex.toLowerCase();
                        return (
                            <button
                                key={preset.hex}
                                type="button"
                                onClick={() => handlePresetClick(preset)}
                                className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50",
                                    isSelected ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
                                )}
                                style={{ backgroundColor: preset.hex }}
                                disabled={useCustomColor}
                            >
                                {isSelected && <Check className="h-5 w-5 text-white drop-shadow-md" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-xl border border-border p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{t('customColor')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-xs transition-colors", useCustomColor ? "text-primary font-medium" : "text-muted-foreground")}>
                            {t('activate')}
                        </span>
                        <Switch
                            checked={useCustomColor}
                            onCheckedChange={handleCustomToggle}
                        />
                    </div>
                </div>

                <div className={cn("space-y-4 transition-all duration-300 grid grid-rows-[1fr]", useCustomColor ? "opacity-100" : "opacity-50 pointer-events-none")}>
                    <div className="overflow-hidden space-y-6 pt-2">
                        {/* Hue Slider */}
                        <Slider
                            disabled={!useCustomColor}
                            min={0}
                            max={360}
                            step={1}
                            value={[customHue]}
                            onValueChange={handleHueChange}
                        />

                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {t('tone')}: <span className="font-medium text-foreground">{customHue}°</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Color:</span>
                                <span className="text-sm font-mono upper">{color}</span>
                                <div
                                    className="h-6 w-6 rounded-full border shadow-sm"
                                    style={{ backgroundColor: color }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <span className="text-sm text-muted-foreground">{t('preview')}:</span>
                            <div
                                className="px-4 py-1.5 rounded-md text-sm font-medium text-white shadow-sm"
                                style={{ backgroundColor: color }}
                            >
                                {t('customColor')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

