/**
 * WeatherPopoverContent — Shared Command content for weather selection
 *
 * Used by: weather-chip (forms), weather-column (tables)
 * Single source of truth for the weather selector UI.
 * Matches DB enum `weather_enum`: sunny, partly_cloudy, cloudy, rain, storm, snow, fog, windy, hail
 */

"use client";

import * as React from "react";
import { Check, Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, Wind, CloudHail } from "lucide-react";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

/** Matches DB enum weather_enum */
export type WeatherType = "sunny" | "partly_cloudy" | "cloudy" | "rain" | "storm" | "snow" | "fog" | "windy" | "hail";

export interface WeatherOption {
    value: string;
    label: string;
}

export interface WeatherPopoverContentProps {
    options?: WeatherOption[];
    currentValue: string;
    onSelect: (value: string) => void;
}

// ─── Weather Visual Config ───────────────────────────────

export const WEATHER_VISUAL_CONFIG: Record<WeatherType, {
    icon: React.ElementType;
    color: string;
    label: string;
}> = {
    sunny: { icon: Sun, color: "text-yellow-500", label: "Soleado" },
    partly_cloudy: { icon: CloudSun, color: "text-yellow-500", label: "Parcialmente Nublado" },
    cloudy: { icon: Cloud, color: "text-gray-400", label: "Nublado" },
    rain: { icon: CloudRain, color: "text-blue-500", label: "Lluvia" },
    storm: { icon: CloudLightning, color: "text-purple-500", label: "Tormenta" },
    snow: { icon: Snowflake, color: "text-cyan-400", label: "Nieve" },
    fog: { icon: CloudFog, color: "text-gray-400", label: "Niebla" },
    windy: { icon: Wind, color: "text-blue-300", label: "Ventoso" },
    hail: { icon: CloudHail, color: "text-blue-700", label: "Granizo" },
};

// ─── Default Options ─────────────────────────────────────

export const DEFAULT_WEATHER_OPTIONS: WeatherOption[] = Object.entries(WEATHER_VISUAL_CONFIG).map(
    ([value, config]) => ({ value, label: config.label })
);

// ─── WeatherIcon helper ──────────────────────────────────

export function WeatherIcon({ weather, className }: { weather: WeatherType | string | null; className?: string }) {
    if (!weather) return <Cloud className={cn("h-3.5 w-3.5 text-muted-foreground/50", className)} />;
    const config = WEATHER_VISUAL_CONFIG[weather as WeatherType];
    if (!config) return <Cloud className={cn("h-3.5 w-3.5 text-muted-foreground/50", className)} />;
    const Icon = config.icon;
    return <Icon className={cn("h-3.5 w-3.5", config.color, className)} />;
}

// ─── WeatherBadge ────────────────────────────────────────

export function WeatherBadge({ weather, label, className }: { weather: string | null; label?: string; className?: string }) {
    if (!weather) {
        return (
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-[450]", className)}>
                <Cloud className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-muted-foreground">Sin definir</span>
            </span>
        );
    }
    const config = WEATHER_VISUAL_CONFIG[weather as WeatherType];
    if (!config) return <span className="text-xs text-muted-foreground">{label || weather}</span>;
    const Icon = config.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-[450]", className)}>
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
            <span className="text-foreground">{label || config.label}</span>
        </span>
    );
}

// ─── Component ───────────────────────────────────────────

export function WeatherPopoverContent({
    options = DEFAULT_WEATHER_OPTIONS,
    currentValue,
    onSelect,
}: WeatherPopoverContentProps) {
    return (
        <Command>
            <CommandList>
                <CommandGroup>
                    {options.map((option) => {
                        const config = WEATHER_VISUAL_CONFIG[option.value as WeatherType];
                        const Icon = config?.icon || Cloud;
                        const color = config?.color || "text-muted-foreground";
                        return (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                keywords={[option.label]}
                                onSelect={() => onSelect(option.value)}
                                className="flex items-center gap-2 text-xs"
                            >
                                <Icon className={cn("h-3.5 w-3.5", color)} />
                                <span className="flex-1">{option.label}</span>
                                {currentValue === option.value && (
                                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
