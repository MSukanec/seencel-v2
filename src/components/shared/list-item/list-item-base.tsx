"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type ListItemVariant = "card" | "flat";

interface ListItemContextValue {
    variant: ListItemVariant;
}

const ListItemContext = React.createContext<ListItemContextValue>({
    variant: "card",
});

// ============================================================================
// Root Component
// ============================================================================

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Visual variant: "card" (bordered) or "flat" (minimal) */
    variant?: ListItemVariant;
    /** Whether the item is selected */
    selected?: boolean;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Make the entire item clickable */
    onClick?: () => void;
}

const ListItemRoot = React.forwardRef<HTMLDivElement, ListItemProps>(
    ({ className, variant = "card", selected, disabled, onClick, children, ...props }, ref) => {
        const isClickable = !!onClick && !disabled;

        return (
            <ListItemContext.Provider value={{ variant }}>
                <div
                    ref={ref}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onClick={disabled ? undefined : onClick}
                    onKeyDown={isClickable ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onClick?.();
                        }
                    } : undefined}
                    className={cn(
                        // Base styles
                        "flex items-center gap-3 transition-colors group",
                        // Variant styles
                        variant === "card" && [
                            "p-3 rounded-lg border bg-sidebar",
                            !disabled && "hover:bg-muted/50",
                        ],
                        variant === "flat" && [
                            "py-2 px-1",
                            !disabled && "hover:bg-muted/30 rounded-md",
                        ],
                        // States - Selected uses primary border, remove default border
                        selected && "border-primary border-2",
                        disabled && "opacity-50 cursor-not-allowed",
                        isClickable && "cursor-pointer",
                        className
                    )}
                    {...props}
                >
                    {children}
                </div>
            </ListItemContext.Provider>
        );
    }
);
ListItemRoot.displayName = "ListItem";

// ============================================================================
// Checkbox Slot (for multi-select)
// ============================================================================

interface ListItemCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

const ListItemCheckbox = ({ checked, onChange, className }: ListItemCheckboxProps) => {
    return (
        <div
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onClick={(e) => {
                e.stopPropagation();
                onChange(!checked);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(!checked);
                }
            }}
            className={cn(
                "shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                checked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/40 hover:border-primary/60",
                className
            )}
        >
            {checked && (
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path
                        d="M2 6L5 9L10 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </div>
    );
};
ListItemCheckbox.displayName = "ListItem.Checkbox";

// ============================================================================
// Leading Slot (icon, avatar, color strip)
// ============================================================================

interface ListItemLeadingProps extends React.HTMLAttributes<HTMLDivElement> { }

const ListItemLeading = React.forwardRef<HTMLDivElement, ListItemLeadingProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("shrink-0 flex items-center justify-center", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);
ListItemLeading.displayName = "ListItem.Leading";

// ============================================================================
// Content Slot (title, description, badges)
// ============================================================================

interface ListItemContentProps extends React.HTMLAttributes<HTMLDivElement> { }

const ListItemContent = React.forwardRef<HTMLDivElement, ListItemContentProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("flex-1 min-w-0 space-y-1", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);
ListItemContent.displayName = "ListItem.Content";

// ============================================================================
// Title
// ============================================================================

interface ListItemTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    /** Text shown after the title (e.g., unit) */
    suffix?: string;
}

const ListItemTitle = React.forwardRef<HTMLHeadingElement, ListItemTitleProps>(
    ({ className, suffix, children, ...props }, ref) => {
        return (
            <h3
                ref={ref}
                className={cn("font-medium text-sm leading-tight truncate", className)}
                {...props}
            >
                {children}
                {suffix && (
                    <span className="text-muted-foreground font-normal ml-1">
                        {suffix}
                    </span>
                )}
            </h3>
        );
    }
);
ListItemTitle.displayName = "ListItem.Title";

// ============================================================================
// Description
// ============================================================================

interface ListItemDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

