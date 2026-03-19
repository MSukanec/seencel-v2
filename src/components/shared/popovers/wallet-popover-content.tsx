/**
 * WalletPopoverContent — Shared Command content for wallet selection
 *
 * Used by: wallet-chip (forms), wallet-column (tables)
 * Single source of truth for the wallet selector UI.
 * Includes built-in footer action to navigate to Settings > Finanzas.
 */

"use client";

import * as React from "react";
import { Check, Wallet, Settings } from "lucide-react";
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

export interface WalletPopoverOption {
    value: string;
    label: string;
}

export interface WalletPopoverContentProps {
    options: WalletPopoverOption[];
    currentValue: string;
    onSelect: (value: string) => void;
    /** Called after selection or footer action to close the parent popover */
    onOpenChange?: (open: boolean) => void;
}

// ─── Component ───────────────────────────────────────────

export function WalletPopoverContent({
    options,
    currentValue,
    onSelect,
    onOpenChange,
}: WalletPopoverContentProps) {
    const router = useRouter();

    return (
        <Command>
            <CommandInput placeholder="Buscar billetera..." className="h-8 text-xs" />
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
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
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
                        value="__manage_wallets__"
                        onSelect={() => {
                            onOpenChange?.(false);
                            router.push("/settings/finance");
                        }}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        <span>Gestionar billeteras</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
