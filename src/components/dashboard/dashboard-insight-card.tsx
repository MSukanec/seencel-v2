import { cn } from "@/lib/utils";
import { Lightbulb, AlertTriangle, CheckCircle, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type InsightSeverity = 'info' | 'warning' | 'critical' | 'positive';

export interface Insight {
    id: string;
    title: string;
    description: string;
    severity: InsightSeverity;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface InsightCardProps {
    insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
    const getIcon = () => {
        switch (insight.severity) {
            case 'warning': return AlertTriangle;
            case 'critical': return AlertTriangle;
            case 'positive': return CheckCircle;
            default: return Lightbulb;
        }
    };

    const getColors = () => {
        switch (insight.severity) {
            case 'warning': return "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400";
            case 'critical': return "border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400";
            case 'positive': return "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400";
            default: return "border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-400";
        }
    };

    const Icon = getIcon();

    return (
        <div className={cn("p-4 rounded-xl border flex items-start gap-4 transition-all hover:bg-muted/30", getColors())}>
            <div className="mt-0.5">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                <p className="text-sm text-foreground/80 mb-3 leading-relaxed">
                    {insight.description}
                </p>
                {insight.action && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs hover:bg-transparent font-medium flex items-center gap-1 opacity-80 hover:opacity-100"
                        onClick={insight.action.onClick}
                    >
                        {insight.action.label}
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                )}
            </div>
        </div>
    );
}
