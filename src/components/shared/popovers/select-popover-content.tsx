/**
 * SelectPopoverContent — Shared Command content for generic selection
 *
 * Used by: select-chip (forms), entity-column (tables)
 * Single source of truth for searchable list selectors (concepts, categories, etc.)
 * Includes optional footer action to navigate to management page.
 *
 * Supports inline creation (Linear-style):
 *   When `onCreateNew` is provided, typing a name that doesn't exist shows
 *   "+ Crear: 'xyz'" at the bottom. Clicking it calls onCreateNew(name),
 *   which should create the entity and return its new ID for auto-selection.
 */

"use client";

import * as React from "react";
import { Check, Tag, Settings, Plus, Loader2 } from "lucide-react";
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
    /**
     * Inline creation callback (Linear-style).
     * When provided, shows "+ Crear: 'searchQuery'" when the query doesn't
     * exactly match an existing option.
     * Should create the entity and return the new ID for auto-selection.
     * Return undefined/void if auto-selection is not needed.
     */
    onCreateNew?: (name: string) => Promise<string | undefined | void>;
    /** Label prefix for the create action (default: "Crear") */
    createLabel?: string;
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
    onCreateNew,
    createLabel = "Crear",
}: SelectPopoverContentProps) {
    const router = useRouter();
    const fallbackIcon = defaultIcon || <Tag className="h-3.5 w-3.5 text-muted-foreground" />;
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isCreating, setIsCreating] = React.useState(false);

    // Show "create new" when: onCreateNew exists, search has text, no exact label match
    const showCreateNew = React.useMemo(() => {
        if (!onCreateNew || !searchQuery.trim()) return false;
        const q = searchQuery.trim().toLowerCase();
        return !options.some(o => o.label.toLowerCase() === q);
    }, [onCreateNew, searchQuery, options]);

    const handleCreateNew = async () => {
        if (!onCreateNew || !searchQuery.trim() || isCreating) return;
        setIsCreating(true);
        try {
            const newId = await onCreateNew(searchQuery.trim());
            if (newId) {
                onSelect(newId);
            }
            onOpenChange?.(false);
        } finally {
            setIsCreating(false);
            setSearchQuery("");
        }
    };

    return (
        <Command>
            <CommandInput
                placeholder={searchPlaceholder}
                className="h-8 text-xs"
                value={searchQuery}
                onValueChange={setSearchQuery}
            />
            <CommandList>
                <CommandEmpty className="text-xs py-4 text-center">
                    {showCreateNew ? null : emptyText}
                </CommandEmpty>
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
                {/* Inline creation — Linear-style */}
                {showCreateNew && (
                    <>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                value={`__create_new_${searchQuery.trim()}__`}
                                onSelect={handleCreateNew}
                                disabled={isCreating}
                                className="flex items-center gap-2 text-xs cursor-pointer"
                            >
                                {isCreating ? (
                                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                                ) : (
                                    <Plus className="h-3.5 w-3.5 text-primary" />
                                )}
                                <span className="text-primary font-medium">{createLabel}:</span>
                                <span className="text-foreground truncate">"{searchQuery.trim()}"</span>
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}
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
