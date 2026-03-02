"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SidebarMode } from '@/types/preferences';

export type FontSize = 'smaller' | 'small' | 'default' | 'large' | 'larger';

export type LayoutMode = 'default' | 'sidebar';
export type NavigationContext = 'organization' | 'project' | 'learnings' | 'community' | 'admin' | 'home';

interface LayoutState {
    layoutMode: LayoutMode;
    activeContext: NavigationContext;
    activeProjectId: string | null;
    sidebarMode: SidebarMode;
    sidebarProjectAvatars: boolean;
    headerTitle: React.ReactNode | null;
    fontSize: FontSize;

    actions: {
        setLayoutMode: (mode: LayoutMode) => void;
        setActiveContext: (context: NavigationContext) => void;
        setActiveProjectId: (projectId: string | null) => void;
        setSidebarMode: (mode: SidebarMode) => void;
        setSidebarProjectAvatars: (enabled: boolean) => void;
        setHeaderTitle: (title: React.ReactNode | null) => void;
        setFontSize: (size: FontSize) => void;
    };
}

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set) => ({
            layoutMode: 'sidebar',
            activeContext: 'home',
            activeProjectId: null,
            sidebarMode: 'docked',
            sidebarProjectAvatars: true,
            headerTitle: null,
            fontSize: 'default',
            actions: {
                setLayoutMode: (mode) => set({ layoutMode: mode }),
                setActiveContext: (context) => set({ activeContext: context }),
                setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
                setSidebarMode: (mode) => set({ sidebarMode: mode }),
                setSidebarProjectAvatars: (enabled) => set({ sidebarProjectAvatars: enabled }),
                setHeaderTitle: (title) => set({ headerTitle: title }),
                setFontSize: (size) => {
                    set({ fontSize: size });
                    // Apply immediately to DOM
                    if (typeof document !== 'undefined') {
                        document.documentElement.setAttribute('data-font-size', size);
                    }
                },
            },
        }),
        {
            name: 'seencel-layout',
            version: 2, // Bump to force sidebarMode reset from old localStorage values
            partialize: (state) => ({
                layoutMode: state.layoutMode,
                activeContext: state.activeContext,
                activeProjectId: state.activeProjectId,
                fontSize: state.fontSize,
                // sidebarMode intentionally NOT persisted — always 'docked' for now
                sidebarProjectAvatars: state.sidebarProjectAvatars,
                // headerTitle is not persisted as it depends on current page
            }),
        }
    )
);

// Sync fontSize to DOM on any store change (including rehydration from localStorage)
if (typeof window !== 'undefined') {
    // Apply on initial load
    const initialSize = useLayoutStore.getState().fontSize;
    if (initialSize) {
        document.documentElement.setAttribute('data-font-size', initialSize);
    }
    // Subscribe to changes
    useLayoutStore.subscribe((state) => {
        document.documentElement.setAttribute('data-font-size', state.fontSize);
    });
}

// === Convenience Hooks ===

export const useLayoutActions = () => useLayoutStore((state) => state.actions);
export const useLayoutMode = () => useLayoutStore((state) => state.layoutMode);
export const useActiveContext = () => useLayoutStore((state) => state.activeContext);
export const useActiveProjectId = () => useLayoutStore((state) => state.activeProjectId);
export const useHeaderTitle = () => useLayoutStore((state) => state.headerTitle);
export const useSidebarMode = () => useLayoutStore((state) => state.sidebarMode);
export const useSidebarProjectAvatars = () => useLayoutStore((state) => state.sidebarProjectAvatars);
export const useFontSize = () => useLayoutStore((state) => state.fontSize);
