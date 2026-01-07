import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    className?: string;
    iconColor?: string;
    description?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, trendUp, className, iconColor, description }: KpiCardProps) {
    return (
        <div className={cn("relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-md", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h2 className="text-3xl font-bold tracking-tight mt-2">{value}</h2>
                </div>
                <div className={cn("p-3 rounded-xl bg-background/50 backdrop-blur-md", iconColor)}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {(trend || description) && (
                <div className="mt-4 flex items-center gap-2">
                    {trend && (
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1", trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                            {trendUp !== undefined ? (trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />) : null}
                            {trend}
                        </span>
                    )}
                    {description && (
                        <span className="text-xs text-muted-foreground">{description}</span>
                    )}
                </div>
            )}
        </div>
    );
}
