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
import { Check } from "lucide-react";
import { DataTableColumnHeader } from "../data-table-column-header";
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
    const currentId = getProjectId(row);
    const initials = name ? name.substring(0, 2).toUpperCase() : "?";

    const handleSelect = async (projectId: string) => {
        const newId = projectId === "__none__" ? null : projectId;
        if (newId !== currentId) {
            await onUpdate(row, newId);
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="flex items-center gap-2 cursor-pointer rounded-md px-1.5 py-1 -mx-1.5 transition-all border border-transparent hover:border-dashed hover:border-border hover:bg-[#2a2b2d]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {name ? (
                        <>
                            <Avatar className="h-5 w-5 rounded-full border border-border/50">
                                {imageUrl ? (
                                    <AvatarImage src={imageUrl} alt={name} className="object-cover" />
                                ) : null}
                                <AvatarFallback
                                    className="rounded-full text-[6px] font-bold text-white"
                                    style={{ backgroundColor: color || "hsl(var(--primary))" }}
                                >
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-[450] truncate max-w-[120px]" title={name}>
                                {name}
                            </span>
                        </>
                    ) : (
                        <span className="text-muted-foreground italic text-xs">{emptyValue}</span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <Command>
                    <CommandInput placeholder="Buscar proyecto..." className="h-8 text-xs" />
                    <CommandList>
                        <CommandEmpty className="text-xs text-center py-3">No encontrado</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="__none__"
                                onSelect={() => handleSelect("__none__")}
                                className="flex items-center gap-2 text-xs"
                            >
                                <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                <span className="flex-1 text-muted-foreground">{emptyValue}</span>
                                {!currentId && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
                            </CommandItem>
                            {projectOptions.map((project) => (
                                <CommandItem
                                    key={project.value}
                                    value={project.value}
                                    onSelect={() => handleSelect(project.value)}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: project.color || "hsl(var(--primary))" }}
                                    />
                                    <span className="flex-1">{project.label}</span>
                                    {currentId === project.value && (
                                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
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
                    <span className="text-muted-foreground italic text-xs">
                        {emptyValue}
                    </span>
                );
            }

            const initials = name.substring(0, 2).toUpperCase();

            return (
                <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 rounded-full border border-border/50">
                        {imageUrl ? (
                            <AvatarImage src={imageUrl} alt={name} className="object-cover" />
                        ) : null}
                        <AvatarFallback
                            className="rounded-full text-[6px] font-bold text-white"
                            style={{ backgroundColor: color || "hsl(var(--primary))" }}
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-[450] truncate max-w-[160px]" title={name}>
                        {name}
                    </span>
                </div>
            );
        },
        enableSorting,
        size,
    };
}
