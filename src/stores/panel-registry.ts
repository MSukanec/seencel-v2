import dynamic from 'next/dynamic';
import type { PanelSize } from './panel-store';
import type { LucideIcon } from 'lucide-react';
import {
    Package,
    CreditCard,
    ShoppingCart,
    Building2,
    FileText,
    ArrowLeftRight,
    Receipt,
    Users,
    UserPlus,
    UserCheck,
    Mail,
    Upload,
    CalendarDays,
} from 'lucide-react';

export interface PanelQuickAction {
    /** Label shown in command bar, e.g. "Nuevo Proyecto" */
    label: string;
    /** Lucide icon for the command bar item */
    icon: LucideIcon;
    /** Search keywords for fuzzy matching */
    keywords: string;
    /** Default props passed to openPanel when triggered from command bar */
    defaultProps?: Record<string, any>;
}

export interface PanelRegistryItem {
    component: React.ComponentType<any>;
    defaultOptions?: {
        title?: string;
        description?: string;
        size?: PanelSize;
        overlay?: boolean;
    };
    /**
     * If present, this panel appears as a Quick Action in the Command Bar (Cmd+K).
     * Only creation forms should have this — detail panels should NOT.
     */
    quickAction?: PanelQuickAction;
}

/**
 * Panel Registry — Centralized mapping of panel IDs to lazy-loaded components.
 * 
 * Each form/view that can be opened as a panel is registered here.
 * Components are lazy-loaded via next/dynamic for code splitting.
 * 
 * Usage:
 *   openPanel('material-form', { mode: 'create', organizationId: '...' })
 * 
 * The component receives ALL props passed as the second argument to openPanel().
 * 
 * Quick Actions:
 *   Panels with a `quickAction` property appear automatically in the
 *   Command Bar (Cmd+K) as creation shortcuts, available from any page.
 */
