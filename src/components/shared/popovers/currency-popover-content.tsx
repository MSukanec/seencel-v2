/**
 * CurrencyPopoverContent — Shared Command content for currency selection
 *
 * Used by: currency-chip (forms), future currency-column (tables)
 * Single source of truth for the currency selector UI.
 * Includes built-in footer action to navigate to Settings > Finanzas.
 */

"use client";

import * as React from "react";
import { Check, CircleDollarSign, Settings } from "lucide-react";
import { useRouter } from "@/i18n/routing";
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

export interface CurrencyPopoverOption {
    value: string;
    label: string;
    symbol?: string;
}

export interface CurrencyPopoverContentProps {
    options: CurrencyPopoverOption[];
    currentValue: string;
    onSelect: (value: string) => void;
    /** Called after selection or footer action to close the parent popover */
    onOpenChange?: (open: boolean) => void;
}

// ─── Component ───────────────────────────────────────────

export function CurrencyPopoverContent({
    options,
    currentValue,
    onSelect,
    onOpenChange,
}: CurrencyPopoverContentProps) {
    const router = useRouter();

    return (
        <Command>
            <CommandInput placeholder="Buscar moneda..." className="h-8 text-xs" />
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
                            <span className="text-xs font-mono text-muted-foreground w-5 text-center">
                                {option.symbol || "$"}
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
                        value="__manage_currencies__"
                        onSelect={() => {
                            onOpenChange?.(false);
                            router.push("/settings/finance");
                        }}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        <span>Gestionar monedas</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
