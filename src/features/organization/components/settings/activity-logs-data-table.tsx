"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OrganizationActivityLog } from "@/types/organization";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ActionConfig, ModuleConfig, actionConfigs, moduleConfigs, getActionVerb } from "@/config/audit-logs";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";

interface ActivityLogsDataTableProps {
    data: OrganizationActivityLog[];
}


export function ActivityLogsDataTable({ data }: ActivityLogsDataTableProps) {
    const t = useTranslations("ActivityLogs");

    const columns: ColumnDef<OrganizationActivityLog>[] = [
        {
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => {
                return (
                    <div className="whitespace-nowrap text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true, locale: es })}
                    </div>
                );
            },
            sortingFn: "datetime"
        },
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
                            <Badge variant="outline" className="h-8 px-3">
                                Sistema
                            </Badge>
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
        {
            accessorKey: "target_table",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Módulo" />,
            cell: ({ row }) => {
                const rawEntity = row.original.target_table;
                const config = moduleConfigs[rawEntity];

                if (config) {
                    const Icon = config.icon;
                    return (
                        <Badge variant="outline" className={`font-medium gap-1.5 ${config.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {config.label}
                        </Badge>
                    );
                }

                // Fallback for unknown modules
                return (
                    <Badge variant="outline" className="font-medium capitalize">
                        {rawEntity}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                const rawEntity = row.original.target_table;
                const config = moduleConfigs[rawEntity];
                const entityLabel = config?.label || rawEntity;
                if (Array.isArray(value)) return value.includes(entityLabel);
                return entityLabel.toLowerCase().includes(String(value).toLowerCase());
            }
        },
        {
            accessorKey: "action",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Acción" />,
            cell: ({ row }) => {
                const log = row.original;
                const actionVerb = getActionVerb(log.action);
                const config = actionConfigs[actionVerb];

                if (config) {
                    const Icon = config.icon;
                    return (
                        <Badge variant="outline" className={`font-medium gap-1.5 ${config.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {config.label}
                        </Badge>
                    );
                }

                // Fallback for unknown actions
                return (
                    <span className="text-sm font-medium capitalize">
                        {log.action}
                    </span>
                );
            },
            filterFn: (row, id, value) => {
                const actionVerb = getActionVerb(row.original.action);
                if (Array.isArray(value)) return value.includes(actionVerb);
                return actionVerb.toLowerCase().includes(String(value).toLowerCase());
            }
        },
        {
            id: "details",
            header: "Detalles",
            cell: ({ row }) => {
                const metadata = row.original.metadata as any || {};

                let displayName = metadata.name;
                if (!displayName && (metadata.first_name || metadata.last_name)) {
                    displayName = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ");
                }

                return (
                    <div className="flex flex-col gap-1">
                        {displayName && (
                            <span className="text-sm text-foreground">
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
            }
        },
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
