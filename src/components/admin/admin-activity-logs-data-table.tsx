"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { AdminActivityLog } from "@/actions/admin-actions";
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
    Building2,
    LucideIcon
} from "lucide-react";

interface AdminActivityLogsDataTableProps {
    data: AdminActivityLog[];
}

// Module configuration with icons and colors
interface ModuleConfig {
    label: string;
    icon: LucideIcon;
    color: string;
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
        icon: Building2,
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
    'unarchive': {
        label: 'Desarchivó',
        icon: RotateCcw,
        color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
    },
    'import': {
        label: 'Importó',
        icon: Upload,
        color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
    }
};

// Helper to extract verb from action string like "create_project" -> "create"
function extractActionVerb(action: string): string {
    const parts = action.split('_');
    return parts[0] || action;
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
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                            <AvatarImage src={log.avatar_url || undefined} />
                            <AvatarFallback>
                                {log.full_name?.[0] || <User className="h-3 w-3" />}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                            {log.full_name || log.email || "Sistema"}
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
                const verb = extractActionVerb(action);
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
                const verb = extractActionVerb(action);
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
