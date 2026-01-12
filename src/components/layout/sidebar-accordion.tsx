"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarAccordionProps {
    icon: LucideIcon;
    label: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    isSidebarExpanded: boolean;
    isActive?: boolean;
    tooltipDisabled?: boolean;
}

export function SidebarAccordion({
    icon: Icon,
    label,
    children,
    isOpen,
    onToggle,
    isSidebarExpanded,
    isActive = false,
    tooltipDisabled = false
}: SidebarAccordionProps) {
    const [isHovered, setIsHovered] = React.useState(false);

    // If sidebar is strictly collapsed (not hover-expanded), we treat this like a button
    // attempting to open it should probably expand the sidebar or just show a tooltip.
    // However, per requirements: "Collapsed Mode: Shows only the icon."

    // When sidebar is collapsed, clicking the accordion icon should probably trigger the context change
    // but we can't show children.

    // Let's decide: If sidebar is collapsed, this renders as a SidebarButton equivalent.

    // If sidebar is collapsed, we still render the structure, but children will be icon-only.
    const isCollapsed = !isSidebarExpanded;

    return (
        <div className={cn("flex flex-col gap-1 w-full", isCollapsed && "items-center")}>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex items-center justify-start h-8 rounded-lg text-sm transition-all duration-200 group relative w-full p-0",
                                isActive
                                    ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            )}
                            onClick={onToggle}
                        >
                            {/* Icon Container: Fixed 32x32 to match user spec & prevent shifting */}
                            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                <Icon className="h-5 w-5" /> {/* 20px icon as requested */}
                            </div>

                            {/* Text & Chevron: Flexible area, animate width/opacity */}
                            <div
                                className={cn(
                                    "flex items-center justify-between overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
                                    !isCollapsed ? "w-auto opacity-100 flex-1 pr-3" : "w-0 opacity-0 pr-0"
                                )}
                            >
                                <span className="truncate font-medium">{label}</span>
                                <ChevronRight
                                    className={cn(
                                        "h-4 w-4 shrink-0 transition-transform duration-200 opacity-50 group-hover:opacity-100",
                                        isOpen && "transform rotate-90"
                                    )}
                                />
                            </div>


                        </Button>
                    </TooltipTrigger>
                    {/* Show tooltip ONLY if collapsed AND enabled */}
                    {isCollapsed && !tooltipDisabled && (
                        <TooltipContent side="right" sideOffset={10}>
                            {label}
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>

            {isOpen && (
                <div
                    className={cn(
                        "flex flex-col gap-1 animate-in slide-in-from-top-1 duration-200 fade-in",
                        isCollapsed ? "items-center w-full" : "pl-4 border-l ml-3.5 border-border/50"
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
