"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { AdminActivityLog } from "@/actions/admin-actions";
import { ActionConfig, ModuleConfig, actionConfigs, getActionVerb, moduleConfigs } from "@/config/audit-logs";
import { User, Building2, Receipt } from "lucide-react";

interface AdminActivityLogsDataTableProps {
    data: AdminActivityLog[];
}

export function AdminActivityLogsDataTable({ data }: AdminActivityLogsDataTableProps) {
    const columns: ColumnDef<AdminActivityLog>[] = [
        {
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => {
                const date = new Date(row.original.created_at);
                return (
                    <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(date, { addSuffix: true, locale: es })}
                    </span>
                );
            },
        },
        {
            accessorKey: "organization_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Organización" />,
            cell: ({ row }) => {
                const log = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                            <AvatarImage src={log.organization_logo_url || undefined} />
                            <AvatarFallback className="text-xs">
                                {log.organization_name?.[0] || <Building2 className="h-3 w-3" />}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{log.organization_name || "Sin nombre"}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "full_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
            cell: ({ row }) => {
                const log = row.original;
                const isSystem = !log.full_name && !log.email;

                if (isSystem) {
                    return (
                        <div className="flex items-center gap-2">
                            <Badge variant="system" className="h-7 px-2">
                                <Receipt className="h-3.5 w-3.5 mr-1.5" />
                                Sistema
                            </Badge>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                            <AvatarImage src={log.avatar_url || undefined} />
                            <AvatarFallback>
                                {log.full_name?.[0] || <User className="h-3 w-3" />}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                            {log.full_name || log.email}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "action",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Acción" />,
            cell: ({ row }) => {
                const action = row.original.action;
                const verb = getActionVerb(action);
                const config = actionConfigs[verb];

                if (config) {
                    const Icon = config.icon;
                    return (
                        <Badge
                            variant="outline"
                            className={`${config.color} font-medium text-xs gap-1`}
                        >
                            <Icon className="h-3 w-3" />
                            {config.label}
                        </Badge>
                    );
                }

                return (
                    <Badge variant="secondary" className="text-xs">
                        {action}
                    </Badge>
                );
            },
            filterFn: (row, id, filterValue) => {
                const action = row.getValue(id) as string;
                const verb = getActionVerb(action);
                return filterValue.includes(verb);
            },
        },
        {
            accessorKey: "target_table",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Módulo" />,
            cell: ({ row }) => {
                const targetTable = row.original.target_table;
                const config = moduleConfigs[targetTable];

                if (config) {
                    const Icon = config.icon;
                    return (
                        <Badge
                            variant="outline"
                            className={`${config.color} font-medium text-xs gap-1`}
                        >
                            <Icon className="h-3 w-3" />
                            {config.label}
                        </Badge>
                    );
                }

                return (
                    <Badge variant="outline" className="text-xs">
                        {targetTable}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "metadata",
            header: () => <span className="text-xs text-muted-foreground">Detalles</span>,
            cell: ({ row }) => {
                const metadata = row.original.metadata;
                const name = metadata?.name || metadata?.title || metadata?.code || null;
                return name ? (
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {name}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Buscar en logs..."
            pageSize={50}
            facetedFilters={[
                {
                    columnId: "target_table",
                    title: "Módulo",
                    options: Object.entries(moduleConfigs).map(([key, config]) => ({
                        label: config.label,
                        value: key,
                    })),
                },
                {
                    columnId: "action",
                    title: "Acción",
                    options: Object.entries(actionConfigs).map(([key, config]) => ({
                        label: config.label,
                        value: key,
                    })),
                },
            ]}
            initialSorting={[{ id: "created_at", desc: true }]}
        />
    );
}
