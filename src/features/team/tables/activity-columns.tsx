"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OrganizationActivityLog } from "@/features/team/types";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { createDateColumn, createTextColumn } from "@/components/shared/data-table/columns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { actionConfigs, moduleConfigs, getActionVerb } from "@/config/audit-logs";
import { User } from "lucide-react";

export const ACTION_OPTIONS = Object.entries(actionConfigs).map(([key, config]) => ({
    label: config.label,
    value: key
}));

export const MODULE_OPTIONS = Object.entries(moduleConfigs).map(([key, config]) => ({
    label: config.displayLabel,
    value: config.displayLabel
}));

export function getActivityColumns(): ColumnDef<OrganizationActivityLog>[] {
    return [
        // Fecha 
        createDateColumn<OrganizationActivityLog>({
            accessorKey: "created_at",
            title: "Fecha",
            showAvatar: false,
            showTime: true,
            relativeMode: "full",
        }),

        // Usuario
        {
            accessorKey: "member",
            id: "member",
            size: 250,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
            cell: ({ row }) => {
                const log = row.original;
                const isSystem = !log.full_name && !log.email;

                if (isSystem) {
                    return (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-muted-foreground">Sistema</span>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border shrink-0">
                            <AvatarImage src={log.avatar_url || ""} />
                            <AvatarFallback>
                                <User className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                                {log.full_name || log.email}
                            </span>
                            {log.role_name && (
                                <span className="text-xs text-muted-foreground truncate">
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

        // Acción 
        {
            ...createTextColumn<OrganizationActivityLog>({
                accessorKey: "action",
                title: "Acción",
                size: 160,
                fillWidth: false,
                muted: true,
                customRender: (value) => {
                    const actionVerb = value ? getActionVerb(value as string) : null;
                    const config = actionVerb ? actionConfigs[actionVerb] : null;
                    if (config) {
                        const Icon = config.icon;
                        return (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{config.label}</span>
                            </div>
                        );
                    }
                    return (
                        <span className="text-sm text-muted-foreground capitalize truncate">
                            {value as string || "-"}
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

        // Herramienta 
        {
            ...createTextColumn<OrganizationActivityLog>({
                accessorKey: "target_table",
                title: "Herramienta",
                size: 160,
                fillWidth: false,
                muted: true,
                customRender: (value) => {
                    const config = value ? moduleConfigs[value as string] : null;
                    if (config) {
                        const Icon = config.icon;
                        return (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{config.displayLabel}</span>
                            </div>
                        );
                    }
                    return (
                        <span className="text-sm text-muted-foreground capitalize truncate">
                            {value as string || "-"}
                        </span>
                    );
                },
            }),
            filterFn: (row, id, value) => {
                const rawEntity = row.original.target_table;
                const config = moduleConfigs[rawEntity];
                const entityLabel = config?.displayLabel || rawEntity;
                if (Array.isArray(value)) return value.includes(entityLabel);
                return entityLabel.toLowerCase().includes(String(value).toLowerCase());
            },
        },

        // Detalles 
        {
            ...createTextColumn<OrganizationActivityLog>({
                accessorKey: "metadata",
                title: "Detalles",
                muted: true,
                customRender: (_value, row) => {
                    const metadata = row.metadata as Record<string, any> || {};

                    let displayName = metadata.name;
                    if (!displayName && (metadata.first_name || metadata.last_name)) {
                        displayName = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ");
                    }

                    return (
                        <div className="flex flex-col gap-1 min-w-0">
                            {displayName && (
                                <span className="text-sm text-muted-foreground truncate">
                                    {displayName}
                                </span>
                            )}
                            {metadata.count && (
                                <span className="text-sm text-muted-foreground truncate">
                                    {metadata.count} registros
                                </span>
                            )}
                            {!displayName && !metadata.count && (
                                <span className="text-sm text-muted-foreground italic truncate">
                                    -
                                </span>
                            )}
                        </div>
                    );
                },
            }),
        }
    ];
}
