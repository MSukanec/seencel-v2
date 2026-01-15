
"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Currency breakdown item for bi-monetary display */
export interface CurrencyBreakdownItem {
    currencyCode: string;
    symbol: string;
    nativeTotal: number;
    functionalTotal: number;
    isPrimary: boolean;
}

interface DashboardKpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: string | number;
        label?: string; // e.g. "vs last month"
        direction: "up" | "down" | "neutral";
    };
    description?: string;
    iconClassName?: string;
    /** Optional currency breakdown for bi-monetary KPIs */
    currencyBreakdown?: CurrencyBreakdownItem[];
}

export function DashboardKpiCard({
    title,
    value,
    icon,
    trend,
    className,
    iconClassName,
    description,
    currencyBreakdown,
    ...props
}: DashboardKpiCardProps) {
    // Only show breakdown if there are 2+ currencies
    const showBreakdown = currencyBreakdown && currencyBreakdown.length > 1;

    return (
        <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)} {...props}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h2 className="text-3xl font-bold tracking-tight mt-2">{value}</h2>

                        {/* Currency Breakdown */}
                        {showBreakdown && (
                            <div className="mt-1.5 space-y-0.5">
                                {currencyBreakdown.map((item) => (
                                    <p key={item.currencyCode} className="text-xs text-muted-foreground">
                                        {item.isPrimary ? (
                                            <span>{item.symbol} {item.nativeTotal.toLocaleString('es-AR')} nativo</span>
                                        ) : (
                                            <span className="text-primary/80">
                                                + {item.currencyCode} {item.nativeTotal.toLocaleString('es-AR')}
                                            </span>
                                        )}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className={cn("p-3 rounded-xl bg-primary/10 text-primary transition-colors", iconClassName)}>
                            {icon}
                        </div>
                    )}
                </div>
                {(trend || description) && (
                    <div className="mt-4 flex items-center gap-2 text-xs">
                        {trend && (
                            <span className={cn(
                                "font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                                trend.direction === "up" && "bg-emerald-500/10 text-emerald-600",
                                trend.direction === "down" && "bg-destructive/10 text-destructive",
                                trend.direction === "neutral" && "bg-muted text-muted-foreground"
                            )}>
                                {trend.direction === "up" && <TrendingUp className="w-3 h-3" />}
                                {trend.direction === "down" && <TrendingDown className="w-3 h-3" />}
                                {trend.direction === "neutral" && <Minus className="w-3 h-3" />}
                                {trend.value}
                            </span>
                        )}
                        {trend?.label && (
                            <span className="text-muted-foreground">{trend.label}</span>
                        )}
                        {description && !trend?.label && (
                            <span className="text-muted-foreground">{description}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

