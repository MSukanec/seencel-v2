/**
 * Select Field Factory
 * Standard 19.15 - Reusable Select / Combobox Field
 *
 * A smart select field that adapts based on configuration:
 * - Simple mode: Uses shadcn Select (lightweight)
 * - Searchable mode: Uses Combobox with Command (search + filter)
 *
 * Features:
 * - Filter Tabs: Inline category tabs aligned right of label
 * - Groups: Visual option grouping with labels
 * - Custom Render: Per-option custom content
 * - Loading: Skeleton state for async data
 * - Clearable: X button to reset selection
 * - Empty State: Mini empty with message + navigable link
 */

"use client";

import * as React from "react";
import { Check, ChevronDown, X, Loader2 } from "lucide-react";
import { FormGroup } from "@/components/ui/form-group";
import { FactoryLabel } from "./field-wrapper";
import {
    Select,
    SelectContent,
    SelectGroup as ShadcnSelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface SelectOption {
    /** Unique value for the option */
    value: string;
    /** Display label */
    label: string;
    /** Group key — must match a SelectGroup.key if using groups */
    group?: string;
    /** Additional search terms for searchable mode */
    searchTerms?: string;
    /** Whether this option is disabled */
    disabled?: boolean;
}

export interface SelectGroup {
    /** Unique key for the group */
    key: string;
    /** Display label for the group header */
    label: string;
}

export interface FilterTab {
    /** Unique key for the tab */
    key: string;
    /** Display label */
    label: string;
}

export interface SelectEmptyState {
    /** Message to display when no options are available */
    message: string;
    /** Link text (rendered in primary color) */
    linkText?: string;
    /** Link href (uses i18n routing) — for static navigation outside modals */
    linkHref?: string;
    /** Click handler for the link — use this inside modals to close + navigate */
    onLinkClick?: () => void;
}

export interface SelectFieldProps {
    /** Current selected value */
    value: string;
    /** Callback when value changes */
    onChange: (value: string) => void;
    /** Available options */
    options: SelectOption[];
    /** Field label */
    label: string;
    /** Placeholder text */
    placeholder?: string;
    /** Is field required? */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for the wrapper */
    className?: string;
    /** Error message */
    error?: string;
    /** Help text below the field */
    helpText?: string;

    // ── Smart Features ──────────────────────────────────────────────────

    /** Enable search/filter within options (uses Combobox instead of Select) */
    searchable?: boolean;
    /** Search input placeholder (only when searchable) */
    searchPlaceholder?: string;

    /** Option groups — options are grouped by their `group` key */
    groups?: SelectGroup[];

    /** Custom render for each option in the dropdown */
    renderOption?: (option: SelectOption) => React.ReactNode;

    /** Show loading skeleton instead of the select */
    loading?: boolean;

    /** Allow clearing the selection (shows X button) */
    clearable?: boolean;

    /** Filter tabs shown inline next to the label */
    filterTabs?: FilterTab[];
    /** Currently active filter tab key */
    activeFilterTab?: string;
    /** Callback when a filter tab is clicked */
    onFilterTabChange?: (key: string) => void;

    /** Empty state shown when options array is empty */
    emptyState?: SelectEmptyState;
}

// ============================================================================
// Component
// ============================================================================

export function SelectField({
    value,
    onChange,
    options,
    label,
    placeholder = "Seleccionar...",
    required = false,
    disabled = false,
    className,
    error,
    helpText,
    searchable = false,
    searchPlaceholder = "Buscar...",
    groups,
    renderOption,
    loading = false,
    clearable = false,
    filterTabs,
    activeFilterTab,
    onFilterTabChange,
    emptyState,
}: SelectFieldProps) {

    // Build the label with optional filter tabs aligned right
    const labelContent = (
        <div className="flex items-center justify-between w-full">
            <FactoryLabel label={label} />
            {filterTabs && filterTabs.length > 0 && onFilterTabChange && (
                <div className="flex items-center gap-1">
                    {filterTabs.map((tab) => {
                        const isActive = activeFilterTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => onFilterTabChange(tab.key)}
                                className={cn(
                                    "h-6 px-2 text-xs font-medium rounded-sm border transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background/50 text-muted-foreground border-dashed border-input hover:bg-background/80 hover:text-foreground"
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // Loading state
    if (loading) {
        return (
            <FormGroup
                label={labelContent}
                required={required}
                className={className}
                error={error}
                helpText={helpText}
            >
                <Skeleton className="h-9 w-full rounded-md" />
            </FormGroup>
        );
    }

    // Empty state — no options available
    if (options.length === 0 && emptyState) {
        return (
            <FormGroup
                label={labelContent}
                required={required}
                className={className}
                error={error}
                helpText={helpText}
            >
                <div className="flex items-center justify-center h-9 rounded-md border border-dashed border-input gap-1 text-sm text-muted-foreground shadow-xs">
                    <span>{emptyState.message}</span>
                    {emptyState.linkText && (emptyState.onLinkClick || emptyState.linkHref) && (
                        emptyState.onLinkClick ? (
                            <button
                                type="button"
                                onClick={emptyState.onLinkClick}
                                className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
                            >
                                {emptyState.linkText}
                            </button>
                        ) : (
                            <Link
                                href={emptyState.linkHref as any}
                                className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
                            >
                                {emptyState.linkText}
                            </Link>
                        )
                    )}
                </div>
            </FormGroup>
        );
    }

    // Determine which select variant to use
    const selectContent = searchable ? (
        <SearchableSelect
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            disabled={disabled}
            groups={groups}
            renderOption={renderOption}
            clearable={clearable}
        />
    ) : (
        <SimpleSelect
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            groups={groups}
            renderOption={renderOption}
            clearable={clearable}
        />
    );

    return (
        <FormGroup
            label={labelContent}
            required={required}
            className={className}
            error={error}
            helpText={helpText}
        >
            {selectContent}
        </FormGroup>
    );
}

// ============================================================================
// Simple Select (non-searchable)
// ============================================================================

interface InternalSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder: string;
    disabled: boolean;
    groups?: SelectGroup[];
    renderOption?: (option: SelectOption) => React.ReactNode;
    clearable: boolean;
    searchPlaceholder?: string;
}

function SimpleSelect({
    value,
    onChange,
    options,
    placeholder,
    disabled,
    groups,
    renderOption,
    clearable,
}: InternalSelectProps) {
    const renderItem = (option: SelectOption) => (
        <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {renderOption ? renderOption(option) : option.label}
        </SelectItem>
    );

    return (
        <div className="relative">
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger className={cn(clearable && value && "pr-8")}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {groups && groups.length > 0 ? (
                        groups.map((group) => {
                            const groupOptions = options.filter(o => o.group === group.key);
                            if (groupOptions.length === 0) return null;
                            return (
                                <ShadcnSelectGroup key={group.key}>
                                    <SelectLabel>{group.label}</SelectLabel>
                                    {groupOptions.map(renderItem)}
                                </ShadcnSelectGroup>
                            );
                        })
                    ) : (
                        options.map(renderItem)
                    )}
                </SelectContent>
            </Select>
            {clearable && value && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange("");
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Limpiar selección"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}

// ============================================================================
// Searchable Select (Combobox)
// ============================================================================

function SearchableSelect({
    value,
    onChange,
    options,
    placeholder,
    searchPlaceholder,
    disabled,
    groups,
    renderOption,
    clearable,
}: InternalSelectProps) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find(o => o.value === value);

    const renderItems = (items: SelectOption[]) =>
        items.map((option) => (
            <CommandItem
                key={option.value}
                value={option.searchTerms ? `${option.label} ${option.searchTerms}` : option.label}
                disabled={option.disabled}
                onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                }}
            >
                {renderOption ? renderOption(option) : option.label}
                <Check
                    className={cn(
                        "ml-auto h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                    )}
                />
            </CommandItem>
        ));

    return (
        <div className="relative">
            <Popover open={open} onOpenChange={setOpen} modal>
                <PopoverTrigger asChild disabled={disabled}>
                    <button
                        type="button"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 h-9",
                            "dark:bg-input/30 dark:hover:bg-input/50",
                            clearable && value && "pr-8"
                        )}
                    >
                        <span className="truncate">
                            {selectedOption ? (
                                renderOption ? renderOption(selectedOption) : selectedOption.label
                            ) : (
                                <span className="text-muted-foreground">{placeholder}</span>
                            )}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="p-0"
                    align="start"
                    sideOffset={4}
                    style={{
                        minWidth: "var(--radix-popover-trigger-width)",
                        width: "var(--radix-popover-trigger-width)",
                    }}
                >
                    <Command className="[&_[data-slot=command-input-wrapper]]:border-none">
                        <CommandInput
                            placeholder={searchPlaceholder}
                            className="border-none focus:ring-0 focus-visible:ring-0 focus:outline-none shadow-none h-9"
                        />
                        <CommandList>
                            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                            {groups && groups.length > 0 ? (
                                groups.map((group) => {
                                    const groupOptions = options.filter(o => o.group === group.key);
                                    if (groupOptions.length === 0) return null;
                                    return (
                                        <CommandGroup key={group.key} heading={group.label}>
                                            {renderItems(groupOptions)}
                                        </CommandGroup>
                                    );
                                })
                            ) : (
                                <CommandGroup>
                                    {renderItems(options)}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {clearable && value && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange("");
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors z-10"
                    aria-label="Limpiar selección"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
