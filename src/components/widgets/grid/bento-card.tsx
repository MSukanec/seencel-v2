"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** Size variants controlling grid span */
type BentoSize =
    | 'sm'    // 1x1 - Simple KPI
    | 'md'    // 2x1 - KPI + sparkline
    | 'lg'    // 2x2 - Full chart
    | 'wide'  // Full width, 1 row
    | 'tall'; // 1 col, 2 rows

/** Visual style variants */
type BentoVariant = 'default' | 'glass' | 'gradient' | 'outline';

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Size controls grid span */
    size?: BentoSize;
    /** Card title */
    title?: string;
    /** Subtitle or description */
    subtitle?: string;
    /** Icon component */
    icon?: React.ReactNode;
    /** Visual variant */
    variant?: BentoVariant;

    /** Main content (goes in Body) */
    children: React.ReactNode;
    /** Footer content (optional) */
    footer?: React.ReactNode;
    /** Hide header completely */
    headerless?: boolean;
}

export const sizeStyles: Record<BentoSize, string> = {
    sm: 'col-span-1 row-span-1',
    md: 'col-span-1 md:col-span-2 row-span-1',
    lg: 'col-span-1 md:col-span-2 row-span-2',
    wide: 'col-span-full row-span-1',
    tall: 'col-span-1 row-span-2'
};

const variantStyles: Record<BentoVariant, string> = {
    default: 'bg-card border-border/50',
    glass: 'bg-card border-border/50',
    gradient: 'bg-card border-border/50',
    outline: 'bg-transparent border-2 border-border'
};

/**
 * BentoCard - Flexible card component for Bento layouts
 * 
 * Structure:
 * - Header: Icon + Title + Subtitle (fixed height)
 * - Body: Main content area (flex-1, expands)
 * - Footer: Optional insights/actions (fixed height)
 * 
 * @example
 * ```tsx
 * <BentoCard 
 *   size="lg" 
 *   title="Revenue" 
 *   icon={<DollarSign />}
 *   footer={<InsightBadge text="Up 12%" />}
 * >
 *   <ChartComponent />
 * </BentoCard>
 * ```
 */
export function BentoCard({
    size = 'sm',
    title,
    subtitle,
    icon,
    variant = 'default',
    headerless = false,
    footer,
    className,
    children,
    style,
    ...props
}: BentoCardProps) {
    return (
        <Card
            className={cn(
                "h-full flex flex-col overflow-hidden",
                sizeStyles[size],
                variantStyles[variant],
                className
            )}
            style={style}
            {...props}
        >
            {/* === HEADER === */}
            {!headerless && title && (
                <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-border/50">
                    {icon && (
                        <div className="shrink-0 p-1.5 rounded-lg bg-primary/10 text-primary">
                            {icon}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium leading-tight truncate">{title}</h3>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                        )}
                    </div>
                </div>
            )}

            {/* === BODY === */}
            <div className={cn(
                "flex-1 min-h-0 px-4",
                !headerless && title ? "pb-3" : "py-3"
            )}>
                {children}
            </div>

            {/* === FOOTER (Optional) === */}
            {footer && (
                <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
                    {footer}
                </div>
            )}
        </Card>
    );
}
