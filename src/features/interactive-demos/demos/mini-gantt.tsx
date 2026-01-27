'use client';

/**
 * MiniGantt - Demo Interactivo de Diagrama Gantt
 * 
 * Mini timeline con barras de tareas que se pueden
 * arrastrar y redimensionar.
 */

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';

interface GanttTask {
    id: string;
    name: string;
    startDay: number; // 0-indexed
    duration: number; // days
    color: string;
    progress: number; // 0-100
}

const WEEKS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
const DAYS_PER_WEEK = 7;
const TOTAL_DAYS = WEEKS.length * DAYS_PER_WEEK;

const INITIAL_TASKS: GanttTask[] = [
    { id: '1', name: 'Planificación', startDay: 0, duration: 5, color: 'bg-blue-500', progress: 100 },
    { id: '2', name: 'Excavación', startDay: 4, duration: 7, color: 'bg-amber-500', progress: 80 },
    { id: '3', name: 'Cimientos', startDay: 10, duration: 8, color: 'bg-orange-500', progress: 45 },
    { id: '4', name: 'Estructura', startDay: 16, duration: 10, color: 'bg-green-500', progress: 10 },
    { id: '5', name: 'Instalaciones', startDay: 22, duration: 6, color: 'bg-purple-500', progress: 0 },
];

export function MiniGantt() {
    const [tasks, setTasks] = useState<GanttTask[]>(INITIAL_TASKS);
    const [dragging, setDragging] = useState<{ taskId: string; startX: number; originalStart: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDragStart = (e: React.MouseEvent, taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        setDragging({
            taskId,
            startX: e.clientX,
            originalStart: task.startDay,
        });
    };

    const handleDragMove = (e: React.MouseEvent) => {
        if (!dragging || !containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const dayWidth = containerWidth / TOTAL_DAYS;
        const deltaX = e.clientX - dragging.startX;
        const deltaDays = Math.round(deltaX / dayWidth);

        const task = tasks.find(t => t.id === dragging.taskId);
        if (!task) return;

        const newStart = Math.max(0, Math.min(TOTAL_DAYS - task.duration, dragging.originalStart + deltaDays));

        setTasks(prev => prev.map(t =>
            t.id === dragging.taskId ? { ...t, startDay: newStart } : t
        ));
    };

    const handleDragEnd = () => {
        setDragging(null);
    };

    const getTaskStyle = (task: GanttTask) => {
        const left = (task.startDay / TOTAL_DAYS) * 100;
        const width = (task.duration / TOTAL_DAYS) * 100;
        return { left: `${left}%`, width: `${width}%` };
    };

    return (
        <div
            className="w-full space-y-3"
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Demo en vivo</span>
                </div>
                <span className="text-xs text-muted-foreground">Arrastrá las barras</span>
            </div>

            {/* Timeline Header */}
            <div className="relative">
                <div className="grid grid-cols-4 border-b border-border/50">
                    {WEEKS.map((week, i) => (
                        <div
                            key={i}
                            className="text-center text-[10px] text-muted-foreground py-1 border-r border-border/30 last:border-r-0"
                        >
                            {week}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tasks */}
            <div ref={containerRef} className="space-y-1.5">
                {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2">
                        {/* Task Name */}
                        <div className="w-20 flex-shrink-0">
                            <p className="text-[10px] font-medium truncate">{task.name}</p>
                        </div>

                        {/* Timeline Bar Container */}
                        <div className="flex-1 relative h-6 bg-muted/30 rounded overflow-hidden">
                            {/* Week grid lines */}
                            <div className="absolute inset-0 grid grid-cols-4">
                                {WEEKS.map((_, i) => (
                                    <div key={i} className="border-r border-border/20 last:border-r-0" />
                                ))}
                            </div>

                            {/* Task Bar */}
                            <div
                                className={cn(
                                    'absolute top-0.5 bottom-0.5 rounded cursor-grab active:cursor-grabbing',
                                    'flex items-center justify-between px-1 group',
                                    'transition-shadow hover:shadow-md',
                                    task.color,
                                    dragging?.taskId === task.id && 'opacity-80 ring-2 ring-white/50'
                                )}
                                style={getTaskStyle(task)}
                                onMouseDown={(e) => handleDragStart(e, task.id)}
                            >
                                {/* Progress overlay */}
                                <div
                                    className="absolute inset-0 bg-black/20 rounded origin-left"
                                    style={{
                                        width: `${100 - task.progress}%`,
                                        left: `${task.progress}%`
                                    }}
                                />

                                {/* Grip icon */}
                                <GripVertical
                                    size={10}
                                    className="text-white/70 opacity-0 group-hover:opacity-100 transition-opacity relative z-10"
                                />

                                {/* Progress text */}
                                <span className="text-[8px] text-white font-medium relative z-10">
                                    {task.progress}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded-sm bg-blue-500" />
                    <span className="text-[9px] text-muted-foreground">Completado</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded-sm bg-amber-500" />
                    <span className="text-[9px] text-muted-foreground">En progreso</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded-sm bg-green-500 opacity-50" />
                    <span className="text-[9px] text-muted-foreground">Pendiente</span>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground text-center">
                    Planificá y visualizá el cronograma de tu obra
                </p>
            </div>
        </div>
    );
}
