"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: React.ReactNode;
    className?: string;
    showSpinner?: boolean; // Show spinner on click
    disabled?: boolean;
}

/**
 * A link component that shows immediate visual feedback on click.
 * Prevents double-clicks by disabling itself while navigating.
 */
export function LoadingLink({
    href,
    children,
    className,
    showSpinner = true,
    disabled = false,
    onClick,
    ...props
}: LoadingLinkProps) {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = React.useState(false);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (disabled || isNavigating) {
            e.preventDefault();
            return;
        }

        // Custom onClick handler
        onClick?.(e);

        // If default wasn't prevented, handle navigation
        if (!e.defaultPrevented) {
            e.preventDefault();
            setIsNavigating(true);

            // Navigate after a tiny delay for visual feedback
            router.push(href);

            // Reset after navigation (in case user navigates back)
            setTimeout(() => setIsNavigating(false), 3000);
        }
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            className={cn(
                "transition-opacity",
                (disabled || isNavigating) && "pointer-events-none opacity-70",
                className
            )}
            aria-disabled={disabled || isNavigating}
            {...props}
        >
            {isNavigating && showSpinner ? (
                <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {children}
                </span>
            ) : (
                children
            )}
        </a>
    );
}
