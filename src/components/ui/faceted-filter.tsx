"use client"

import * as React from "react"
import { Check, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export interface FacetedFilterOption {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
}

interface FacetedFilterProps {
    title?: string
    options: FacetedFilterOption[]
    selectedValues: Set<string>
    onSelect: (value: string) => void
    onClear?: () => void
    facets?: Map<string, number>
    className?: string
}

export function FacetedFilter({
    title,
    options,
    selectedValues,
    onSelect,
    onClear,
    facets,
    className,
}: FacetedFilterProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9 border-dashed data-[state=open]:bg-accent data-[state=open]:text-accent-foreground transition-all duration-200 hover:border-primary/50 hover:bg-accent/50",
                        className
                    )}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {title}
                    {selectedValues?.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden bg-primary/10 text-primary hover:bg-primary/20"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal bg-primary/10 text-primary hover:bg-primary/20"
                                    >
                                        {selectedValues.size} seleccionados
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selectedValues.has(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelect(option.value);
                                                }}
                                            >
                                                {option.label}
                                                <span className="ml-1 text-xs opacity-50 group-hover:opacity-100">
                                                    ×
                                                </span>
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-popover/95 backdrop-blur-xl border-primary/20 shadow-xl" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(option.value)
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => onSelect(option.value)}
                                        className="cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary transition-colors duration-200"
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary/30 transition-all duration-200",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className={cn("h-3 w-3 transition-transform duration-200", isSelected ? "scale-100" : "scale-0")} />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                        {facets?.get(option.value) && (
                                            <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs text-muted-foreground/70">
                                                {facets.get(option.value)}
                                            </span>
                                        )}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator className="bg-border/50" />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={onClear}
                                        className="justify-center text-center cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                                    >
                                        Limpiar filtros
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
