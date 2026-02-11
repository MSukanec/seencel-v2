"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

/**
 * Opción para ToolbarTabs
 * IMPORTANTE: label es OBLIGATORIO - siempre debe tener texto visible
 */
export interface ToolbarTabOption {
    value: string;
    /** Texto visible - SIEMPRE requerido */
    label: string;
    /** Ícono opcional que se muestra a la izquierda del label */
    icon?: React.ComponentType<{ className?: string }>;
}

interface ToolbarTabsProps {
    value: string;
    onValueChange: (value: string) => void;
    options: ToolbarTabOption[];
    className?: string;
}

export function ToolbarTabs({ value, onValueChange, options, className }: ToolbarTabsProps) {
    return (
        <div className={cn("inline-flex items-center h-9 p-1 bg-background/50 rounded-md border border-dashed border-input", className)}>
            {options.map((option) => {
                const isSelected = value === option.value;
                const Icon = option.icon;

                return (
                    <Button
                        key={option.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => onValueChange(option.value)}
                        className={cn(
                            "relative h-full px-2.5 text-xs font-medium transition-all hover:bg-transparent flex-1",
                            isSelected
                                ? "text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isSelected && (
                            <motion.div
                                layoutId="toolbar-tab-active"
                                className="absolute inset-0 rounded-sm bg-primary"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            {Icon && <Icon className="h-3.5 w-3.5" />}
                            {option.label}
                        </span>
                    </Button>
                );
            })}
        </div>
    );
}
