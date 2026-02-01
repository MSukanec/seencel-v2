"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColorPreset = {
    name: string;
    hex: string;
};

const PRESETS: ColorPreset[] = [
    { name: "Blue", hex: "#007AFF" },
    { name: "Green", hex: "#34C759" },
    { name: "Yellow", hex: "#FFCC00" },
    { name: "Red", hex: "#FF3B30" },
    { name: "Purple", hex: "#AF52DE" },
    { name: "Indigo", hex: "#5856D6" },
    { name: "Teal", hex: "#00C7BE" },
    { name: "Lime", hex: "#A4D01C" },
];

interface ColorPickerProps {
    color?: string;
    onChange: (color: string) => void;
    className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex flex-wrap justify-center gap-3 p-1">
                {PRESETS.map((preset) => {
                    const isSelected = color?.toLowerCase() === preset.hex.toLowerCase();
                    return (
                        <button
                            key={preset.hex}
                            type="button"
                            onClick={() => onChange(preset.hex)}
                            className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
                                isSelected ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
                            )}
                            style={{ backgroundColor: preset.hex }}
                        >
                            {isSelected && <Check className="h-5 w-5 text-white drop-shadow-md" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
