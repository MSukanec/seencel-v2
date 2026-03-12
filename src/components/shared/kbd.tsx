/**
 * Kbd — Keyboard shortcut badge
 *
 * Renders a styled keyboard shortcut pill, similar to Linear/Raycast.
 * Supports single keys ("Esc") or key combos (["⌘", "↵"]).
 *
 * Usage:
 *   <Kbd keys="Esc" />
 *   <Kbd keys={["⌘", "↵"]} />
 *   <Kbd keys={["⌘", "K"]} onClick={handleClick} />
 */

"use client";

import { cn } from "@/lib/utils";

export interface KbdProps {
    /** Single key or array of keys to display */
    keys: string | string[];
    /** Click handler (makes it interactive) */
    onClick?: () => void;
    /** Additional className */
    className?: string;
    /** Size variant */
    size?: "sm" | "md";
}

export function Kbd({ keys, onClick, className, size = "sm" }: KbdProps) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const isInteractive = !!onClick;

    const Component = isInteractive ? "button" : "kbd";

    return (
        <Component
            {...(isInteractive ? { onClick, type: "button" as const } : {})}
            className={cn(
                "inline-flex items-center gap-0.5 rounded-md font-medium select-none",
                // Gradient background — subtle 3D feel like reference
                "border border-white/[0.08]",
                "bg-gradient-to-b from-white/[0.08] to-white/[0.03]",
                "text-muted-foreground",
                // Hover when interactive
                isInteractive && "cursor-pointer hover:from-white/[0.12] hover:to-white/[0.06] hover:text-foreground transition-all",
                // Size
                size === "sm" && "px-1.5 py-0.5 text-[10px] gap-0.5",
                size === "md" && "px-2 py-1 text-[11px] gap-1",
                className
            )}
        >
            {keyArray.map((key, i) => (
                <span key={i} className="leading-none">
                    {key}
                </span>
            ))}
        </Component>
    );
}
