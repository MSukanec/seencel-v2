"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// ============================================================================
// CARD BASE — Foundation for ALL card types in Seencel
// ============================================================================
// This is the single source of truth for card visual styling.
// All card presets (MetricCard, ChartCard, ListCard, InfoCard) compose this.
// If you change the look here, ALL cards change everywhere.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardBaseProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    /** Additional classes for the outer Card */
    className?: string;
    /** If true, card won't stretch to fill grid height */
    compact?: boolean;
}

interface CardHeaderProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    iconClassName?: string;
    /** Custom content in the header right side */
    action?: React.ReactNode;
}

interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
    /** Remove default padding */
    noPadding?: boolean;
}

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

// ---------------------------------------------------------------------------
// CardBase — The shell
// ---------------------------------------------------------------------------

export function CardBase({ children, className, compact = false, ...props }: CardBaseProps) {
    return (
        <Card
            className={cn(
                "flex flex-col min-w-0 overflow-hidden",
                "bg-card/50 backdrop-blur-sm border-border/50",
                "transition-all hover:bg-card/80 hover:shadow-md",
                !compact && "h-full",
                className
            )}
            {...props}
        >
            {children}
        </Card>
    );
}

// ---------------------------------------------------------------------------
// CardBase.Header — Icon + Title + Description + Action
// ---------------------------------------------------------------------------

function Header({ title, description, icon, iconClassName, action }: CardHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2.5 min-w-0">
                {icon && (
                    <div className={cn("shrink-0 p-2 rounded-lg bg-primary/10 text-primary", iconClassName)}>
                        {icon}
                    </div>
                )}
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-none truncate">{title}</h3>
                    {description && (
                        <p className="text-xs text-muted-foreground truncate pt-0.5">{description}</p>
                    )}
                </div>
            </div>
            {action && (
                <div className="flex items-center gap-1 shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// CardBase.Body — Main content area (flex-1, expands to fill)
// ---------------------------------------------------------------------------

function Body({ children, className, noPadding = false }: CardBodyProps) {
    return (
        <div className={cn(
            "flex-1 min-h-0",
            !noPadding && "px-4 py-3",
            className
        )}>
            {children}
        </div>
    );
}

// ---------------------------------------------------------------------------
// CardBase.Footer — Optional bottom section
// ---------------------------------------------------------------------------

function Footer({ children, className }: CardFooterProps) {
    return (
        <div className={cn("px-4 py-2.5 border-t border-border/50 bg-muted/20", className)}>
            {children}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Attach sub-components
// ---------------------------------------------------------------------------

CardBase.Header = Header;
CardBase.Body = Body;
CardBase.Footer = Footer;
