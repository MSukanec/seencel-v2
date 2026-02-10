"use client";

import { ConstructionTaskView, STATUS_CONFIG } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Calendar,
    Play,
    Pause,
    CheckCircle2,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConstructionTaskCardProps {
    task: ConstructionTaskView;
    onEdit?: (task: ConstructionTaskView) => void;
    onDelete?: (task: ConstructionTaskView) => void;
    onStatusChange?: (task: ConstructionTaskView, status: string) => void;
}

export function ConstructionTaskCard({
    task,
    onEdit,
    onDelete,
    onStatusChange,
}: ConstructionTaskCardProps) {
    const statusConfig = STATUS_CONFIG[task.status];
    const displayName = task.task_name || task.custom_name || "Sin nombre";
    const displayUnit = task.unit || task.custom_unit || "";

    return (
        <Card className="group hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    {/* Main content */}
                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Header */}
                        <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground truncate">
                                    {displayName}
                                </h3>
                                {task.division_name && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {task.division_name}
                                    </p>
                                )}
                                {task.recipe_name && (
                                    <p className="text-xs text-muted-foreground/70 truncate italic">
                                        Receta: {task.recipe_name}
                                    </p>
                                )}
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "shrink-0",
                                    statusConfig.color,
                                    statusConfig.bgColor
                                )}
                            >
                                {statusConfig.label}
                            </Badge>
                        </div>

                        {/* Quantity & Unit */}
                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">
                                {task.quantity?.toLocaleString("es-AR") || 0} {displayUnit}
                            </span>
                            {task.quote_name && (
                                <span className="text-muted-foreground text-xs truncate">
                                    Presupuesto: {task.quote_name}
                                </span>
                            )}
                        </div>

                        {/* Progress */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progreso</span>
                                <span className="font-medium">{task.progress_percent || 0}%</span>
                            </div>
                            <Progress value={task.progress_percent || 0} className="h-1.5" />
                        </div>

                        {/* Dates */}
                        {(task.planned_start_date || task.planned_end_date) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {task.planned_start_date && (
                                    <span>
                                        {format(new Date(task.planned_start_date), "dd MMM", { locale: es })}
                                    </span>
                                )}
                                {task.planned_start_date && task.planned_end_date && <span>→</span>}
                                {task.planned_end_date && (
                                    <span>
                                        {format(new Date(task.planned_end_date), "dd MMM yyyy", { locale: es })}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* Quick status changes */}
                            {task.status !== 'in_progress' && (
                                <DropdownMenuItem onClick={() => onStatusChange?.(task, 'in_progress')}>
                                    <Play className="mr-2 h-4 w-4 text-blue-500" />
                                    Iniciar
                                </DropdownMenuItem>
                            )}
                            {task.status === 'in_progress' && (
                                <DropdownMenuItem onClick={() => onStatusChange?.(task, 'paused')}>
                                    <Pause className="mr-2 h-4 w-4 text-yellow-500" />
                                    Pausar
                                </DropdownMenuItem>
                            )}
                            {task.status !== 'completed' && (
                                <DropdownMenuItem onClick={() => onStatusChange?.(task, 'completed')}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                    Marcar completada
                                </DropdownMenuItem>
                            )}
                            {task.status !== 'pending' && (
                                <DropdownMenuItem onClick={() => onStatusChange?.(task, 'pending')}>
                                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                                    Marcar pendiente
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => onEdit?.(task)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete?.(task)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}
