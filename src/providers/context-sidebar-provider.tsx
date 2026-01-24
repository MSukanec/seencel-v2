"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ContextSidebarState {
    content: ReactNode | null;
    title?: string;
}

interface ContextSidebarContextType {
    state: ContextSidebarState;
    setContent: (content: ReactNode | null, options?: { title?: string }) => void;
    clearContent: () => void;
}

const ContextSidebarContext = createContext<ContextSidebarContextType | undefined>(undefined);

interface ContextSidebarProviderProps {
    children: ReactNode;
}

export function ContextSidebarProvider({ children }: ContextSidebarProviderProps) {
    const [state, setState] = useState<ContextSidebarState>({
        content: null,
        title: undefined,
    });

    const setContent = useCallback((content: ReactNode | null, options?: { title?: string }) => {
        setState({
            content,
            title: options?.title,
        });
    }, []);

    const clearContent = useCallback(() => {
        setState({ content: null, title: undefined });
    }, []);

    return (
        <ContextSidebarContext.Provider value={{ state, setContent, clearContent }}>
            {children}
        </ContextSidebarContext.Provider>
    );
}

export function useContextSidebar() {
    const context = useContext(ContextSidebarContext);
    if (context === undefined) {
        throw new Error("useContextSidebar must be used within a ContextSidebarProvider");
    }
    return context;
}

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
    const { setContent, clearContent } = useContextSidebar();

    React.useEffect(() => {
        setContent(children, { title });
        return () => {
            clearContent();
        };
    }, [children, title, setContent, clearContent]);

    // This component doesn't render anything directly
    // It injects its children into the layout's sidebar slot
    return null;
}
