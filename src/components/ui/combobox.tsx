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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ComboboxOption {
    value: string;
    label: string;
    /** Optional: custom content to render in the dropdown */
    content?: React.ReactNode;
    /** Optional: custom content to render when selected in trigger */
    selectedContent?: React.ReactNode;
    /** Optional: additional search terms */
    searchTerms?: string;
    /** Optional: image URL for avatar */
    image?: string | null;
    /** Optional: fallback text for avatar */
    fallback?: string;
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
    /** Name attribute for hidden input (for FormData) */
    name?: string;
}


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
    modal = true,
    name,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((opt) => opt.value === value);

    const renderContent = (option: ComboboxOption) => {
        if (option.content) return option.content;

        if (option.image || option.fallback) {
            return (
                <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 border border-border/50">
                        {option.image && (
                            <AvatarImage src={option.image} alt={option.label} className="object-cover" />
                        )}
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                            {option.fallback || option.label.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span>{option.label}</span>
                </div>
            );
        }

        return option.label;
    };

    return (
        <>
            {/* Hidden input for FormData compatibility */}
            {name && <input type="hidden" name={name} value={value} />}
            <Popover open={open} onOpenChange={setOpen} modal={modal}>
                <PopoverTrigger asChild disabled={disabled}>
                    <button
                        type="button"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50",
                            size === "default" && "h-9",
                            size === "sm" && "h-8",
                            className
                        )}
                    >
                        <span className="flex items-center gap-2 truncate">
                            {selectedOption ? (
                                selectedOption.selectedContent || renderContent(selectedOption)
                            ) : (
                                <span className="text-muted-foreground">{placeholder}</span>
                            )}
                        </span>
                        <ChevronDown className="size-4 opacity-50 shrink-0" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="p-0"
                    align="start"
                    sideOffset={4}
                    style={{ minWidth: 'var(--radix-popover-trigger-width)', width: 'var(--radix-popover-trigger-width)' }}
                >
                    <Command className="[&_[data-slot=command-input-wrapper]]:border-none">
                        <CommandInput
                            placeholder={searchPlaceholder}
                            className="border-none focus:ring-0 !focus:ring-0 focus:outline-none !focus:outline-none focus:ring-offset-0 !focus:ring-offset-0 focus-visible:ring-0 !focus-visible:ring-0 focus-visible:ring-offset-0 !focus-visible:ring-offset-0 shadow-none !shadow-none h-9"
                        />
                        <CommandList>
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label} // Command uses this for filtering
                                        onSelect={() => {
                                            onValueChange(option.value);
                                            setOpen(false);
                                        }}
                                    >
                                        {renderContent(option)}
                                        <Check
                                            className={cn(
                                                "ml-auto size-4",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    );
}

