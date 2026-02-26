import dynamic from 'next/dynamic';
import type { PanelSize } from './panel-store';

export interface PanelRegistryItem {
    component: React.ComponentType<any>;
    defaultOptions?: {
        title?: string;
        description?: string;
        size?: PanelSize;
        overlay?: boolean;
    };
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
 */
export const PANEL_REGISTRY: Record<string, PanelRegistryItem> = {
    // ========================================================================
    // Materials Feature
    // ========================================================================
    'material-form': {
        component: dynamic(() => import('@/features/materials/forms/material-form').then(mod => ({ default: mod.MaterialForm }))),
        defaultOptions: { size: 'md' },
    },
    'material-type-form': {
        component: dynamic(() => import('@/features/materials/forms/material-type-form').then(mod => ({ default: mod.MaterialTypeFormDialog }))),
        defaultOptions: { size: 'md' },
    },
    'material-payment-form': {
        component: dynamic(() => import('@/features/materials/forms/material-payment-form').then(mod => ({ default: mod.MaterialPaymentForm }))),
        defaultOptions: { size: 'lg' },
    },
    'purchase-order-form': {
        component: dynamic(() => import('@/features/materials/forms/purchase-order-form').then(mod => ({ default: mod.PurchaseOrderForm }))),
        defaultOptions: { size: 'lg' },
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
    // Quotes Feature
    // ========================================================================
    'quote-form': {
        component: dynamic(() => import('@/features/quotes/forms/quote-form').then(mod => ({ default: mod.QuoteForm }))),
        defaultOptions: { size: 'md' },
    },
    'quote-item-form': {
        component: dynamic(() => import('@/features/quotes/forms/quote-item-form').then(mod => ({ default: mod.QuoteItemForm }))),
        defaultOptions: { size: 'md' },
    },
};
