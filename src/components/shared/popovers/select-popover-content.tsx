/**
 * SelectPopoverContent — Shared Command content for generic selection
 *
 * Used by: select-chip (forms), entity-column (tables)
 * Single source of truth for searchable list selectors (concepts, categories, etc.)
 * Includes optional footer action to navigate to management page.
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

export interface SelectPopoverOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    /** Optional subtitle (e.g. category name) */
    subtitle?: string;
}

export interface SelectPopoverContentProps {
    options: SelectPopoverOption[];
    currentValue: string;
    onSelect: (value: string) => void;
    /** Called after selection or footer action to close the parent popover */
    onOpenChange?: (open: boolean) => void;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Empty search result text */
    emptyText?: string;
    /** Default icon for options without custom icon */
    defaultIcon?: React.ReactNode;
    /** Route for "Gestionar..." footer action */
    manageRoute?: { pathname: string; query?: Record<string, string> };
    /** Label for the manage action */
    manageLabel?: string;
}

// ─── Component ───────────────────────────────────────────

export function SelectPopoverContent({
    options,
    currentValue,
    onSelect,
    onOpenChange,
    searchPlaceholder = "Buscar...",
    emptyText = "Sin resultados",
    defaultIcon,
    manageRoute,
    manageLabel = "Gestionar...",
}: SelectPopoverContentProps) {
    const router = useRouter();
    const fallbackIcon = defaultIcon || <Tag className="h-3.5 w-3.5 text-muted-foreground" />;

    return (
        <Command>
            <CommandInput placeholder={searchPlaceholder} className="h-8 text-xs" />
            <CommandList>
                <CommandEmpty className="text-xs py-4 text-center">{emptyText}</CommandEmpty>
                <CommandGroup>
                    {options.map((option) => (
                        <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => onSelect(option.value)}
                            className="flex items-center gap-2 text-xs"
                        >
                            {option.icon || fallbackIcon}
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="truncate">{option.label}</span>
                                {option.subtitle && (
                                    <span className="text-[10px] text-muted-foreground truncate">
                                        {option.subtitle}
                                    </span>
                                )}
                            </div>
                            {currentValue === option.value && (
                                <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                        </CommandItem>
                    ))}
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
