/**
 * LocationChip — Chip for simple text-based location
 *
 * Renders MapPin icon + location text. Popover shows a text input.
 * For simple location strings like "En la obra", "Oficina", etc.
 *
 * Future: Could be evolved to support Google Places autocomplete
 * and structured address data (lat/lng, city, etc.)
 *
 * Usage:
 *   <LocationChip value="En la obra" onChange={setLocation} />
 */

"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { ChipBase } from "../chip-base";

// ─── Types ───────────────────────────────────────────────

export interface LocationChipProps {
    value: string;
    onChange: (value: string) => void;
    /** Label when no location set */
    emptyLabel?: string;
    /** Input placeholder */
    placeholder?: string;
    readOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

// ─── Component ───────────────────────────────────────────

export function LocationChip({
    value,
    onChange,
    emptyLabel = "Ubicación",
    placeholder = "Ej: En la obra, Oficina...",
    readOnly = false,
    disabled = false,
    className,
}: LocationChipProps) {
    const [open, setOpen] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const hasValue = !!value && value.trim().length > 0;

    // Auto-focus input when popover opens
    React.useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    return (
        <ChipBase
            icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
            label={hasValue ? value : emptyLabel}
            hasValue={hasValue}
            readOnly={readOnly}
            disabled={disabled}
            open={open}
            onOpenChange={setOpen}
            popoverWidth={260}
            className={className}
        >
            <div className="p-3 space-y-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-muted/30 rounded-lg border border-border/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            setOpen(false);
                        }
                    }}
                />
                {hasValue && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange("");
                            inputRef.current?.focus();
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Limpiar
                    </button>
                )}
            </div>
        </ChipBase>
    );
}
