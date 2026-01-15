
"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
}

export function DashboardKpiCard({
    title,
    value,
    icon,
    trend,
    className,
    iconClassName,
    description,
    ...props
}: DashboardKpiCardProps) {

    return (
        <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)} {...props}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h2 className="text-3xl font-bold tracking-tight mt-2">{value}</h2>
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
