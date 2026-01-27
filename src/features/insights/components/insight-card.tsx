import { cn } from "@/lib/utils";
import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, PieChart, Repeat, Calendar, Zap, Activity, Layers, Target, Wallet, Scale, AlertCircle, X, BarChart3, Clock, ChevronRight } from "lucide-react";
import { Insight, InsightAction } from "../types";

interface InsightCardProps {
    insight: Insight;
    onAction?: (action: InsightAction) => void;
    onDismiss?: (insightId: string) => void;
}

/**
 * InsightCard - Compact insight display component
 * Always renders in optimized compact mode with full info density
 */
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
                'AlertTriangle': AlertTriangle,
                'BarChart3': BarChart3,
                'Clock': Clock
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
            case 'warning': return "border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10";
            case 'critical': return "border-amount-negative/20 text-amount-negative hover:bg-amount-negative/10";
            case 'positive': return "border-amount-positive/20 text-amount-positive hover:bg-amount-positive/10";
            default: return "border-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10";
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

    // Primary action for inline display
    const primaryAction = insight.actions?.[0];

    return (
        <div className={cn(
            "relative px-3 py-2.5 rounded-lg border transition-all group",
            getColors()
        )}>
            <div className="flex items-start gap-3">
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    {/* Line 1: Title + Description */}
                    <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-medium text-sm">{insight.title}</span>
                        <span className="text-xs text-foreground/70">
                            {insight.description}
                        </span>
                    </div>
                    {/* Line 2: Context + ActionHint */}
                    {(insight.context || insight.actionHint) && (
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3">
                            {insight.context && <span className="opacity-80">{insight.context}</span>}
                            {insight.actionHint && (
                                <span className="font-medium opacity-90 flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3" /> {insight.actionHint}
                                </span>
                            )}
                        </div>
                    )}
                    {/* Line 3: Primary Action Link */}
                    {primaryAction && (
                        <button
                            onClick={() => handleActionClick(primaryAction)}
                            className="mt-1 text-xs font-medium flex items-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity"
                        >
                            {primaryAction.label}
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
                {onDismiss && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(insight.id);
                        }}
                        className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-opacity text-foreground/50 hover:text-foreground"
                        aria-label="Descartar"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
