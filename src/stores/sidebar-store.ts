"use client";

import { create } from 'zustand';
import { ReactNode, useEffect } from 'react';

// ============================================
// CONTEXT SIDEBAR STORE
// ============================================
// Maneja el contenido del sidebar contextual (panel derecho)
// que puede ser inyectado desde cualquier página

interface ContextSidebarState {
    content: ReactNode | null;
    title: string | undefined;

    setContent: (content: ReactNode | null, options?: { title?: string }) => void;
    clearContent: () => void;
}

export const useContextSidebarStore = create<ContextSidebarState>((set) => ({
    content: null,
    title: undefined,

    setContent: (content, options) => set({
        content,
        title: options?.title,
    }),

    clearContent: () => set({
        content: null,
        title: undefined,
    }),
}));

// ============================================
// HOOKS
// ============================================

/**
 * Hook para acceder al estado del sidebar contextual
 */
export function useContextSidebar() {
    const content = useContextSidebarStore(state => state.content);
    const title = useContextSidebarStore(state => state.title);
    const setContent = useContextSidebarStore(state => state.setContent);
    const clearContent = useContextSidebarStore(state => state.clearContent);

    return {
        state: { content, title },
        setContent,
        clearContent,
    };
}

/**
 * Hook para solo leer el contenido (para el layout)
 */
export function useContextSidebarContent() {
    const content = useContextSidebarStore(state => state.content);
    const title = useContextSidebarStore(state => state.title);
    return { content, title };
}

// ============================================
// COMPONENT - Inyector de contenido
// ============================================

/**
 * Component to inject content into the context sidebar.
 * The sidebar is resizable by the user via drag.
 * 
 * Usage:
 * ```tsx
 * <ContextSidebar title="Rubros">
 *   <DivisionsSidebar ... />
 * </ContextSidebar>
 * ```
 */
interface ContextSidebarProps {
    children: ReactNode;
    title?: string;
}

export function ContextSidebar({ children, title }: ContextSidebarProps) {
    const { setContent, clearContent } = useContextSidebarStore();

    useEffect(() => {
        setContent(children, { title });
        return () => {
            clearContent();
        };
    }, [children, title, setContent, clearContent]);

    // This component doesn't render anything directly
    // It injects its children into the layout's sidebar slot
    return null;
}
