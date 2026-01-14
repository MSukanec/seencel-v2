"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
    value: string;
    label: string;
    /** Optional: custom content to render in the dropdown */
    content?: React.ReactNode;
    /** Optional: custom content to render when selected in trigger */
    selectedContent?: React.ReactNode;
    /** Optional: additional search terms */
    searchTerms?: string;
}

interface ComboboxProps {
    value: string;
    onValueChange: (value: string) => void;
    options: ComboboxOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    className?: string;
    /** Size variant matching Select component */
    size?: "sm" | "default";
    /** If true, the popover will be modal (useful inside dialogs) */
    modal?: boolean;
}

/**
 * Combobox - A Select component with search/filter functionality
 * 
 * Visually identical to the standard Select component, but allows typing to filter options.
 * Use this when you have many options (e.g., users, courses) and need search capability.
 */
export function Combobox({
    value,
    onValueChange,
    options,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    emptyMessage = "No se encontraron resultados.",
    disabled = false,
    className,
    size = "default",
    modal = true // Default to true as often used in modals which trap focus
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen} modal={modal}>
            <PopoverTrigger asChild disabled={disabled}>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        // Exact same styles as SelectTrigger
                        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
                        size === "default" && "h-9",
                        size === "sm" && "h-8",
                        className
                    )}
                >
                    <span className="flex items-center gap-2 truncate">
                        {selectedOption ? (
                            selectedOption.selectedContent || selectedOption.content || selectedOption.label
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </span>
                    <ChevronDown className="size-4 opacity-50 shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[--radix-popover-trigger-width]"
                align="start"
                sideOffset={4}
            >
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        className="border-none focus:ring-0 shadow-none h-9"
                    />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label} // Filtering by label as before. Consider changing to option.value + label if needed.
                                    onSelect={() => {
                                        onValueChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer" // Force cursor-pointer
                                    )}
                                >
                                    {option.content || option.label}
                                    <span className="absolute right-2 flex size-3.5 items-center justify-center">
                                        <Check
                                            className={cn(
                                                "size-4",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
