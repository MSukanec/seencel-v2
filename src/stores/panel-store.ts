"use client";

import { create } from 'zustand';
import type { LucideIcon } from 'lucide-react';

export type PanelSize = 'sm' | 'md' | 'lg' | 'xl';

const MAX_STACK_DEPTH = 2;

// ============================================================================
// Footer Configuration Types
// ============================================================================

export interface PanelFooterAction {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive' | 'ghost';
    isLoading?: boolean;
    disabled?: boolean;
}

export interface PanelFooterConfig {
    /** Submit button label. Renders Cancel + Submit layout. */
    submitLabel?: string;
    /** Cancel button label. Defaults to "Cancelar". */
    cancelLabel?: string;
    /** Multi-button override (e.g., "Borrador | Guardar | Publicar"). */
    actions?: PanelFooterAction[];
    /** Full custom footer override. */
    customFooter?: React.ReactNode;
}

// ============================================================================
// Panel Meta — what the form defines about itself
// ============================================================================

export interface PanelMeta {
    title?: string;
    description?: string;
    size?: PanelSize;
    icon?: LucideIcon;
    footer?: PanelFooterConfig;
}

// ============================================================================
// Panel Types
// ============================================================================

interface PanelItem {
    id: string;
    panelId: string;       // registry key (e.g. 'material-form')
    formId: string;        // auto-generated for HTML form attribute
    props?: Record<string, unknown>;
    overlay?: boolean;
    // Meta — set by the form itself via setPanelMeta
    title?: string;
    description?: string;
    size?: PanelSize;
    icon?: LucideIcon;
    footer?: PanelFooterConfig;
    isSubmitting?: boolean;
    beforeClose?: () => Promise<boolean> | boolean;
}

// ============================================================================
// Store
// ============================================================================

interface PanelStore {
    stack: PanelItem[];

    // Core actions
    openPanel: (panelId: string, props?: Record<string, unknown>) => void;
    replacePanel: (panelId: string, props?: Record<string, unknown>) => void;
    closePanel: () => Promise<void>;
    closeAll: () => void;

    // Form self-description — forms call this to define their own meta
    setPanelMeta: (meta: PanelMeta) => void;

    // Form-footer bridge
    setSubmitting: (isSubmitting: boolean) => void;

    // Dirty form guard
    setBeforeClose: (handler: (() => Promise<boolean> | boolean) | undefined) => void;
}

const generateId = () => Math.random().toString(36).substring(7);

export const usePanel = create<PanelStore>((set, get) => ({
    stack: [],

    openPanel: (panelId, props) => {
        const { stack } = get();
        const id = generateId();
        const newItem: PanelItem = {
            id,
            panelId,
            formId: `panel-form-${id}`,
            props,
            overlay: true,
            isSubmitting: false,
            beforeClose: undefined,
        };

        if (stack.length >= MAX_STACK_DEPTH) {
            set((state) => {
                const newStack = [...state.stack];
                newStack[newStack.length - 1] = newItem;
                return { stack: newStack };
            });
            return;
        }

        set((state) => ({
            stack: [...state.stack, newItem],
        }));
    },

    replacePanel: (panelId, props) => {
        const id = generateId();
        const newItem: PanelItem = {
            id,
            panelId,
            formId: `panel-form-${id}`,
            props,
            overlay: true,
            isSubmitting: false,
            beforeClose: undefined,
        };

        set((state) => {
            if (state.stack.length === 0) {
                return { stack: [newItem] };
            }
            const newStack = [...state.stack];
            newStack[newStack.length - 1] = newItem;
            return { stack: newStack };
        });
    },

    closePanel: async () => {
        const { stack } = get();
        if (stack.length === 0) return;

        const topPanel = stack[stack.length - 1];
        if (topPanel.beforeClose) {
            const canClose = await topPanel.beforeClose();
            if (!canClose) return;
        }

        set((state) => ({
            stack: state.stack.slice(0, -1),
        }));
    },

    closeAll: () => set({ stack: [] }),

    setPanelMeta: (meta) => {
        set((state) => {
            if (state.stack.length === 0) return state;
            const newStack = [...state.stack];
            const lastIndex = newStack.length - 1;
            newStack[lastIndex] = {
                ...newStack[lastIndex],
                ...meta,
            };
            return { stack: newStack };
        });
    },

    setSubmitting: (isSubmitting) => {
        set((state) => {
            if (state.stack.length === 0) return state;
            const newStack = [...state.stack];
            const lastIndex = newStack.length - 1;
            newStack[lastIndex] = { ...newStack[lastIndex], isSubmitting };
            return { stack: newStack };
        });
    },

    setBeforeClose: (handler) => {
        set((state) => {
            if (state.stack.length === 0) return state;
            const newStack = [...state.stack];
            const lastIndex = newStack.length - 1;
            newStack[lastIndex] = { ...newStack[lastIndex], beforeClose: handler };
            return { stack: newStack };
        });
    },
}));
