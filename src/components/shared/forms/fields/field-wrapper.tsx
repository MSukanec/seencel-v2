/**
 * Field Wrapper for Dev Mode Visual Indicator
 * 
 * Wraps field factories with a subtle visual indicator during development
 * to help identify which fields are using the standardized system.
 */

"use client";

import { cn } from "@/lib/utils";

interface FieldWrapperProps {
    children: React.ReactNode;
    className?: string;
}

// Only show indicator in development
const isDev = process.env.NODE_ENV === "development";

export function FieldWrapper({ children, className }: FieldWrapperProps) {
    return <div className={className}>{children}</div>;
}

/**
 * Creates a label with the Factory indicator (green dot before text)
 * Only shows in development mode
 */
export function FactoryLabel({ label }: { label: string }) {
    if (!isDev) {
        return <>{label}</>;
    }

    return (
        <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            {label}
        </span>
    );
}
