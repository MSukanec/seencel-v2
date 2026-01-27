"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockConfig } from "../../views/reports-builder-view";

interface TaskProgressBlockProps {
    config: BlockConfig;
    organizationId: string;
}

// Mock task data
const MOCK_TASKS = {
    total: 48,
    completed: 32,
    inProgress: 10,
    pending: 6,
};

export function TaskProgressBlock({ config, organizationId }: TaskProgressBlockProps) {
    const { title, projectIds } = config;

    const completionPercentage = Math.round((MOCK_TASKS.completed / MOCK_TASKS.total) * 100);

    return (
        <div className="space-y-4">
            {title && (
                <h4 className="font-semibold text-sm">{title}</h4>
            )}

            {/* Progress Overview */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso general</span>
                    <span className="font-semibold">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-3" />
            </div>

            {/* Task Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <TaskStat
                    icon={ListTodo}
                    label="Total"
                    value={MOCK_TASKS.total}
                    color="text-muted-foreground"
                    bgColor="bg-muted"
                />
                <TaskStat
                    icon={CheckCircle2}
                    label="Completadas"
                    value={MOCK_TASKS.completed}
                    color="text-green-600"
                    bgColor="bg-green-500/10"
                />
                <TaskStat
                    icon={Clock}
                    label="En Progreso"
                    value={MOCK_TASKS.inProgress}
                    color="text-blue-600"
                    bgColor="bg-blue-500/10"
                />
                <TaskStat
                    icon={AlertCircle}
                    label="Pendientes"
                    value={MOCK_TASKS.pending}
                    color="text-yellow-600"
                    bgColor="bg-yellow-500/10"
                />
            </div>

            <p className="text-xs text-muted-foreground text-center">
                {projectIds && projectIds.length > 0
                    ? `Tareas de ${projectIds.length} proyecto(s)`
                    : "Tareas de toda la organización"
                }
            </p>
        </div>
    );
}

function TaskStat({
    icon: Icon,
    label,
    value,
    color,
    bgColor
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    color: string;
    bgColor: string;
}) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", bgColor)}>
                <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div>
                <p className={cn("text-lg font-bold", color)}>{value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
        </div>
    );
}
