/**
 * Project Column Factory
 * Standard 19.2 - Reusable Project Column
 *
 * Creates a standardized project column showing:
 * - Project color dot or image as avatar
 * - Project name
 * - Inline editing via Popover + Command (Linear-style)
 */

"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Check, Settings } from "lucide-react";
import { DataTableColumnHeader } from "../data-table-column-header";
import { useRouter } from "@/i18n/routing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CELL_VALUE_CLASS, CELL_EMPTY_CLASS, EDITABLE_CELL_CLASS } from "./column-styles";

// ─── Types ───────────────────────────────────────────────

export interface ProjectOption {
    /** Project ID */
    value: string;
    /** Display name */
    label: string;
    /** Project color */
    color?: string | null;
    /** Project image URL */
    imageUrl?: string | null;
    /** Project status (active, planning, completed, inactive) */
    status?: string | null;
}

export interface ProjectColumnOptions<TData> {
    /** Column accessor key for project name (default: "project_name") */
    accessorKey?: string;
    /** Column header title (default: "Proyecto") */
    title?: string;
    /** Function to get project image URL from row */
    getImageUrl?: (row: TData) => string | null | undefined;
    /** Function to get project color from row */
    getColor?: (row: TData) => string | null | undefined;
    /** Enable sorting (default: true) */
    enableSorting?: boolean;
    /** Value to show when no project (default: "Sin proyecto") */
    emptyValue?: string;
    /** Column width in px (default: 160) */
    size?: number;
    /** Enable inline editing (default: false) */
    editable?: boolean;
    /** Available projects for selection (required if editable) */
    projectOptions?: ProjectOption[];
    /** Callback when project changes (required if editable) */
    onUpdate?: (row: TData, newProjectId: string | null) => Promise<void> | void;
    /** Function to get current project ID from row (required if editable) */
    getProjectId?: (row: TData) => string | null;
}

// ─── Editable Project Cell ───────────────────────────────

