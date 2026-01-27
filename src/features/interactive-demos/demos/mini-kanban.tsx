'use client';

/**
 * MiniKanban - Demo Interactivo
 * 
 * Mini tablero Kanban con drag & drop funcional
 * para mostrar la funcionalidad en la landing.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Plus, MoreHorizontal } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    tag?: string;
    tagColor?: string;
}

interface Column {
    id: string;
    title: string;
    color: string;
    tasks: Task[];
}

const INITIAL_COLUMNS: Column[] = [
    {
        id: 'todo',
        title: 'Por Hacer',
        color: 'bg-slate-500',
        tasks: [
            { id: '1', title: 'Revisar planos arquitectónicos', tag: 'Diseño', tagColor: 'bg-purple-500' },
            { id: '2', title: 'Solicitar permisos municipales', tag: 'Legal', tagColor: 'bg-blue-500' },
        ],
    },
    {
        id: 'in-progress',
        title: 'En Progreso',
        color: 'bg-amber-500',
        tasks: [
            { id: '3', title: 'Instalación eléctrica Piso 1', tag: 'Eléctrica', tagColor: 'bg-yellow-500' },
            { id: '4', title: 'Compra de materiales', tag: 'Logística', tagColor: 'bg-green-500' },
        ],
    },
    {
        id: 'done',
        title: 'Completado',
        color: 'bg-emerald-500',
        tasks: [
            { id: '5', title: 'Excavación de cimientos', tag: 'Obra', tagColor: 'bg-orange-500' },
        ],
    },
];

export function MiniKanban() {
    const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
    const [draggedTask, setDraggedTask] = useState<{ task: Task; fromColumnId: string } | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const handleDragStart = (task: Task, columnId: string) => {
        setDraggedTask({ task, fromColumnId: columnId });
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (toColumnId: string) => {
        if (!draggedTask) return;

        const { task, fromColumnId } = draggedTask;

        if (fromColumnId === toColumnId) {
            setDraggedTask(null);
            setDragOverColumn(null);
            return;
        }

        setColumns(prev => prev.map(col => {
            if (col.id === fromColumnId) {
                return { ...col, tasks: col.tasks.filter(t => t.id !== task.id) };
            }
            if (col.id === toColumnId) {
                return { ...col, tasks: [...col.tasks, task] };
            }
            return col;
        }));

        setDraggedTask(null);
        setDragOverColumn(null);
    };

    const handleDragEnd = () => {
        setDraggedTask(null);
        setDragOverColumn(null);
    };

    return (
        <div className="w-full">
            {/* Header del Kanban */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Demo en vivo</span>
                </div>
                <span className="text-xs text-muted-foreground">Arrastrá las tarjetas</span>
            </div>

            {/* Columnas */}
            <div className="grid grid-cols-3 gap-3">
                {columns.map((column) => (
                    <div
                        key={column.id}
                        className={cn(
                            'rounded-lg p-2 transition-all duration-200',
                            'bg-muted/50 border border-border/50',
                            dragOverColumn === column.id && 'ring-2 ring-primary/50 bg-primary/5'
                        )}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop(column.id)}
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="flex items-center gap-1.5">
                                <div className={cn('w-2 h-2 rounded-full', column.color)} />
                                <span className="text-xs font-medium">{column.title}</span>
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded-full">
                                    {column.tasks.length}
                                </span>
                            </div>
                            <button className="p-0.5 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={12} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Tasks */}
                        <div className="space-y-1.5 min-h-[80px]">
                            {column.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={() => handleDragStart(task, column.id)}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                        'group p-2 bg-card rounded-md border border-border/50',
                                        'cursor-grab active:cursor-grabbing',
                                        'hover:border-primary/30 hover:shadow-sm',
                                        'transition-all duration-150',
                                        draggedTask?.task.id === task.id && 'opacity-50 scale-95'
                                    )}
                                >
                                    <div className="flex items-start gap-1.5">
                                        <GripVertical
                                            size={12}
                                            className="text-muted-foreground/50 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium leading-tight line-clamp-2">
                                                {task.title}
                                            </p>
                                            {task.tag && (
                                                <span
                                                    className={cn(
                                                        'inline-block mt-1 text-[9px] text-white px-1.5 py-0.5 rounded',
                                                        task.tagColor
                                                    )}
                                                >
                                                    {task.tag}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground text-center">
                    Organiza tareas de construcción visualmente con nuestro tablero Kanban
                </p>
            </div>
        </div>
    );
}
