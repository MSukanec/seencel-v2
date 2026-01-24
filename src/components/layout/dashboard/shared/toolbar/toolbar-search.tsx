"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ToolbarSearchProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function ToolbarSearch({
    value = "",
    onChange,
    placeholder = "Buscar...",
    className,
}: ToolbarSearchProps) {
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Determines if the search is "active" (has value or is focused)
    const isExpanded = isFocused || value.length > 0;

    const handleClear = () => {
        onChange?.("");
        inputRef.current?.focus();
    };

    return (
        <div
            className={cn(
                "relative transition-all duration-300 ease-in-out group",
                // Base width matches somewhat a badge/button (~150px)
                // Expanded width takes more space (~320px)
                // EXPAND ON HOVER or FOCUS/ACTIVE
                isExpanded
                    ? "w-full sm:w-64 lg:w-80 shadow-sm"
                    : "w-40 sm:w-56 lg:w-64 hover:w-full sm:hover:w-64 lg:hover:w-80", // Increased base width from 150px to show placeholder
                className
            )}
        >
            <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                isFocused ? "text-primary" : "text-muted-foreground"
            )} />
            <Input
                ref={inputRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                    "pl-9 pr-9 h-9 transition-all duration-200",
                    "bg-background/50 hover:bg-background/80 focus:bg-background",
                    "border-dashed focus:border-solid",
                    !isExpanded && "cursor-pointer", // Hint that it's clickable
                    isFocused && "ring-2 ring-primary/20 border-primary"
                )}
            />
            {value.length > 0 && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handleClear}
                >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Limpiar</span>
                </Button>
            )}
        </div>
    );
}
