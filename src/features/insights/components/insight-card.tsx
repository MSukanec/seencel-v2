import { cn } from "@/lib/utils";
import { Lightbulb, AlertTriangle, CheckCircle, Info, ChevronRight, TrendingUp, TrendingDown, PieChart, Repeat, Calendar, Zap, Activity, Layers, Target, Wallet, Scale, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Insight, InsightAction } from "../types";

interface InsightCardProps {
    insight: Insight;
    onAction?: (action: InsightAction) => void;
    onDismiss?: (insightId: string) => void;
}

export function InsightCard({ insight, onAction, onDismiss }: InsightCardProps) {
    const getIcon = () => {
        // First try to match by string name (legacy compat)
        if (insight.icon) {
            const icons: Record<string, any> = {
                'TrendingUp': TrendingUp,
                'TrendingDown': TrendingDown,
                'PieChart': PieChart,
                'Repeat': Repeat,
                'Calendar': Calendar,
                'Zap': Zap,
                'Activity': Activity,
                'Layers': Layers,
                'Tag': Lightbulb, // Fallback
                'Target': Target,
                'Wallet': Wallet,
                'Scale': Scale,
                'AlertCircle': AlertCircle,
                'AlertTriangle': AlertTriangle
            };
            if (icons[insight.icon]) return icons[insight.icon];
        }

        // Fallback to severity based
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
            case 'critical': return "border-amount-negative/20 bg-amount-negative/10 text-amount-negative";
            case 'positive': return "border-amount-positive/20 bg-amount-positive/10 text-amount-positive";
            default: return "border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-400";
        }
    };

    const Icon = getIcon();

    // Action Handler
    const handleActionClick = (action: InsightAction) => {
        if (action.onClick) {
            action.onClick();
        } else if (onAction) {
            onAction(action);
        }
    };

    return (
        <div className={cn("relative p-4 rounded-xl border flex items-start gap-4 transition-all hover:bg-muted/30 group", getColors())}>
            {onDismiss && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(insight.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-opacity text-foreground/50 hover:text-foreground"
                    aria-label="Descartar"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
            <div className="mt-0.5">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 pr-4">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                </div>

                <p className="text-sm text-foreground/80 mb-2 leading-relaxed">
                    {insight.description}
                </p>

                {/* Context / Hint (Legacy Richness) */}
                {(insight.context || insight.actionHint) && (
                    <div className="mb-3 text-xs text-muted-foreground space-y-0.5">
                        {insight.context && <p className="opacity-90">{insight.context}</p>}
                        {insight.actionHint && <p className="font-medium opacity-100 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 inline" /> {insight.actionHint}
                        </p>}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    {insight.actions?.map(action => (
                        <Button
                            key={action.id}
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs hover:bg-transparent font-medium flex items-center gap-1 opacity-80 hover:opacity-100"
                            onClick={() => handleActionClick(action)}
                        >
                            {action.label}
                            <ChevronRight className="w-3 h-3" />
                        </Button>
                    ))}

                    {/* Compatibility for old single-action or explicit label */}
                    {(!insight.actions || insight.actions.length === 0) && (insight.actionLabel) && (
                        <span className="text-xs text-muted-foreground italic">
                            {insight.actionLabel}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