function EditableProjectCell<TData>({
    row,
    name,
    imageUrl,
    color,
    projectOptions,
    getProjectId,
    onUpdate,
    emptyValue,
}: {
    row: TData;
    name: string | null;
    imageUrl: string | null | undefined;
    color: string | null | undefined;
    projectOptions: ProjectOption[];
    getProjectId: (row: TData) => string | null;
    onUpdate: (row: TData, newProjectId: string | null) => Promise<void> | void;
    emptyValue: string;
}) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const currentId = getProjectId(row);
    const initials = name ? name.substring(0, 2).toUpperCase() : "?";

    // Filter to only active/planning projects for selection
    const ACTIVE_STATUSES = ["active", "planning"];
    const selectableOptions = React.useMemo(() => 
        projectOptions.filter(p => !p.status || ACTIVE_STATUSES.includes(p.status)),
        [projectOptions]
    );

    const handleSelect = (projectId: string) => {
        setOpen(false);
        const newId = projectId === "__none__" ? null : projectId;
        if (newId !== currentId) {
            onUpdate(row, newId);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn("flex items-center gap-2", EDITABLE_CELL_CLASS)}
                    onClick={(e) => e.stopPropagation()}
                >
                    {name ? (
                        <>
                            <Avatar className="h-6 w-6 rounded-md border border-border/50">
                                {imageUrl ? (
                                    <AvatarImage src={imageUrl} alt={name} className="object-cover" />
                                ) : null}
                                <AvatarFallback
                                    className="rounded-md text-[7px] font-bold text-white"
                                    style={{ backgroundColor: color || "hsl(var(--primary))" }}
                                >
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className={cn(CELL_VALUE_CLASS, "truncate max-w-[120px]")} title={name}>
                                {name}
                            </span>
                        </>
                    ) : (
                        <span className={cn(CELL_EMPTY_CLASS, "italic")}>{emptyValue}</span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <Command>
                    <CommandInput placeholder="Buscar proyecto activo..." className="h-8 text-xs" />
                    <CommandList>
                        <CommandEmpty className="text-xs text-center py-3">No encontrado</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="__none__"
                                onSelect={() => handleSelect("__none__")}
                                className="flex items-center gap-2 text-xs"
                            >
                                <div className="h-5 w-5 rounded-full shrink-0 flex items-center justify-center bg-muted border border-border/40">
                                    <span className="text-muted-foreground text-[9px] font-bold">✕</span>
                                </div>
                                <span className="flex-1 text-muted-foreground">{emptyValue}</span>
                                {!currentId && <Check className="h-3.5 w-3.5 text-primary" />}
                            </CommandItem>
                            {selectableOptions.map((project) => {
                                const pInitials = project.label ? project.label.substring(0, 2).toUpperCase() : "?";
                                return (
                                    <CommandItem
                                        key={project.value}
                                        value={project.label}
                                        onSelect={() => handleSelect(project.value)}
                                        className="flex items-center gap-2 text-xs"
                                    >
                                        {project.imageUrl ? (
                                            <img
                                                src={project.imageUrl}
                                                alt={project.label}
                                                className="h-5 w-5 rounded-full object-cover shrink-0"
                                            />
                                        ) : (
                                            <div
                                                className="h-5 w-5 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-[8px]"
                                                style={{ backgroundColor: project.color || "hsl(var(--primary))" }}
                                            >
                                                {pInitials}
                                            </div>
                                        )}
                                        <span className="flex-1 truncate">{project.label}</span>
                                        {currentId === project.value && (
                                            <Check className="h-3.5 w-3.5 text-primary" />
                                        )}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                    {/* Footer: Gestionar proyectos */}
                    <div className="border-t border-border/50 p-1">
                        <button
                            type="button"
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
                            onClick={() => {
                                setOpen(false);
                                router.push('/organization/projects');
                            }}
                        >
                            <Settings className="h-3.5 w-3.5" />
                            <span>Gestionar proyectos</span>
                        </button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ─── Factory ─────────────────────────────────────────────

export function createProjectColumn<TData>(
    options: ProjectColumnOptions<TData> = {}
): ColumnDef<TData, any> {
    const {
        accessorKey = "project_name",
        title = "Proyecto",
        getImageUrl = (row: any) => row.project_image_url,
        getColor = (row: any) => row.project_color,
        enableSorting = true,
        emptyValue = "Sin proyecto",
        size = 160,
        editable = false,
        projectOptions = [],
        onUpdate,
        getProjectId = (row: any) => row.project_id,
    } = options;

    return {
        accessorKey,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const name = row.getValue(accessorKey) as string | null | undefined;
            const imageUrl = getImageUrl(row.original);
            const color = getColor(row.original);

            if (editable && onUpdate) {
                return (
                    <EditableProjectCell
                        row={row.original}
                        name={name || null}
                        imageUrl={imageUrl}
                        color={color}
                        projectOptions={projectOptions}
                        getProjectId={getProjectId}
                        onUpdate={onUpdate}
                        emptyValue={emptyValue}
                    />
                );
            }

            if (!name) {
                return (
                    <span className={cn(CELL_EMPTY_CLASS, "italic")}>
                        {emptyValue}
                    </span>
                );
            }

            const initials = name.substring(0, 2).toUpperCase();

            return (
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 rounded-md border border-border/50">
                        {imageUrl ? (
                            <AvatarImage src={imageUrl} alt={name} className="object-cover" />
                        ) : null}
                        <AvatarFallback
                            className="rounded-md text-[7px] font-bold text-white"
                            style={{ backgroundColor: color || "hsl(var(--primary))" }}
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className={cn(CELL_VALUE_CLASS, "truncate max-w-[160px]")} title={name}>
                        {name}
                    </span>
                </div>
            );
        },
        enableSorting,
        size,
    };
}
