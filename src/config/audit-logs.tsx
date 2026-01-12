
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
    Receipt,
    Kanban,
    SquareKanban,
    MessageSquare,
    CheckCheck,
    ArrowRightLeft,
    LucideIcon
} from "lucide-react";

// Module configuration with icons and colors
export interface ModuleConfig {
    label: string;
    icon: LucideIcon;
    color: string; // Tailwind classes for badge styling
}

export const moduleConfigs: Record<string, ModuleConfig> = {
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
    'general_cost_categories': {
        label: 'Categorías de Gastos',
        icon: Tag,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'general_costs': {
        label: 'Gastos Generales',
        icon: Receipt,
        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
    },
    'general_costs_payments': {
        label: 'Pagos de Gastos',
        icon: Wallet,
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    },
    'organizations': {
        label: 'Organización',
        icon: Building,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'organization': {
        label: 'Organización',
        icon: Building,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    // Kanban Module
    'kanban_boards': {
        label: 'Kanban - Tableros',
        icon: Kanban,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_cards': {
        label: 'Kanban - Tarjetas',
        icon: SquareKanban,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_lists': {
        label: 'Kanban - Columnas',
        icon: Kanban,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_labels': {
        label: 'Kanban - Etiquetas',
        icon: Tag,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_comments': {
        label: 'Kanban - Comentarios',
        icon: MessageSquare,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    }
};

// Action configuration with icons and colors
export interface ActionConfig {
    label: string;
    icon: LucideIcon;
    color: string;
}

export const actionConfigs: Record<string, ActionConfig> = {
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
    },
    'complete': {
        label: 'Completó',
        icon: CheckCheck,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'move': {
        label: 'Movió',
        icon: ArrowRightLeft,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
    }
};

// Helper to get action verb from full action string (e.g., "create_project" -> "create")
export const getActionVerb = (action: string): string => {
    const parts = action.split('_');
    return parts[0] || action;
};
