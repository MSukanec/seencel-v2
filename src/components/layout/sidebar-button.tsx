"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarButtonProps extends React.ComponentProps<typeof Button> {
    icon: React.ElementType;
    label: string;
    isActive?: boolean;
    isExpanded?: boolean;
    tooltip?: string;
    tooltipSide?: "left" | "right" | "top" | "bottom";
    href?: string;
    showTooltipWhenExpanded?: boolean;
    activeVariant?: "primary" | "secondary";
}

export function SidebarButton({
    icon: Icon,
    label,
    isActive = false,
    isExpanded = false,
    tooltip,
    tooltipSide = "right",
    href,
    activeVariant = "secondary",
    className,
    variant = "ghost",
    size = "default",
    showTooltipWhenExpanded = false,
    ...props
}: SidebarButtonProps) {
    // Logic for tooltip: show if provided AND (not expanded OR explicitly forced)
    const shouldShowTooltip = tooltip && (!isExpanded || showTooltipWhenExpanded);

    const activeClasses = activeVariant === "primary"
        ? "bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
        : "bg-secondary text-foreground shadow-sm hover:bg-secondary/80";

    const buttonContent = (
        <Button
            variant={variant}
            size={size}
            className={cn(
                "relative transition-all duration-200 flex items-center justify-start w-full p-0", // base layout
                isActive && activeClasses,
                !isActive && cn(
                    "text-muted-foreground",
                    activeVariant === "primary"
                        ? "hover:bg-primary/10 hover:text-primary"
                        : "hover:bg-secondary hover:text-foreground"
                ),
                className
            )}
            asChild={!!href}
            {...props}
        >
            {href ? (
                <Link href={href as any} className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" /> {/* 20px */}
                    </div>
                    {/* Label */}
                    <span className={cn(
                        "font-medium text-sm truncate transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                        isExpanded ? "w-auto opacity-100 ml-0 flex-1" : "w-0 opacity-0 ml-0"
                    )}>
                        {label}
                    </span>
                </Link>
            ) : (
                <>
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn(
                        "font-medium text-sm truncate transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                        isExpanded ? "w-auto opacity-100 ml-0 flex-1" : "w-0 opacity-0 ml-0"
                    )}>
                        {label}
                    </span>
                </>
            )}
        </Button>
    );

    if (shouldShowTooltip) {
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                    <TooltipContent side={tooltipSide} sideOffset={8}>
                        {tooltip || label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return buttonContent;
}
