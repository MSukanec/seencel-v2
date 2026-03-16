"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
    createDateColumn,
    createStatusColumn,
    createEntityColumn,
    createTextColumn,
    createAddressColumn,
    type StatusOption,
} from "@/components/shared/data-table/columns";
import { EDITABLE_CELL_CLASS } from "@/components/shared/data-table/columns/column-styles";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ColorChip } from "@/components/shared/chips";
import { type AddressData } from "@/components/shared/popovers";
import { Project } from "@/types/project";
import { Layers, FolderCog } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Status Config ──────────────────────────────────────
export const PROJECT_STATUS_CONFIG: StatusOption[] = [
    { value: "planning", label: "Planificación", variant: "info" },
    { value: "active", label: "Activo", variant: "warning" },
    { value: "inactive", label: "Inactivo", variant: "neutral" },
    { value: "completed", label: "Completado", variant: "positive" },
];

export const PROJECT_STATUS_OPTIONS = PROJECT_STATUS_CONFIG.map(
    ({ value, label }) => ({ label, value })
);

// ─── Project Name Cell (avatar + inline editable text) ──

function ProjectNameCell({
    project,
    name,
    avatar,
    onUpdate,
}: {
    project: Project;
    name: string;
    avatar: React.ReactNode;
    onUpdate: (newName: string) => Promise<void> | void;
}) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(name);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleStartEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(name);
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 10);
    };

    const handleSave = () => {
        setIsEditing(false);
        if (editValue !== name && editValue.trim()) {
            onUpdate(editValue.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); handleSave(); }
        if (e.key === "Escape") { setIsEditing(false); }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {avatar}
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    placeholder="Nombre del proyecto..."
                    className={cn(
                        "flex-1 h-7 px-2 text-sm bg-background border border-border rounded-md",
                        "focus:outline-none focus:ring-1 focus:ring-ring",
                    )}
                />
            </div>
        );
    }

    return (
        <button
            className={cn("flex items-center gap-2", EDITABLE_CELL_CLASS)}
            onClick={handleStartEditing}
        >
            {avatar}
            <span className="text-sm font-medium truncate">{name || "Sin nombre"}</span>
        </button>
    );
}

// ─── Column Factory ─────────────────────────────────────

interface ProjectColumnsOptions {
    onInlineUpdate?: (row: Project, updates: Record<string, any>) => Promise<void> | void;
    typeOptions?: { value: string; label: string }[];
    modalityOptions?: { value: string; label: string }[];
    onNavigateToProject?: (project: Project) => void;
}

export function getProjectColumns(
    options: ProjectColumnsOptions = {}
): ColumnDef<Project>[] {
    const { onInlineUpdate, typeOptions = [], modalityOptions = [], onNavigateToProject } = options;

    // Build image URL helper
    const getImageUrl = (row: Project) => {
        if (row.image_bucket && row.image_path) {
            return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${row.image_bucket}/${row.image_path}`;
        }
        return row.image_url || null;
    };

    return [
        // 1. Estado — inline editable, con label
        createStatusColumn<Project>({
            accessorKey: "status",
            title: "Estado",
            options: PROJECT_STATUS_CONFIG,
            showLabel: true,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { status: newValue })
                : undefined,
        }),
        // 2. Proyecto — avatar + nombre editable inline
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Proyecto" />,
            size: 220,
            enableHiding: false,
            enableSorting: true,
            meta: { fillWidth: true },
            cell: ({ row }) => {
                const project = row.original;
                const name = project.name || "";
                const imageUrl = getImageUrl(project);
                const color = project.color;
                const initials = name ? name.substring(0, 2).toUpperCase() : "?";

                const avatarEl = (
                    <Avatar className="h-6 w-6 rounded-md border border-border/50 shrink-0">
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
                );

                if (onInlineUpdate) {
                    return (
                        <ProjectNameCell
                            project={project}
                            name={name}
                            avatar={avatarEl}
                            onUpdate={(newName) => onInlineUpdate(project, { name: newName })}
                        />
                    );
                }

                return (
                    <div className="flex items-center gap-2">
                        {avatarEl}
                        <span className="text-sm font-medium truncate">{name || "Sin nombre"}</span>
                    </div>
                );
            },
        },
        // 3. Código — inline editable
        createTextColumn<Project>({
            accessorKey: "code",
            title: "Código",
            emptyValue: "—",
            size: 100,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { code: newValue })
                : undefined,
        }),
        // 3. Tipo — entity column, inline editable
        createEntityColumn<Project>({
            accessorKey: "project_type_name",
            title: "Tipo",
            emptyValue: "Sin tipo",
            icon: Layers,
            editable: !!onInlineUpdate && typeOptions.length > 0,
            entityOptions: typeOptions.map(o => ({
                value: o.label,
                label: o.label,
            })),
            editSearchPlaceholder: "Buscar tipo...",
            emptySearchMessage: "No hay tipos creados.",
            manageRoute: { pathname: "/organization/projects/settings" as const },
            manageLabel: "Gestionar tipos",
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { project_type_name: newValue })
                : undefined,
        }),
        // 4. Modalidad — entity column, inline editable
        createEntityColumn<Project>({
            accessorKey: "project_modality_name",
            title: "Modalidad",
            emptyValue: "Sin modalidad",
            icon: FolderCog,
            editable: !!onInlineUpdate && modalityOptions.length > 0,
            entityOptions: modalityOptions.map(o => ({
                value: o.label,
                label: o.label,
            })),
            editSearchPlaceholder: "Buscar modalidad...",
            emptySearchMessage: "No hay modalidades creadas.",
            manageRoute: { pathname: "/organization/projects/settings" as const },
            manageLabel: "Gestionar modalidades",
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { project_modality_name: newValue })
                : undefined,
        }),
        // 5. Color — con ColorChip popover editable
        {
            accessorKey: "color",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Color" />,
            size: 120,
            enableSorting: false,
            cell: ({ row }) => {
                const project = row.original;
                const color = project.color || "";

                if (!onInlineUpdate) {
                    return color ? (
                        <div className="flex items-center gap-1.5">
                            <div
                                className="h-3.5 w-3.5 rounded-full ring-1 ring-border/30 shrink-0"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-muted-foreground font-mono uppercase">{color}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                    );
                }

                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <ColorChip
                            value={color}
                            onChange={(newColor) => onInlineUpdate(project, { color: newColor })}
                            allowNone
                            emptyLabel="Sin color"
                        />
                    </div>
                );
            },
        },
        // 7. Ubicación — address column con inline editing
        createAddressColumn<Project>({
            accessorKey: "city",
            title: "Ubicación",
            emptyValue: "Sin ubicación",
            editable: !!onInlineUpdate,
            getAddressData: (row) => {
                if (!row.city && !row.country && !row.address) return null;
                return {
                    address: row.address || "",
                    city: row.city || "",
                    state: row.state || "",
                    country: row.country || "",
                    zip_code: row.zip_code || "",
                    lat: row.lat || 0,
                    lng: row.lng || 0,
                    place_id: row.place_id || "",
                } as AddressData;
            },
            onUpdate: onInlineUpdate
                ? (row, data) => onInlineUpdate(row, {
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    zip_code: data.zip_code,
                    lat: data.lat,
                    lng: data.lng,
                    place_id: data.place_id,
                })
                : undefined,
        }),
        // 7. Creado — última columna
        createDateColumn<Project>({
            accessorKey: "created_at",
            title: "Creado",
        }),
    ];
}
