"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OrganizationActivityLog } from "@/features/team/types";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { createDateColumn, createTextColumn } from "@/components/shared/data-table/columns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { actionConfigs, moduleConfigs, getActionVerb } from "@/config/audit-logs";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";

interface TeamActivityLogsTableProps {
    data: OrganizationActivityLog[];
}


export function TeamActivityLogsTable({ data }: TeamActivityLogsTableProps) {
    const t = useTranslations("ActivityLogs");

    const columns: ColumnDef<OrganizationActivityLog>[] = [
        // Fecha — relative mode "full" para "Hoy", "Ayer", "Hace X días"
        createDateColumn<OrganizationActivityLog>({
            accessorKey: "created_at",
            title: "Fecha",
            showAvatar: false,
            showTime: true,
            relativeMode: "full",
        }),

        // Usuario — inline (custom con avatar + rol)
        {
            accessorKey: "member",
            id: "member",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
            cell: ({ row }) => {
                const log = row.original;
                const isSystem = !log.full_name && !log.email;

                if (isSystem) {
                    return (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-muted-foreground">Sistema</span>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border">
                            <AvatarImage src={log.avatar_url || ""} />
                            <AvatarFallback>
                                <User className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {log.full_name || log.email}
                            </span>
                            {log.role_name && (
                                <span className="text-xs text-muted-foreground">
                                    {log.role_name}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
            sortingFn: (rowA, rowB) => {
                const nameA = rowA.original.full_name || rowA.original.email || "";
                const nameB = rowB.original.full_name || rowB.original.email || "";
                return nameA.localeCompare(nameB);
            },
            filterFn: (row, id, value) => {
                const log = row.original;
                const userName = log.full_name || log.email || "Sistema";
                if (Array.isArray(value)) return value.includes(userName);
                return userName.toLowerCase().includes(String(value).toLowerCase());
            }
        },

        // Módulo — text column con customRender para icon del config
        {
            ...createTextColumn<OrganizationActivityLog>({
                accessorKey: "target_table",
                title: "Módulo",
                muted: true,
                customRender: (value) => {
                    const config = value ? moduleConfigs[value] : null;
                    if (config) {
                        const Icon = config.icon;
                        return (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Icon className="h-3.5 w-3.5" />
                                <span>{config.label}</span>
                            </div>
                        );
                    }
                    return (
                        <span className="text-sm text-muted-foreground capitalize">
                            {value || "-"}
                        </span>
                    );
                },
            }),
            filterFn: (row, id, value) => {
                const rawEntity = row.original.target_table;
                const config = moduleConfigs[rawEntity];
                const entityLabel = config?.label || rawEntity;
                if (Array.isArray(value)) return value.includes(entityLabel);
                return entityLabel.toLowerCase().includes(String(value).toLowerCase());
            },
        },

        // Acción — text column con customRender para icon del config
        {
            ...createTextColumn<OrganizationActivityLog>({
                accessorKey: "action",
                title: "Acción",
                muted: true,
                customRender: (value) => {
                    const actionVerb = value ? getActionVerb(value) : null;
                    const config = actionVerb ? actionConfigs[actionVerb] : null;
                    if (config) {
                        const Icon = config.icon;
                        return (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Icon className="h-3.5 w-3.5" />
                                <span>{config.label}</span>
                            </div>
                        );
                    }
                    return (
                        <span className="text-sm text-muted-foreground capitalize">
                            {value || "-"}
                        </span>
                    );
                },
            }),
            filterFn: (row, id, value) => {
                const actionVerb = getActionVerb(row.original.action);
                if (Array.isArray(value)) return value.includes(actionVerb);
                return actionVerb.toLowerCase().includes(String(value).toLowerCase());
            },
        },

        // Detalles — text column con customRender para metadata parsing
        createTextColumn<OrganizationActivityLog>({
            accessorKey: "metadata",
            title: "Detalles",
            enableSorting: false,
            muted: true,
            customRender: (_value, row) => {
                const metadata = row.metadata as any || {};

                let displayName = metadata.name;
                if (!displayName && (metadata.first_name || metadata.last_name)) {
                    displayName = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ");
                }

                return (
                    <div className="flex flex-col gap-1">
                        {displayName && (
                            <span className="text-sm text-muted-foreground">
                                {displayName}
                            </span>
                        )}
                        {metadata.count && (
                            <span className="text-sm text-muted-foreground">
                                {metadata.count} registros
                            </span>
                        )}
                        {!displayName && !metadata.count && (
                            <span className="text-sm text-muted-foreground italic">
                                -
                            </span>
                        )}
                    </div>
                );
            },
        }),
    ];

    // Compute unique users for the filter
    const uniqueUsers = Array.from(new Set(data.map(log => log.full_name || log.email || "Sistema"))).map(user => ({
        label: user,
        value: user
    }));

    return (
        <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Buscar en actividad..."
            initialSorting={[{ id: "created_at", desc: true }]}
            pageSize={20}
            facetedFilters={[
                {
                    columnId: "member",
                    title: "Usuario",
                    options: uniqueUsers
                },
                {
                    columnId: "target_table",
                    title: "Módulo",
                    options: Object.entries(moduleConfigs).map(([key, config]) => ({
                        label: config.label,
                        value: config.label
                    }))
                },
                {
                    columnId: "action",
                    title: "Acción",
                    options: Object.entries(actionConfigs).map(([key, config]) => ({
                        label: config.label,
                        value: key
                    }))
                }
            ]}
        />
    );
}
