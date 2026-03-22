"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const bannerVariants = cva(
    "w-full px-4 py-1.5 flex flex-wrap items-center justify-center gap-3 text-sm font-medium shadow-md transition-all duration-300 ease-in-out",
    {
        variants: {
            variant: {
                default: "bg-background text-foreground border-b",
                destructive: "bg-destructive text-destructive-foreground",
                warning: "bg-amber-500 dark:bg-amber-600 text-amber-950 border-b border-amber-600/20",
                info: "bg-slate-800 text-slate-50 border-b border-slate-900/50",
                context: "bg-blue-500 dark:bg-blue-600 text-white border-b border-blue-600/20",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface GlobalBannerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bannerVariants> {
    /** Unique ID used for saving the dismiss state in localStorage */
    id?: string;
    /** Standard Lucide icon to display on the left */
    icon?: React.ElementType;
    /** If true, shows an X button that permanently closes it */
    isDismissible?: boolean;
    /** Callback fired when dismissed manually */
    onDismiss?: () => void;
    /** Primary action button node (rendered on the right side) */
    action?: React.ReactNode;
}

/**
 * Universal Banner Primitive for Vercel/Linear-level UI architecture.
 * Ensures consistent rendering, colors, layout, and dismiss-memory.
 */
export function GlobalBanner({
    id,
    variant,
    icon: Icon,
    isDismissible,
    onDismiss,
    children,
    action,
    className,
    ...props
}: GlobalBannerProps) {
    const [isVisible, setIsVisible] = React.useState(true);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        if (id && isDismissible) {
            const dismissed = localStorage.getItem(`banner_dismissed_${id}`);
            if (dismissed === "true") {
                setIsVisible(false);
            }
        }
    }, [id, isDismissible]);

    const handleDismiss = () => {
        setIsVisible(false);
        if (id && isDismissible) {
            localStorage.setItem(`banner_dismissed_${id}`, "true");
        }
        onDismiss?.();
    };

    if (!isVisible) return null;
    if (id && isDismissible && !isMounted) return null; // Prevent hydration mismatch on SSR

    return (
        <div className={cn(bannerVariants({ variant }), className)} {...props}>
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            
            <div className="flex items-center gap-2 text-center text-xs md:text-sm">
                {children}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {action}
                {isDismissible && (
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-1 focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label="Cerrar anuncio"
                        title="Cerrar"
                    >
                        <X className="h-3.5 w-3.5 opacity-80" />
                    </button>
                )}
            </div>
        </div>
    );
}
