"use client";

import { create } from 'zustand';
import { ReactNode, useEffect } from 'react';

// ============================================
// CONTEXT SIDEBAR STORE
// ============================================
// Maneja el contenido del sidebar contextual (panel derecho)
// que puede ser inyectado desde cualquier página.
//
// Two layers:
//   - base: Content set by page components (categories, lessons, etc)
//   - overlay: Temporary content pushed on top (docs, help, etc)
//
// The layout renders: overlay ?? base

interface SidebarLayer {
    content: ReactNode | null;
    title: string | undefined;
}

interface ContextSidebarState {
    // Base layer — set by page components via <ContextSidebar>
    base: SidebarLayer;
    // Overlay layer — pushed on top (docs inline, etc)
    overlay: SidebarLayer | null;

    // Base operations (existing API — backward compatible)
    setContent: (content: ReactNode | null, options?: { title?: string }) => void;
    clearContent: () => void;

    // Overlay operations (new)
    pushOverlay: (content: ReactNode, options?: { title?: string }) => void;
    popOverlay: () => void;
}

export const useContextSidebarStore = create<ContextSidebarState>((set) => ({
    base: { content: null, title: undefined },
    overlay: null,

    setContent: (content, options) => set({
        base: { content, title: options?.title },
    }),

    clearContent: () => set({
        base: { content: null, title: undefined },
        // Also clear overlay when base is cleared (navigation cleanup)
        overlay: null,
    }),

    pushOverlay: (content, options) => set({
        overlay: { content, title: options?.title },
    }),

    popOverlay: () => set({
        overlay: null,
    }),
}));

// ============================================
// HOOKS
// ============================================

/**
 * Hook para acceder al estado del sidebar contextual (base layer)
 */
export function useContextSidebar() {
    const base = useContextSidebarStore(state => state.base);
    const setContent = useContextSidebarStore(state => state.setContent);
    const clearContent = useContextSidebarStore(state => state.clearContent);

    return {
        state: { content: base.content, title: base.title },
        setContent,
        clearContent,
    };
}

/**
 * Hook para solo leer el contenido visible (overlay ?? base).
 * Used by the layout to render the sidebar.
 */
export function useContextSidebarContent() {
    const base = useContextSidebarStore(state => state.base);
    const overlay = useContextSidebarStore(state => state.overlay);

    // Overlay takes priority over base
    const active = overlay ?? base;
    return { content: active.content, title: active.title, hasOverlay: !!overlay };
}

/**
 * Hook for overlay operations (docs inline, help, etc)
 */
export function useContextSidebarOverlay() {
    const overlay = useContextSidebarStore(state => state.overlay);
    const pushOverlay = useContextSidebarStore(state => state.pushOverlay);
    const popOverlay = useContextSidebarStore(state => state.popOverlay);

    return { hasOverlay: !!overlay, pushOverlay, popOverlay };
}

// ============================================
// COMPONENT - Inyector de contenido (base layer)
// ============================================

/**
 * Component to inject content into the context sidebar (base layer).
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

