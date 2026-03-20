"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SiteLog, SiteLogType } from "../types";
import {
    createDateColumn,
    createTextColumn,
    createEntityColumn,
    createSeverityColumn,
    createWeatherColumn,
    createVisibilityColumn,
    createFavoriteColumn,
    createProjectColumn,
    type ProjectOption,
} from "@/components/shared/data-table/columns";
import { Paperclip } from "lucide-react";
import { formatDateForDB } from "@/lib/timezone-data";

// ─── Types ───────────────────────────────────────────────

export interface SitelogColumnsConfig {
    logTypes?: SiteLogType[];
    /** Callback for inline field updates */
    onUpdateField?: (row: SiteLog, field: string, value: string | boolean | null) => void;
    /** Show project column (only in org-wide mode, not when project is selected) */
    showProjectColumn?: boolean;
    /** Available projects for the inline selector */
    projectOptions?: ProjectOption[];
}

// ─── Column Definitions ──────────────────────────────────

export function getSitelogColumns(config: SitelogColumnsConfig = {}): ColumnDef<SiteLog>[] {
    const { logTypes = [], onUpdateField, showProjectColumn = false, projectOptions = [] } = config;

    // Build labels map: id → name
    const typeLabels: Record<string, string> = {};
    for (const t of logTypes) {
        typeLabels[t.id] = t.name;
    }

    // Type options for entity column inline editing
    const typeOptions = logTypes.map(t => ({ value: t.id, label: t.name }));

    const editable = !!onUpdateField;

    return [
        // Fecha + Avatar del creador
        createDateColumn<SiteLog>({
            accessorKey: "log_date",
            title: "Fecha",
            showAvatar: true,
            avatarUrlAccessor: (row) => row.author?.user?.avatar_url,
            avatarFallbackAccessor: (row) => row.author?.user?.full_name,
            editable,
            onUpdate: editable ? (row, newDate) => onUpdateField!(row, "log_date", formatDateForDB(newDate)) : undefined,
        }),

        // Proyecto (solo visible en contexto general, sin proyecto seleccionado)
        ...(showProjectColumn ? [{
            ...createProjectColumn<SiteLog>({
                accessorKey: "project_name",
                title: "Proyecto",
                getImageUrl: (row: any) => row.project?.image_url,
                getColor: (row: any) => row.project?.color,
                getProjectId: (row) => row.project_id,
                editable,
                projectOptions,
                onUpdate: editable ? (row, newProjectId) => onUpdateField!(row, "project_id", newProjectId) : undefined,
            }),
            // Override: SiteLog tiene project.name nested, no project_name flat
            accessorKey: undefined as any,
            accessorFn: (row: SiteLog) => (row as any).project?.name || null,
            id: "project_name",
        }] : []),

        // Tipo de bitácora
        createEntityColumn<SiteLog>({
            accessorKey: "entry_type_id",
            title: "Tipo",
            labels: typeLabels,
            emptyValue: "Sin tipo",
            editable,
            entityOptions: typeOptions,
            onUpdate: editable ? (row, newValue) => onUpdateField!(row, "entry_type_id", newValue || null) : undefined,
            manageRoute: { pathname: "/organization/sitelog/settings" },
            manageLabel: "Gestionar tipos",
        }),

        // Contenido (multiline)
        createTextColumn<SiteLog>({
            accessorKey: "comments",
            title: "Contenido",
            multiline: true,
            secondary: true,
            editable,
            onUpdate: editable ? (row, newValue) => onUpdateField!(row, "comments", newValue) : undefined,
        }),

        // Severidad
        createSeverityColumn<SiteLog>({
            accessorKey: "severity",
            editable,
            onUpdate: editable ? (row, newValue) => onUpdateField!(row, "severity", newValue === "none" ? null : newValue) : undefined,
        }),

        // Clima
        createWeatherColumn<SiteLog>({
            accessorKey: "weather",
            editable,
            onUpdate: editable ? (row, newValue) => onUpdateField!(row, "weather", newValue) : undefined,
        }),

        // Visibilidad
        createVisibilityColumn<SiteLog>({
            accessorKey: "is_public",
            editable,
            onUpdate: editable ? (row, newValue) => onUpdateField!(row, "is_public", newValue) : undefined,
        }),

        // Favorito (toggle directo)
        createFavoriteColumn<SiteLog>({
            accessorKey: "is_favorite",
            editable,
            onUpdate: editable ? (row, newValue) => onUpdateField!(row, "is_favorite", newValue) : undefined,
        }),

        // Adjuntos (custom: SiteLog usa media[] en vez de has_attachments)
        {
            id: "attachments",
            header: () => (
                <div className="flex justify-center">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            ),
            cell: ({ row }) => {
                const count = row.original.media?.length || 0;
                if (count === 0) {
                    return (
                        <div className="flex justify-center">
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground/30" />
                        </div>
                    );
                }
                const label = `${count} archivo${count !== 1 ? "s" : ""}`;
                return (
                    <div className="flex items-center justify-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5 text-foreground shrink-0" />
                        <span className="text-xs font-medium text-foreground whitespace-nowrap">
                            {label}
                        </span>
                    </div>
                );
            },
            enableSorting: false,
            size: 100,
            enableHiding: false,
        },
    ];
}
