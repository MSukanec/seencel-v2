"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OrganizationActivityLog } from "@/types/organization";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
    User,
    FolderKanban,
    Users,
    CheckSquare,
    FileText,
    Wallet,
    Upload,
    Plus,
    Pencil,
    Trash2,
    Archive,
    RotateCcw,
    Tag,
    Layers,
    Building,
    LucideIcon
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ActivityLogsDataTableProps {
    data: OrganizationActivityLog[];
}

// Module configuration with icons and colors
interface ModuleConfig {
    label: string;
    icon: LucideIcon;
    color: string; // Tailwind classes for badge styling
}

const moduleConfigs: Record<string, ModuleConfig> = {
    'projects': {
        label: 'Proyectos',
        icon: FolderKanban,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'project_data': {
        label: 'Proyectos - Datos',
        icon: FolderKanban,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'project_types': {
        label: 'Proyectos - Tipos',
        icon: Tag,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'project_modalities': {
        label: 'Proyectos - Modalidades',
        icon: Layers,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'contacts': {
        label: 'Contactos',
        icon: Users,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'contact_types': {
        label: 'Contactos - Tipos',
        icon: Tag,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'organization_members': {
        label: 'Organización - Miembros',
        icon: Users,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'organization_data': {
        label: 'Organización - Datos',
        icon: Building,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'tasks': {
        label: 'Tareas',
        icon: CheckSquare,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'design_documents': {
        label: 'Documentos',
        icon: FileText,
        color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
    },
    'financial_movements': {
        label: 'Finanzas - Movimientos',
        icon: Wallet,
        color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
    },
    'import_batches': {
        label: 'Sistema - Importaciones',
        icon: Upload,
        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
    },
    'organizations': {
        label: 'Organización',
        icon: Building,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
    }
};

// Action configuration with icons and colors
interface ActionConfig {
    label: string;
    icon: LucideIcon;
    color: string;
}

const actionConfigs: Record<string, ActionConfig> = {
    'create': {
        label: 'Creó',
        icon: Plus,
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    },
    'add': {
        label: 'Agregó',
        icon: Plus,
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    },
    'update': {
        label: 'Actualizó',
        icon: Pencil,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'delete': {
        label: 'Eliminó',
        icon: Trash2,
        color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    },
    'archive': {
        label: 'Archivó',
        icon: Archive,
        color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700'
    },
    'restore': {
        label: 'Restauró',
        icon: RotateCcw,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'import': {
        label: 'Importó',
        icon: Upload,
        color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
    },
    'unarchive': {
        label: 'Desarchivó',
        icon: RotateCcw,
        color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
    }
};

// Helper to get action verb from full action string (e.g., "create_project" -> "create")
const getActionVerb = (action: string): string => {
    const parts = action.split('_');
    return parts[0] || action;
};

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
                                {log.full_name || log.email || "Sistema"}
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
