
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
    NotebookPen,
    CalendarDays
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
        label: 'un proyecto',
        singularLabel: 'proyecto',
        icon: FolderKanban,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'project_data': {
        label: 'los datos del proyecto',
        singularLabel: 'datos del proyecto',
        icon: FolderKanban,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'project_types': {
        label: 'un tipo de proyecto',
        singularLabel: 'tipo de proyecto',
        icon: Tag,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'project_modalities': {
        label: 'una modalidad de proyecto',
        singularLabel: 'modalidad de proyecto',
        icon: Layers,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'contacts': {
        label: 'un contacto',
        singularLabel: 'contacto',
        icon: Users,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'contact_categories': {
        label: 'una categoría de contacto',
        singularLabel: 'categoría de contacto',
        icon: Tag,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'client_payments': {
        label: 'un pago de cliente',
        singularLabel: 'pago de cliente',
        icon: Wallet,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'site_logs': {
        label: 'una entrada de bitácora',
        singularLabel: 'entrada de bitácora',
        icon: NotebookPen,
        color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800'
    },
    'site_log_types': {
        label: 'un tipo de bitácora',
        singularLabel: 'tipo de bitácora',
        icon: Tag,
        color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800'
    },
    'organization_members': {
        label: 'un miembro',
        singularLabel: 'miembro',
        icon: Users,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'organization_data': {
        label: 'los datos de la organización',
        singularLabel: 'datos de la organización',
        icon: Building,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'tasks': {
        label: 'una tarea',
        singularLabel: 'tarea',
        icon: CheckSquare,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'design_documents': {
        label: 'un documento',
        singularLabel: 'documento',
        icon: FileText,
        color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
    },
    'financial_movements': {
        label: 'un movimiento',
        singularLabel: 'movimiento financiero',
        icon: Wallet,
        color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
    },
    'import_batches': {
        label: 'una importación',
        singularLabel: 'importación',
        icon: Upload,
        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
    },
    'general_cost_categories': {
        label: 'una categoría de gasto',
        singularLabel: 'categoría de gasto',
        icon: Tag,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'general_costs': {
        label: 'un gasto general',
        singularLabel: 'gasto general',
        icon: Receipt,
        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
    },
    'general_costs_payments': {
        label: 'un pago de gasto',
        singularLabel: 'pago de gasto',
        icon: Wallet,
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    },
    'organizations': {
        label: 'la organización',
        singularLabel: 'organización',
        icon: Building,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'organization': {
        label: 'la organización',
        singularLabel: 'organización',
        icon: Building,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    // Planner / Tareas Module
    'kanban_boards': {
        label: 'un tablero de tareas',
        singularLabel: 'tablero de tareas',
        icon: Kanban,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_cards': {
        label: 'una tarea',
        singularLabel: 'tarea',
        icon: SquareKanban,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_lists': {
        label: 'una columna del tablero',
        singularLabel: 'columna del tablero',
        icon: Kanban,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_labels': {
        label: 'una etiqueta del tablero',
        singularLabel: 'etiqueta del tablero',
        icon: Tag,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    'kanban_comments': {
        label: 'un comentario en tarea',
        singularLabel: 'comentario en tarea',
        icon: MessageSquare,
        color: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800'
    },
    // Calendar Module
    'calendar_events': {
        label: 'un evento',
        singularLabel: 'evento',
        icon: CalendarDays,
        color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800'
    },
    // Subcontracts Module
    'subcontracts': {
        label: 'un subcontrato',
        singularLabel: 'subcontrato',
        icon: Receipt,
        color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
    },
    'subcontract_payments': {
        label: 'un pago de subcontrato',
        singularLabel: 'pago de subcontrato',
        icon: Wallet,
        color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
    },
    'subcontract_adjustments': {
        label: 'un ajuste de subcontrato',
        singularLabel: 'ajuste de subcontrato',
        icon: ArrowRightLeft,
        color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
    },
    // Materials Module
    'materials': {
        label: 'un material',
        singularLabel: 'material',
        icon: Layers,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'material_purchases': {
        label: 'una compra de material',
        singularLabel: 'compra de material',
        icon: Receipt,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    // Quotes Module
    'quotes': {
        label: 'un presupuesto',
        singularLabel: 'presupuesto',
        icon: FileText,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
    },
    'quote_items': {
        label: 'un item de presupuesto',
        singularLabel: 'item de presupuesto',
        icon: FileText,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
    },
    // Tasks & Recipes
    'task_recipe_materials': {
        label: 'un material en una receta de tarea',
        singularLabel: 'material de receta',
        icon: Layers,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'task_recipe_labor': {
        label: 'mano de obra en una receta de tarea',
        singularLabel: 'mano de obra de receta',
        icon: Users,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'task_recipe_equipment': {
        label: 'un equipo en una receta de tarea',
        singularLabel: 'equipo de receta',
        icon: Layers,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'task_recipe_subcontracts': {
        label: 'un subcontrato en una receta de tarea',
        singularLabel: 'subcontrato de receta',
        icon: Receipt,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'task_dependencies': {
        label: 'una dependencia de tarea',
        singularLabel: 'dependencia de tarea',
        icon: CheckSquare,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'construction_tasks': {
        label: 'una tarea de construcción',
        singularLabel: 'tarea de construcción',
        icon: CheckSquare,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    'task_kinds': {
        label: 'un tipo de tarea',
        singularLabel: 'tipo de tarea',
        icon: Tag,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    // Labor
    'labor_categories': {
        label: 'una categoría laboral',
        singularLabel: 'categoría laboral',
        icon: Users,
        color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800'
    },
    'labor_levels': {
        label: 'un nivel laboral',
        singularLabel: 'nivel laboral',
        icon: Users,
        color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800'
    },
    'labor_roles': {
        label: 'un rol laboral',
        singularLabel: 'rol laboral',
        icon: Users,
        color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800'
    },
    'labor_types': {
        label: 'un tipo de mano de obra',
        singularLabel: 'tipo de mano de obra',
        icon: Users,
        color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800'
    },
    // Equipment
    'equipment': {
        label: 'un equipo',
        singularLabel: 'equipo',
        icon: Layers,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
    },
    'equipment_categories': {
        label: 'una categoría de equipo',
        singularLabel: 'categoría de equipo',
        icon: Tag,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
    },
    // Finance Infrastructure
    'wallets': {
        label: 'una billetera',
        singularLabel: 'billetera',
        icon: Wallet,
        color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
    },
    'currencies': {
        label: 'una moneda',
        singularLabel: 'moneda',
        icon: ArrowRightLeft,
        color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
    },
    // Units & Catalog
    'units': {
        label: 'una unidad',
        singularLabel: 'unidad',
        icon: Tag,
        color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700'
    },
    'material_categories': {
        label: 'una categoría de material',
        singularLabel: 'categoría de material',
        icon: Tag,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    'material_payments': {
        label: 'un pago de material',
        singularLabel: 'pago de material',
        icon: Wallet,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    // Construction Elements
    'construction_elements': {
        label: 'un elemento constructivo',
        singularLabel: 'elemento constructivo',
        icon: Building,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    'construction_divisions': {
        label: 'un rubro',
        singularLabel: 'rubro',
        icon: Layers,
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    },
    // Clients
    'clients': {
        label: 'un cliente',
        singularLabel: 'cliente',
        icon: Users,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    'client_commitments': {
        label: 'un compromiso de cliente',
        singularLabel: 'compromiso de cliente',
        icon: FileText,
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    // Capital
    'capital_contributions': {
        label: 'un aporte de capital',
        singularLabel: 'aporte de capital',
        icon: Wallet,
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    },
    'capital_participants': {
        label: 'un participante de capital',
        singularLabel: 'participante de capital',
        icon: Users,
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    },
    // Invitations
    'organization_invitations': {
        label: 'una invitación',
        singularLabel: 'invitación',
        icon: Users,
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    // Change Orders
    'change_orders': {
        label: 'una orden de cambio',
        singularLabel: 'orden de cambio',
        icon: FileText,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
    },
    'change_order_items': {
        label: 'un item de orden de cambio',
        singularLabel: 'item de orden de cambio',
        icon: FileText,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
    },
    // Media
    'media_files': {
        label: 'un archivo',
        singularLabel: 'archivo',
        icon: FileText,
        color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700'
    },
    'media_links': {
        label: 'un adjunto',
        singularLabel: 'adjunto',
        icon: FileText,
        color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700'
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

// ============================================================================
// MODULE ROUTES — Maps target_table → dashboard route for deep linking
// ============================================================================
// Used by ActivityWidget to navigate to the relevant page on click.
// Only tables that have a corresponding dashboard page are mapped.
// ============================================================================

export const moduleRoutes: Record<string, string> = {
    'projects': '/organization',
    'project_data': '/organization',
    'tasks': '/organization/tasks',
    'construction_tasks': '/organization/tasks',
    'materials': '/organization/catalog',
    'material_categories': '/organization/catalog',
    'material_purchases': '/organization/materials',
    'material_payments': '/organization/materials',
    'general_costs': '/organization/general-costs',
    'general_costs_payments': '/organization/general-costs',
    'general_cost_categories': '/organization/general-costs',
    'financial_movements': '/organization/finance',
    'client_payments': '/organization/clients',
    'clients': '/organization/clients',
    'client_commitments': '/organization/clients',
    'contacts': '/organization/contacts',
    'subcontracts': '/organization/subcontracts',
    'subcontract_payments': '/organization/subcontracts',
    'quotes': '/organization/quotes',
    'quote_items': '/organization/quotes',
    'change_orders': '/organization/quotes',
    'kanban_boards': '/organization/planner',
    'kanban_cards': '/organization/planner',
    'kanban_lists': '/organization/planner',
    'calendar_events': '/organization/planner',
    'site_logs': '/organization/site-logs',
    'site_log_types': '/organization/site-logs',
    'organization_members': '/organization/team',
    'organization_invitations': '/organization/team',
    'design_documents': '/organization/files',
    'media_files': '/organization/files',
    'media_links': '/organization/files',
    'capital_contributions': '/organization/capital',
    'capital_participants': '/organization/capital',
    'equipment': '/organization/catalog',
    'equipment_categories': '/organization/catalog',
    'labor_categories': '/organization/catalog',
    'labor_levels': '/organization/catalog',
    'labor_roles': '/organization/catalog',
    'labor_types': '/organization/catalog',
    'units': '/organization/catalog',
    'wallets': '/organization/finance',
    'currencies': '/organization/finance',
};
