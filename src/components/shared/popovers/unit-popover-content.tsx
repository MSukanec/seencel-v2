/**
 * UnitPopoverContent — Shared Command content for unit selection
 *
 * Used by: unit-chip (forms), unit-column (tables)
 * Single source of truth for the unit selector UI.
 * Includes built-in footer action to navigate to Settings > Unidades.
 */

"use client";

import * as React from "react";
import { Check, Ruler, Settings } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import {
    Command,
    CommandInput,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandEmpty,
    CommandSeparator,
} from "@/components/ui/command";

// ─── Types ───────────────────────────────────────────────

export interface UnitPopoverOption {
    value: string;
    label: string;
    symbol?: string;
}

export interface UnitPopoverContentProps {
    options: UnitPopoverOption[];
    currentValue?: string | null;
    onSelect: (value: string) => void;
    /** Called after selection or footer action to close the parent popover */
    onOpenChange?: (open: boolean) => void;
}

// ─── Component ───────────────────────────────────────────

export function UnitPopoverContent({
    options,
    currentValue,
    onSelect,
    onOpenChange,
}: UnitPopoverContentProps) {
    const router = useRouter();
    const { closePanel } = usePanel();

    return (
        <Command>
            <CommandInput placeholder="Buscar unidad..." className="h-8 text-xs" />
            <CommandList>
                <CommandEmpty className="text-xs py-4 text-center">No encontrada</CommandEmpty>
                <CommandGroup>
                    {options.map((option) => (
                        <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => onSelect(option.value)}
                            className="flex items-center gap-2 text-xs"
                        >
                            <span className="text-muted-foreground w-6 flex justify-center">
                                {option.symbol && option.symbol.length <= 3 ? (
                                    <span className="text-[10px] font-mono font-medium">{option.symbol}</span>
                                ) : (
                                    <Ruler className="h-3.5 w-3.5" />
                                )}
                            </span>
                            <span className="flex-1">{option.label}</span>
                            {currentValue === option.value && (
                                <Check className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                    <CommandItem
                        value="__manage_units__"
                        onSelect={() => {
                            onOpenChange?.(false);
                            closePanel();
                            router.push("/settings/units");
                        }}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        <span>Gestionar unidades</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
