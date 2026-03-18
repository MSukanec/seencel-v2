"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Page Header Button ─────────────────────────────
// Generic circular icon button for the header bar.
// Agnostic — use for any action (more, docs, settings, etc).
// Wraps shadcn Button with consistent header styling.

interface PageHeaderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    /** Whether the button is currently "active" (e.g. popover open) */
    active?: boolean;
}

export const PageHeaderButton = React.forwardRef<HTMLButtonElement, PageHeaderButtonProps>(
    ({ children, active, className, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                variant="ghost"
                size="icon"
                className={cn(
                    "h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10",
                    active && "text-foreground bg-white/10",
                    className,
                )}
                {...props}
            >
                {children}
            </Button>
        );
    }
);

PageHeaderButton.displayName = "PageHeaderButton";
