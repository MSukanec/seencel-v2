"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
    const [isHovered, setIsHovered] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Expanded when hovered, focused, or has value
    const isExpanded = isFocused || isHovered || value.length > 0;

    const handleClear = () => {
        onChange?.("");
        inputRef.current?.focus();
    };

    const handleIconClick = () => {
        inputRef.current?.focus();
    };

    return (
        <motion.div
            className={cn("relative", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
                width: isExpanded ? 256 : 36, // 256px = w-64, 36px = square icon
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
            }}
        >
            <Search
                className={cn(
                    "absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 z-10",
                    isFocused ? "text-primary" : "text-muted-foreground",
                    !isExpanded && "cursor-pointer"
                )}
                onClick={!isExpanded ? handleIconClick : undefined}
            />

            <Input
                ref={inputRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                    "h-9 transition-all duration-200",
                    "bg-background/50 hover:bg-background/80 focus:bg-background",
                    "border-dashed focus:border-solid",
                    isExpanded
                        ? "pl-9 pr-9"
                        : "pl-9 pr-0 cursor-pointer w-9 text-transparent placeholder:text-transparent",
                    isFocused && "ring-2 ring-primary/20 border-primary"
                )}
                tabIndex={isExpanded ? 0 : -1}
            />

            <AnimatePresence>
                {value.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={handleClear}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Limpiar</span>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
