"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    /** Glow accent color (CSS color value) */
    glowColor?: string;
    /** Content */
    children: React.ReactNode;
    /** Hide header (for custom layouts) */
    headerless?: boolean;
}

const sizeStyles: Record<BentoSize, string> = {
    sm: 'col-span-1 row-span-1',
    md: 'col-span-1 md:col-span-2 row-span-1',
    lg: 'col-span-1 md:col-span-2 row-span-2',
    wide: 'col-span-full row-span-1',
    tall: 'col-span-1 row-span-2'
};

const variantStyles: Record<BentoVariant, string> = {
    default: 'bg-card/60 backdrop-blur-sm border-border/50',
    glass: 'bg-card/30 backdrop-blur-md border-white/10 shadow-xl',
    gradient: 'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border-border/30',
    outline: 'bg-transparent border-2 border-border'
};

/**
 * BentoCard - Flexible card component for Bento layouts
 * 
 * @example
 * ```tsx
 * <BentoCard size="lg" variant="glass" title="Revenue">
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
    glowColor,
    headerless = false,
    className,
    children,
    style,
    ...props
}: BentoCardProps) {
    const glowStyle = glowColor ? {
        '--glow-color': glowColor,
        boxShadow: `0 0 40px -10px ${glowColor}20`
    } as React.CSSProperties : {};

    return (
        <Card
            className={cn(
                "overflow-hidden transition-all duration-300",
                "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30",
                sizeStyles[size],
                variantStyles[variant],
                className
            )}
            style={{ ...style, ...glowStyle }}
            {...props}
        >
            {!headerless && title && (
                <CardHeader className="pb-2 space-y-0">
                    <div className="flex items-center gap-2">
                        {icon && (
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                {icon}
                            </div>
                        )}
                        <div>
                            <CardTitle className="text-sm font-medium">{title}</CardTitle>
                            {subtitle && (
                                <CardDescription className="text-xs">{subtitle}</CardDescription>
                            )}
                        </div>
                    </div>
                </CardHeader>
            )}
            <CardContent className={cn("h-full", !headerless && title && "pt-0")}>
                {children}
            </CardContent>
        </Card>
    );
}