export const PANEL_REGISTRY: Record<string, PanelRegistryItem> = {
    // ========================================================================
    // Materials Feature
    // ========================================================================
    'material-form': {
        component: dynamic(() => import('@/features/materials/forms/material-form').then(mod => ({ default: mod.MaterialForm }))),
        defaultOptions: { size: 'md' },
        quickAction: {
            label: "Nuevo Material",
            icon: Package,
            keywords: "crear material insumo recurso catálogo",
            defaultProps: { mode: 'create' },
        },
    },
    'material-type-form': {
        component: dynamic(() => import('@/features/materials/forms/material-type-form').then(mod => ({ default: mod.MaterialTypeFormDialog }))),
        defaultOptions: { size: 'md' },
    },
    'material-payment-form': {
        component: dynamic(() => import('@/features/materials/forms/material-payment-form').then(mod => ({ default: mod.MaterialPaymentForm }))),
        defaultOptions: { size: 'lg' },
        quickAction: {
            label: "Nuevo Pago de Material",
            icon: CreditCard,
            keywords: "crear pago material factura proveedor",
            defaultProps: { mode: 'create' },
        },
    },
    'purchase-order-form': {
        component: dynamic(() => import('@/features/materials/forms/purchase-order-form').then(mod => ({ default: mod.PurchaseOrderForm }))),
        defaultOptions: { size: 'lg' },
        quickAction: {
            label: "Nueva Orden de Compra",
            icon: ShoppingCart,
            keywords: "crear orden compra pedido proveedor",
            defaultProps: { mode: 'create' },
        },
    },
    'category-form': {
        component: dynamic(() => import('@/features/admin/components/forms/category-form').then(mod => ({ default: mod.CategoryForm }))),
        defaultOptions: { size: 'md' },
    },

    // ========================================================================
    // Projects Feature
    // ========================================================================
    'projects-project-form': {
        component: dynamic(() => import('@/features/projects/forms/projects-project-form').then(mod => ({ default: mod.ProjectsProjectForm }))),
        defaultOptions: { size: 'md' },
        quickAction: {
            label: "Nuevo Proyecto",
            icon: Building2,
            keywords: "crear proyecto obra construcción",
            defaultProps: { mode: 'create' },
        },
    },
    'projects-type-form': {
        component: dynamic(() => import('@/features/projects/forms/projects-type-form').then(mod => ({ default: mod.ProjectsTypeForm }))),
        defaultOptions: { size: 'sm' },
    },
    'projects-modality-form': {
        component: dynamic(() => import('@/features/projects/forms/projects-modality-form').then(mod => ({ default: mod.ProjectsModalityForm }))),
        defaultOptions: { size: 'sm' },
    },

    // ========================================================================
    // Technical Catalog
    // ========================================================================
    'unit-form': {
        component: dynamic(() => import('@/features/units/forms/unit-form').then(mod => ({ default: mod.UnitForm }))),
        defaultOptions: { size: 'sm' },
    },

    // ========================================================================
    // Economic Indices (Settings > Finance)
    // ========================================================================
    'index-type-form': {
        component: dynamic(() => import('@/features/advanced/forms/advanced-index-type-form').then(mod => ({ default: mod.AdvancedIndexTypeForm }))),
        defaultOptions: { size: 'lg' },
    },

    // ========================================================================
    // Quotes Feature
    // ========================================================================
    'quote-form': {
        component: dynamic(() => import('@/features/quotes/forms/quote-form').then(mod => ({ default: mod.QuoteForm }))),
        defaultOptions: { size: 'md' },
        quickAction: {
            label: "Nuevo Presupuesto",
            icon: FileText,
            keywords: "crear presupuesto cotización quote",
            defaultProps: { mode: 'create' },
        },
    },
    'quote-item-form': {
        component: dynamic(() => import('@/features/quotes/forms/quote-item-form').then(mod => ({ default: mod.QuoteItemForm }))),
        defaultOptions: { size: 'md' },
    },

    // ========================================================================
    // Finance Feature
    // ========================================================================
    'finance-movement-form': {
        component: dynamic(() => import('@/features/finance/forms/finance-movement-form').then(mod => ({ default: mod.FinanceMovementForm }))),
        defaultOptions: { size: 'lg' },
        quickAction: {
            label: "Nuevo Movimiento",
            icon: ArrowLeftRight,
            keywords: "crear movimiento ingreso egreso transferencia finanzas",
            defaultProps: { mode: 'create' },
        },
    },
    'movement-detail': {
        component: dynamic(() => import('@/features/finance/components/movement-detail-panel').then(mod => ({ default: mod.MovementDetailPanel }))),
        defaultOptions: { size: 'md' },
        // No quickAction — this is a detail panel, not a creation form
    },

    // ========================================================================
    // Clients Feature
    // ========================================================================
    'clients-client-form': {
        component: dynamic(() => import('@/features/clients/forms/clients-form').then(mod => ({ default: mod.ClientForm }))),
        defaultOptions: { size: 'md' },
        quickAction: {
            label: "Vincular Cliente",
            icon: UserPlus,
            keywords: "vincular cliente proyecto contacto",
        },
    },
    'clients-invite-portal-form': {
        component: dynamic(() => import('@/features/clients/forms/invite-client-portal-form').then(mod => ({ default: mod.InviteClientPortalForm }))),
        defaultOptions: { size: 'lg' },
    },
    'client-payment-form': {
        component: dynamic(() => import('@/features/clients/forms/clients-payment-form').then(mod => ({ default: mod.ClientsPaymentForm }))),
        defaultOptions: { size: 'lg' },
    },

    // ========================================================================
    // Team Feature
    // ========================================================================
    'team-invite-member-form': {
        component: dynamic(() => import('@/features/team/forms/team-invite-member-form').then(mod => ({ default: mod.InviteMemberForm }))),
        defaultOptions: { size: 'md' },
    },
    'team-add-external-form': {
        component: dynamic(() => import('@/features/team/forms/team-add-external-form').then(mod => ({ default: mod.AddExternalCollaboratorForm }))),
        defaultOptions: { size: 'md' },
    },

    // ========================================================================
    // External Actors Feature
    // ========================================================================
    'collaborator-form': {
        component: dynamic(() => import('@/features/external-actors/forms/collaborator-form').then(mod => ({ default: mod.CollaboratorForm }))),
        defaultOptions: { size: 'md' },
    },

    // ========================================================================
    // General Costs Feature
    // ========================================================================
    'general-cost-category-form': {
        component: dynamic(() => import('@/features/general-costs/forms/general-costs-category-form').then(mod => ({ default: mod.GeneralCostsCategoryForm }))),
        defaultOptions: { size: 'sm' },
    },
    'general-cost-concept-form': {
        component: dynamic(() => import('@/features/general-costs/forms/general-costs-concept-form').then(mod => ({ default: mod.GeneralCostsConceptForm }))),
        defaultOptions: { size: 'md' },
    },
    'general-cost-payment-form': {
        component: dynamic(() => import('@/features/general-costs/forms/general-costs-payment-form').then(mod => ({ default: mod.GeneralCostsPaymentForm }))),
        defaultOptions: { size: 'lg' },
        quickAction: {
            label: "Nuevo Gasto General",
            icon: Receipt,
            keywords: "crear gasto general overhead pago costo fijo",
            defaultProps: { mode: 'create' },
        },
    },
    'general-cost-concept-detail': {
        component: dynamic(() => import('@/features/general-costs/components/general-cost-concept-detail-panel').then(mod => ({ default: mod.GeneralCostConceptDetailPanel }))),
        defaultOptions: { size: 'lg' },
        // No quickAction — detail panel
    },

    // ========================================================================
    // Contacts Feature
    // ========================================================================
    'contact-form': {
        component: dynamic(() => import('@/features/contact/forms/contact-form').then(mod => ({ default: mod.ContactForm }))),
        defaultOptions: { size: 'md' },
        quickAction: {
            label: "Nuevo Contacto",
            icon: Users,
            keywords: "crear contacto proveedor cliente persona",
            defaultProps: { mode: 'create' },
        },
    },
    'contact-category-form': {
        component: dynamic(() => import('@/features/contact/components/contact-category-form').then(mod => ({ default: mod.ContactCategoryForm }))),
        defaultOptions: { size: 'sm' },
    },

    // ========================================================================
    // Files Feature
    // ========================================================================
    'files-upload-form': {
        component: dynamic(() => import('@/features/files/forms/files-upload-form').then(mod => ({ default: mod.FilesUploadForm }))),
        defaultOptions: {
            title: 'Subir Archivos',
            description: 'Arrastrá o seleccioná los archivos que querés subir a tu organización.',
            size: 'md',
        },
        quickAction: {
            label: "Subir Documento",
            icon: Upload,
            keywords: "subir documento archivo upload media",
        },
    },

    // ========================================================================
    // Planner Feature
    // ========================================================================
    'planner-event-form': {
        component: dynamic(() => import('@/features/planner/forms/calendar-event-form').then(mod => ({ default: mod.CalendarEventForm }))),
        defaultOptions: { size: 'md' },
        quickAction: {
            label: "Nueva Actividad",
            icon: CalendarDays,
            keywords: "crear actividad evento tarea reunión planificador calendario kanban",
            defaultProps: { mode: 'create' },
        },
    },
    'planner-list-form': {
        component: dynamic(() => import('@/features/planner/forms/kanban-list-form').then(mod => ({ default: mod.KanbanListForm }))),
        defaultOptions: { size: 'sm' },
    },

    // ========================================================================
    // Academy Feature
    // ========================================================================
    'academy-marker-form': {
        component: dynamic(() => import('@/features/academy/forms/marker-form').then(mod => ({ default: mod.MarkerForm }))),
        defaultOptions: { size: 'md' },
    },
    'enrollment-form': {
        component: dynamic(() => import('@/features/academy/forms/enrollment-form').then(mod => ({ default: mod.EnrollmentForm }))),
        defaultOptions: { size: 'md' },
    },

    // ========================================================================
    // Forum Feature
    // ========================================================================
    'forum-thread-form': {
        component: dynamic(() => import('@/components/shared/forum/forum-thread-form').then(mod => ({ default: mod.ForumThreadForm }))),
        defaultOptions: { size: 'md' },
    },
    'forum-post-form': {
        component: dynamic(() => import('@/components/shared/forum/forum-post-form').then(mod => ({ default: mod.ForumPostForm }))),
        defaultOptions: { size: 'md' },
    },

    // ========================================================================
    // Tasks Feature (Catálogo Técnico)
    // ========================================================================
    'tasks-form': {
        component: dynamic(() => import('@/features/tasks/forms/tasks-form').then(mod => ({ default: mod.TasksForm }))),
        defaultOptions: { size: 'lg' },
    },
    'tasks-parametric-form': {
        component: dynamic(() => import('@/features/tasks/forms/tasks-parametric-form').then(mod => ({ default: mod.TasksParametricForm }))),
        defaultOptions: { size: 'lg' },
    },
    'tasks-bulk-edit-form': {
        component: dynamic(() => import('@/features/tasks/forms/tasks-bulk-edit-form').then(mod => ({ default: mod.TasksBulkEditForm }))),
        defaultOptions: { size: 'md' },
    },
    'tasks-division-form': {
        component: dynamic(() => import('@/features/tasks/forms/tasks-division-form').then(mod => ({ default: mod.TasksDivisionForm }))),
        defaultOptions: { size: 'md' },
    },

    // ========================================================================
    // Shared / System
    // ========================================================================
    'feedback-form': {
        component: dynamic(() => import('@/components/shared/forms/feedback-form').then(mod => ({ default: mod.FeedbackForm }))),
        defaultOptions: { size: 'sm' },
    },
};

/**
 * Returns all panels that have a quickAction defined.
 * Used by the Command Bar to dynamically render creation shortcuts.
 */
export function getQuickActionPanels(): Array<{ panelId: string; quickAction: PanelQuickAction }> {
    return Object.entries(PANEL_REGISTRY)
        .filter(([, item]) => item.quickAction != null)
        .map(([panelId, item]) => ({
            panelId,
            quickAction: item.quickAction!,
        }));
}
