"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// HEADER ICON BUTTON — Unified circular button for the header bar
// ============================================================================
// Used for: Planificador, Equipo, Notificaciones, Avatar
// Provides consistent size, shape, and hover behavior.
// Children are rendered centered inside the circle.
// ============================================================================

interface HeaderIconButtonProps {
    children: React.ReactNode;
    /** Optional click handler (if not wrapped in a Link) */
    onClick?: () => void;
    /** Tooltip / accessible label */
    title?: string;
    /** Additional class names */
    className?: string;
    /** Whether the button is currently "active" (e.g. popover open) */
    active?: boolean;
    /** Render as a different element (for Link wrapping) */
    asChild?: boolean;
}

export const HeaderIconButton = React.forwardRef<HTMLButtonElement, HeaderIconButtonProps>(
    ({ children, onClick, title, className, active, ...props }, ref) => {
        return (
            <button
                ref={ref}
                onClick={onClick}
                title={title}
                className={cn(
                    // Base: fixed size circle
                    "h-8 w-8 rounded-full",
                    // Layout: center content
                    "flex items-center justify-center",
                    // Colors & interaction
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-white/10 transition-colors",
                    // Focus
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    // Active state (popover open, etc.)
                    active && "text-foreground bg-white/10",
                    className,
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);

HeaderIconButton.displayName = "HeaderIconButton";
