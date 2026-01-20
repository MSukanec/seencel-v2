"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TaskView } from "@/features/tasks/types";

interface TaskCatalogComboboxProps {
    value: string;
    onValueChange: (value: string, task?: TaskView) => void;
    tasks: TaskView[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    name?: string;
}

/**
 * TaskCatalogCombobox - A specialized searchable combobox for task catalog selection
 * 
 * Features:
 * - Fast fuzzy search by name, code, or division
 * - Tasks grouped by division/rubro
 * - Scalable to 10,000+ tasks
 * - Shows task code, name, and unit in display
 */
export function TaskCatalogCombobox({
    value,
    onValueChange,
    tasks,
    placeholder = "Buscar tarea...",
    disabled = false,
    className,
    name,
}: TaskCatalogComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    // Find selected task
    const selectedTask = tasks.find((t) => t.id === value);

    // Group tasks by division
    const tasksByDivision = React.useMemo(() => {
        return tasks.reduce((acc, task) => {
            const divisionName = task.division_name || "Sin División";
            if (!acc[divisionName]) {
                acc[divisionName] = [];
            }
            acc[divisionName].push(task);
            return acc;
        }, {} as Record<string, TaskView[]>);
    }, [tasks]);

    // Filter tasks based on search (fuzzy matching)
    const filteredTasksByDivision = React.useMemo(() => {
        if (!search.trim()) return tasksByDivision;

        const searchLower = search.toLowerCase();
        const filtered: Record<string, TaskView[]> = {};

        Object.entries(tasksByDivision).forEach(([division, divTasks]) => {
            const matchingTasks = divTasks.filter((task) => {
                const searchableText = [
                    task.name,
                    task.custom_name,
                    task.code,
                    task.division_name,
                    task.unit_name,
                ].filter(Boolean).join(" ").toLowerCase();

                return searchableText.includes(searchLower);
            });

            if (matchingTasks.length > 0) {
                filtered[division] = matchingTasks;
            }
        });

        return filtered;
    }, [tasksByDivision, search]);

    const totalFilteredTasks = React.useMemo(() => {
        return Object.values(filteredTasksByDivision).reduce((sum, tasks) => sum + tasks.length, 0);
    }, [filteredTasksByDivision]);

    const handleSelect = (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        onValueChange(taskId, task);
        setOpen(false);
        setSearch("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange("", undefined);
    };

    // Format display label
    const getDisplayLabel = (task: TaskView) => {
        const parts: string[] = [];
        if (task.code) parts.push(`[${task.code}]`);
        parts.push(task.name || task.custom_name || "");
        if (task.unit_name) parts.push(`(${task.unit_name})`);
        return parts.join(" ");
    };

    return (
        <>
            {name && <input type="hidden" name={name} value={value} />}
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild disabled={disabled}>
                    <button
                        type="button"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 h-9",
                            className
                        )}
                    >
                        <span className="flex items-center gap-2 truncate flex-1 text-left">
                            {selectedTask ? (
                                <span className="truncate">{getDisplayLabel(selectedTask)}</span>
                            ) : (
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    {placeholder}
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                            {selectedTask && (
                                <span
                                    onClick={handleClear}
                                    className="hover:bg-accent rounded p-0.5 cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </span>
                            )}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="p-0"
                    align="start"
                    sideOffset={4}
                    style={{ minWidth: 'var(--radix-popover-trigger-width)', width: 'var(--radix-popover-trigger-width)' }}
                >
                    <Command
                        className="[&_[data-slot=command-input-wrapper]]:border-b [&_[data-slot=command-input-wrapper]]:!ring-0 [&_[data-slot=command-input-wrapper]]:!shadow-none [&_[data-slot=command-input-wrapper]]:!outline-none"
                        shouldFilter={false}
                    >
                        <div className="[&_input]:!ring-0 [&_input]:!shadow-none [&_input]:!outline-none [&_input]:!border-none">
                            <CommandInput
                                placeholder="Buscar por nombre, código o rubro..."
                                className="!border-none !ring-0 !outline-none !shadow-none h-10"
                                value={search}
                                onValueChange={setSearch}
                            />
                        </div>
                        <CommandList className="max-h-[400px]">
                            <CommandEmpty>
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No se encontraron tareas
                                </div>
                            </CommandEmpty>
                            {Object.entries(filteredTasksByDivision).map(([division, divTasks]) => (
                                <CommandGroup key={division} heading={division}>
                                    {divTasks.map((task) => (
                                        <CommandItem
                                            key={task.id}
                                            value={task.id}
                                            onSelect={() => handleSelect(task.id)}
                                            className="flex items-start gap-2 py-2"
                                        >
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 shrink-0 mt-0.5",
                                                    value === task.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium truncate">
                                                        {task.code && (
                                                            <span className="text-primary font-mono text-xs mr-2">
                                                                [{task.code}]
                                                            </span>
                                                        )}
                                                        {task.name || task.custom_name}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
                                                        task.is_system
                                                            ? "bg-blue-500/20 text-blue-400"
                                                            : "bg-amber-500/20 text-amber-400"
                                                    )}>
                                                        {task.is_system ? "Sistema" : "Org"}
                                                    </span>
                                                </div>
                                                {task.unit_name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Unidad: {task.unit_name}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ))}
                        </CommandList>
                        {totalFilteredTasks > 0 && (
                            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                                {totalFilteredTasks} tarea{totalFilteredTasks !== 1 ? 's' : ''} encontrada{totalFilteredTasks !== 1 ? 's' : ''}
                            </div>
                        )}
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    );
}
