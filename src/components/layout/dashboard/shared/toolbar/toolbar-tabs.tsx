"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export interface ToolbarTabOption {
    value: string;
    label: string;
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
        <div className={cn("inline-flex items-center h-9 p-1 bg-muted/50 rounded-md", className)}>
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
                            "relative h-full px-3 text-sm font-medium transition-all hover:bg-transparent",
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
                        <span className="relative z-10 flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4" />}
                            {option.label}
                        </span>
                    </Button>
                );
            })}
        </div>
    );
}
