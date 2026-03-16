/**
 * CategoryPopoverContent — Shared Command content for multi-select categories
 *
 * Used by: category-chip (forms), potentially column factories (tables)
 * Single source of truth for category selection with multi-select.
 * Includes footer action to navigate to categories management page.
 *
 * Follows the same pattern as WalletPopoverContent / CurrencyPopoverContent
 * but with MULTI-SELECT (toggle checkmarks, don't close on select).
 */

"use client";

import * as React from "react";
import { Check, Tag, Settings } from "lucide-react";
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

export interface CategoryPopoverOption {
    value: string;
    label: string;
}

export interface CategoryPopoverContentProps {
    options: CategoryPopoverOption[];
    /** Array of currently selected values (multi-select) */
    currentValues: string[];
    /** Toggle a value on/off */
    onToggle: (value: string) => void;
    /** Called to close the parent popover */
    onOpenChange?: (open: boolean) => void;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Empty search result text */
    emptyText?: string;
    /** Route for "Gestionar categorías" footer action */
    manageRoute?: { pathname: string; query?: Record<string, string> };
    /** Label for the manage action */
    manageLabel?: string;
}

// ─── Component ───────────────────────────────────────────

export function CategoryPopoverContent({
    options,
    currentValues,
    onToggle,
    onOpenChange,
    searchPlaceholder = "Buscar categoría...",
    emptyText = "No hay categorías",
    manageRoute = { pathname: "/organization/contacts/categories" as any },
    manageLabel = "Gestionar categorías",
}: CategoryPopoverContentProps) {
    const router = useRouter();

    return (
        <Command>
            <CommandInput
                placeholder={searchPlaceholder}
                className="h-8 text-xs"
            />
            <CommandList>
                <CommandEmpty className="text-xs py-4 text-center">
                    {emptyText}
                </CommandEmpty>
                <CommandGroup>
                    {options.map((option) => {
                        const isSelected = currentValues.includes(option.value);
                        return (
                            <CommandItem
                                key={option.value}
                                value={option.label}
                                onSelect={() => onToggle(option.value)}
                                className="flex items-center gap-2 text-xs"
                            >
                                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="flex-1 truncate">{option.label}</span>
                                {isSelected && (
                                    <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
                {manageRoute && (
                    <>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                value={`__manage_${manageLabel}__`}
                                onSelect={() => {
                                    onOpenChange?.(false);
                                    router.push(manageRoute as any);
                                }}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                                <Settings className="h-3.5 w-3.5" />
                                <span>{manageLabel}</span>
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </Command>
    );
}
