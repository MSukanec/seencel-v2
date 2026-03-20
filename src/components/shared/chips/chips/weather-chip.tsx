/**
 * WeatherChip — Chip for weather selection in forms
 *
 * Renders a weather icon + label. Popover shows WeatherPopoverContent.
 */

"use client";

import * as React from "react";
import {
    WeatherPopoverContent,
    WeatherIcon,
    DEFAULT_WEATHER_OPTIONS,
    WEATHER_VISUAL_CONFIG,
    type WeatherOption,
    type WeatherType,
} from "@/components/shared/popovers/weather-popover-content";
import { ChipBase } from "../chip-base";

// ─── Types ───────────────────────────────────────────────

export type { WeatherType } from "@/components/shared/popovers/weather-popover-content";

export interface WeatherChipProps {
    value: string;
    onChange: (value: string) => void | Promise<void>;
    options?: WeatherOption[];
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Component ───────────────────────────────────────────

export function WeatherChip({
    value,
    onChange,
    options = DEFAULT_WEATHER_OPTIONS,
    readOnly = false,
    disabled = false,
    className,
}: WeatherChipProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const config = WEATHER_VISUAL_CONFIG[value as WeatherType];
    const label = config?.label || value || "Clima";

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
            setOpen(false);
        }
    };

    return (
        <ChipBase
            icon={<WeatherIcon weather={value} />}
            label={label}
            hasValue={!!value}
            readOnly={readOnly}
            disabled={disabled}
            loading={loading}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={220}
            className={className}
        >
            <WeatherPopoverContent
                options={options}
                currentValue={value}
                onSelect={handleSelect}
            />
        </ChipBase>
    );
}
