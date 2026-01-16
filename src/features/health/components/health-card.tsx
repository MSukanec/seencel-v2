"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityHealth, HealthMetric } from "../types";
import { HealthBadge } from "./health-badge";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HealthCardProps {
    data: EntityHealth;
    title?: string;
}

export function HealthCard({ data, title = "Estado de Salud" }: HealthCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                    {title}
                </CardTitle>
                <HealthBadge score={data.overallScore} status={data.overallStatus} />
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mt-2">
                    {data.metrics.map((metric) => (
                        <MetricRow key={metric.id} metric={metric} />
                    ))}

                    {data.metrics.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No hay datos de salud disponibles.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function MetricRow({ metric }: { metric: HealthMetric }) {
    // Determine color based on individual metric score/status
    const colorClass =
        metric.status === 'excellent' ? 'bg-emerald-500' :
            metric.status === 'good' ? 'bg-blue-500' :
                metric.status === 'fair' ? 'bg-yellow-500' :
                    metric.status === 'poor' ? 'bg-orange-500' :
                        'bg-red-500';

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                    <span className="font-medium">{metric.label}</span>
                    {metric.message && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-xs">{metric.message}</p>
                                    {metric.recommendation && (
                                        <p className="max-w-xs text-xs mt-1 font-medium text-primary">
                                            Tip: {metric.recommendation}
                                        </p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{metric.currentValue} {metric.unit}</span>
                    <span className={cn("font-bold w-8 text-right",
                        metric.score >= 75 ? "text-emerald-600" :
                            metric.score >= 50 ? "text-yellow-600" : "text-red-600"
                    )}>
                        {Math.round(metric.score)}%
                    </span>
                </div>
            </div>
            <Progress value={metric.score} className="h-2" indicatorClassName={colorClass} />
        </div>
    );
}

// Utility for merging classes
import { cn } from "@/lib/utils";
