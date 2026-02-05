"use client";

import { cn } from "@/lib/utils";

/** 
 * Layout presets for common Bento arrangements 
 */
type BentoLayout =
    | 'default'      // Auto-flow, equal sizing
    | 'featured'     // 1 large + smaller items
    | 'balanced'     // Mixed sizes
    | 'custom';      // Free-form with col-span/row-span

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Grid layout preset */
    layout?: BentoLayout;
    /** Base column count (responsive) */
    columns?: 2 | 3 | 4 | 6;
    /** Gap between items */
    gap?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
};

const columnStyles = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
    6: 'md:grid-cols-3 lg:grid-cols-6'
};

/**
 * BentoGrid - Container for Bento-style card layouts
 * 
 * @example
 * ```tsx
 * <BentoGrid layout="featured" columns={4}>
 *   <BentoCard size="lg">...</BentoCard>
 *   <BentoCard size="sm">...</BentoCard>
 * </BentoGrid>
 * ```
 */
export function BentoGrid({
    layout = 'default',
    columns = 4,
    gap = 'md',
    className,
    children,
    ...props
}: BentoGridProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 auto-rows-fr",
                "[&>*]:min-h-[180px]", // Minimum height per item
                columnStyles[columns],
                gapStyles[gap],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