const ListItemDescription = React.forwardRef<HTMLParagraphElement, ListItemDescriptionProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <p
                ref={ref}
                className={cn("text-xs text-muted-foreground truncate", className)}
                {...props}
            >
                {children}
            </p>
        );
    }
);
ListItemDescription.displayName = "ListItem.Description";

// ============================================================================
// Badges Container
// ============================================================================

interface ListItemBadgesProps extends React.HTMLAttributes<HTMLDivElement> { }

const ListItemBadges = React.forwardRef<HTMLDivElement, ListItemBadgesProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("flex flex-wrap gap-1.5", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);
ListItemBadges.displayName = "ListItem.Badges";

// ============================================================================
// Trailing Slot (value, metadata)
// ============================================================================

interface ListItemTrailingProps extends React.HTMLAttributes<HTMLDivElement> { }

const ListItemTrailing = React.forwardRef<HTMLDivElement, ListItemTrailingProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("shrink-0 text-right", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);
ListItemTrailing.displayName = "ListItem.Trailing";

// ============================================================================
// Value (price, quantity)
// ============================================================================

interface ListItemValueProps extends React.HTMLAttributes<HTMLParagraphElement> { }

const ListItemValue = React.forwardRef<HTMLParagraphElement, ListItemValueProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <p
                ref={ref}
                className={cn("font-mono font-semibold text-sm", className)}
                {...props}
            >
                {children}
            </p>
        );
    }
);
ListItemValue.displayName = "ListItem.Value";

// ============================================================================
// Value Subtext (unit description)
// ============================================================================

interface ListItemValueSubtextProps extends React.HTMLAttributes<HTMLParagraphElement> { }

const ListItemValueSubtext = React.forwardRef<HTMLParagraphElement, ListItemValueSubtextProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <p
                ref={ref}
                className={cn("text-xs text-muted-foreground", className)}
                {...props}
            >
                {children}
            </p>
        );
    }
);
ListItemValueSubtext.displayName = "ListItem.ValueSubtext";

// ============================================================================
// Actions Slot
// ============================================================================

interface ListItemActionsProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Show only on hover (default: true) */
    showOnHover?: boolean;
}

const ListItemActions = React.forwardRef<HTMLDivElement, ListItemActionsProps>(
    ({ className, showOnHover = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "shrink-0 flex items-center gap-1",
                    showOnHover && "opacity-0 group-hover:opacity-100 transition-opacity",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
ListItemActions.displayName = "ListItem.Actions";

// ============================================================================
// Color Strip (vertical indicator bar)
// ============================================================================

interface ListItemColorStripProps extends React.HTMLAttributes<HTMLDivElement> {
    color?: "slate" | "indigo" | "green" | "amber" | "red" | "blue" | "system";
}

const colorClasses = {
    slate: "bg-slate-500",
    indigo: "bg-indigo-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    system: "bg-system", // Uses CSS variable --system
};

const ListItemColorStrip = React.forwardRef<HTMLDivElement, ListItemColorStripProps>(
    ({ className, color = "slate", ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "w-1.5 self-stretch rounded-full shrink-0",
                    colorClasses[color],
                    className
                )}
                {...props}
            />
        );
    }
);
ListItemColorStrip.displayName = "ListItem.ColorStrip";

// ============================================================================
// Compound Export
// ============================================================================

export const ListItem = Object.assign(ListItemRoot, {
    Checkbox: ListItemCheckbox,
    Leading: ListItemLeading,
    Content: ListItemContent,
    Title: ListItemTitle,
    Description: ListItemDescription,
    Badges: ListItemBadges,
    Trailing: ListItemTrailing,
    Value: ListItemValue,
    ValueSubtext: ListItemValueSubtext,
    Actions: ListItemActions,
    ColorStrip: ListItemColorStrip,
});

// Export types for consumers
export type { ListItemProps, ListItemVariant };
