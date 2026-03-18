"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLayoutStore, useSidebarMode } from "@/stores/layout-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, PanelLeftClose, PanelLeft, Check } from "lucide-react";
import type { SidebarMode } from "@/types/preferences";

// ============================================================================
// SIDEBAR TOGGLE BUTTON — Vercel-style chevron at sidebar edge
// ============================================================================
// Appears on hover at the right edge of the sidebar area.
// Click opens a mini popover with two options:
//   - "Siempre visible" (docked)
//   - "Expandir al pasar" (expanded_hover)
// ============================================================================

interface SidebarToggleButtonProps {
    isVisible: boolean;
}

export function SidebarToggleButton({ isVisible }: SidebarToggleButtonProps) {
    const sidebarMode = useSidebarMode();
    const setSidebarMode = useLayoutStore((s) => s.actions.setSidebarMode);
    const activeContext = useLayoutStore((s) => s.activeContext);
    const [open, setOpen] = React.useState(false);

    // Don't show toggle when on Hub (sidebar nav is hidden anyway)
    if (activeContext === 'home') return null;

    const options: { value: SidebarMode; label: string; icon: React.ElementType; description: string }[] = [
        {
            value: 'docked',
            label: 'Siempre visible',
            icon: PanelLeft,
            description: 'El panel de navegación siempre está abierto',
        },
        {
            value: 'expanded_hover',
            label: 'Expandir al pasar',
            icon: PanelLeftClose,
            description: 'Se expande al pasar el mouse',
        },
    ];

    const handleSelect = (mode: SidebarMode) => {
        setSidebarMode(mode);
        setOpen(false);
    };

    return (
        <div
            className="absolute right-0 top-0 bottom-0 w-6 z-50 flex items-center justify-center translate-x-1/2"
        >
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "flex items-center justify-center w-5 h-5 rounded-full transition-all duration-150",
                            "bg-sidebar border border-border shadow-sm",
                            "hover:bg-secondary hover:border-muted-foreground/40",
                            "text-muted-foreground hover:text-foreground",
                            (isVisible || open) ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                        )}
                        onClick={() => setOpen(true)}
                    >
                        <ChevronLeft className={cn(
                            "h-3 w-3 transition-transform",
                            sidebarMode === 'expanded_hover' && "rotate-180"
                        )} />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    side="right"
                    align="center"
                    sideOffset={6}
                    className="w-[200px] p-1"
                >
                    {options.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = sidebarMode === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={cn(
                                    "flex items-center gap-2.5 w-full px-2 py-2 text-xs rounded-md transition-colors",
                                    "hover:bg-secondary",
                                    isActive && "bg-secondary"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <div className="flex flex-col items-start flex-1 min-w-0">
                                    <span className="font-medium">{opt.label}</span>
                                    <span className="text-[10px] text-muted-foreground leading-tight">{opt.description}</span>
                                </div>
                                {isActive && <Check className="h-3 w-3 text-primary shrink-0" />}
                            </button>
                        );
                    })}
                </PopoverContent>
            </Popover>
        </div>
    );
}
