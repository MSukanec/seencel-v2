
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
    LucideIcon,
    NotebookPen
} from "lucide-react";

// Module configuration with icons and colors
export interface ModuleConfig {
    label: string;           // Display label (for badges, etc.)
    singularLabel: string;   // Singular form for natural sentences (e.g., "el proyecto")
    icon: LucideIcon;
    color: string;           // Tailwind classes for badge styling
}

export const moduleConfigs: Record<string, ModuleConfig> = {
    'projects': {
        label: 'Proyecto',
        singularLabel: 'proyecto',
        icon: FolderKanban,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'project_data': {
        label: 'Datos del Proyecto',
        singularLabel: 'datos del proyecto',
        icon: FolderKanban,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'project_types': {
        label: 'Tipo de Proyecto',
        singularLabel: 'tipo de proyecto',
        icon: Tag,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'project_modalities': {
        label: 'Modalidad de Proyecto',
        singularLabel: 'modalidad de proyecto',
        icon: Layers,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'contacts': {
        label: 'Contacto',
        singularLabel: 'contacto',
        icon: Users,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'contact_types': {
        label: 'Tipo de Contacto',
        singularLabel: 'tipo de contacto',
        icon: Tag,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'client_payments': {
        label: 'Pago de Cliente',
        singularLabel: 'pago de cliente',
        icon: Wallet,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'site_logs': {
        label: 'Entrada de Bitácora',
        singularLabel: 'entrada de bitácora',
        icon: NotebookPen,
        color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800'
    },
    'site_log_types': {
        label: 'Tipo de Bitácora',
        singularLabel: 'tipo de bitácora',
        icon: Tag,
        color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800'
    },
    'organization_members': {
        label: 'Miembro',
        singularLabel: 'miembro',
        icon: Users,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'organization_data': {
        label: 'Datos de Organización',
        singularLabel: 'datos de la organización',
        icon: Building,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'tasks': {
        label: 'Tarea',
        singularLabel: 'tarea',
        icon: CheckSquare,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'design_documents': {
        label: 'Documento',
        singularLabel: 'documento',
        icon: FileText,
        color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
    },
    'financial_movements': {
        label: 'Movimiento',
        singularLabel: 'movimiento financiero',
        icon: Wallet,
        color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
    },
    'import_batches': {
        label: 'Importación',
        singularLabel: 'importación',
        icon: Upload,
        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
    },
    'general_cost_categories': {
        label: 'Categoría de Gasto',
        singularLabel: 'categoría de gasto',
        icon: Tag,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'general_costs': {
        label: 'Gasto General',
        singularLabel: 'gasto general',
        icon: Receipt,
        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
    },
    'general_costs_payments': {
        label: 'Pago de Gasto',
        singularLabel: 'pago de gasto',
        icon: Wallet,
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    },
    'organizations': {
        label: 'Organización',
        singularLabel: 'organización',
        icon: Building,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'organization': {
        label: 'Organización',
        singularLabel: 'organización',
        icon: Building,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    // Kanban Module
    'kanban_boards': {
        label: 'Tablero Kanban',
        singularLabel: 'tablero kanban',
        icon: Kanban,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_cards': {
        label: 'Tarjeta Kanban',
        singularLabel: 'tarjeta kanban',
        icon: SquareKanban,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_lists': {
        label: 'Columna Kanban',
        singularLabel: 'columna kanban',
        icon: Kanban,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_labels': {
        label: 'Etiqueta Kanban',
        singularLabel: 'etiqueta kanban',
        icon: Tag,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_comments': {
        label: 'Comentario Kanban',
        singularLabel: 'comentario kanban',
        icon: MessageSquare,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    // Subcontracts Module
    'subcontracts': {
        label: 'Subcontrato',
        singularLabel: 'subcontrato',
        icon: Receipt,
        color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
    },
    'subcontract_payments': {
        label: 'Pago de Subcontrato',
        singularLabel: 'pago de subcontrato',
        icon: Wallet,
        color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
    },
    'subcontract_adjustments': {
        label: 'Ajuste de Subcontrato',
        singularLabel: 'ajuste de subcontrato',
        icon: ArrowRightLeft,
        color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
    },
    // Materials Module
    'materials': {
        label: 'Material',
        singularLabel: 'material',
        icon: Layers,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'material_purchases': {
        label: 'Compra de Material',
        singularLabel: 'compra de material',
        icon: Receipt,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    // Quotes Module
    'quotes': {
        label: 'Presupuesto',
        singularLabel: 'presupuesto',
        icon: FileText,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
    },
    'quote_items': {
        label: 'Item de Presupuesto',
        singularLabel: 'item de presupuesto',
        icon: FileText,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
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
