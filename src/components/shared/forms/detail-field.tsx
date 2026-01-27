"use client";

import { cn } from "@/lib/utils";

interface DetailFieldProps {
    /**
     * Field label
     */
    label: string;
    /**
     * Field value (can be string, number, or React node)
     */
    value: React.ReactNode;
    /**
     * Additional className for the container
     */
    className?: string;
    /**
     * Whether to display the field inline (horizontal) or stacked (vertical)
     */
    inline?: boolean;
}

/**
 * Helper component to display a labeled value in read-only view modals
 * Provides consistent styling for all detail/view displays
 */
export function DetailField({
    label,
    value,
    className,
    inline = false
}: DetailFieldProps) {
    if (inline) {
        return (
            <div className={cn("flex items-center justify-between py-2", className)}>
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium">{value || "-"}</span>
            </div>
        );
    }

    return (
        <div className={cn("space-y-1", className)}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
            </p>
            <p className="text-sm font-medium text-foreground">
                {value || "-"}
            </p>
        </div>
    );
}

interface DetailSectionProps {
    /**
     * Section title
     */
    title?: string;
    /**
     * Section content
     */
    children: React.ReactNode;
    /**
     * Additional className
     */
    className?: string;
}

/**
 * Groups related DetailFields together with an optional title
 */
export function DetailSection({ title, children, className }: DetailSectionProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {title && (
                <h4 className="text-sm font-semibold text-foreground border-b pb-2">
                    {title}
                </h4>
            )}
            {children}
        </div>
    );
}

interface DetailGridProps {
    /**
     * Number of columns (1, 2, or 3)
     */
    cols?: 1 | 2 | 3;
    /**
     * Content
     */
    children: React.ReactNode;
    /**
     * Additional className
     */
    className?: string;
}

/**
 * Responsive grid layout for DetailFields
 */
export function DetailGrid({ cols = 2, children, className }: DetailGridProps) {
    const colClasses = {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    };

    return (
        <div className={cn("grid gap-4", colClasses[cols], className)}>
            {children}
        </div>
    );
}
