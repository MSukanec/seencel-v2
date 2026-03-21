"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SidebarMode } from '@/types/preferences';

export type FontSize = 'smaller' | 'small' | 'default' | 'large' | 'larger';

export type LayoutMode = 'default' | 'sidebar';
export type NavigationContext = 'organization' | 'project' | 'learnings' | 'founders' | 'discover' | 'admin' | 'home' | 'settings';
export type WorkspaceSection = 'overview' | 'catalog' | 'construction' | 'finance' | 'founders';

interface LayoutState {
    layoutMode: LayoutMode;
    activeContext: NavigationContext;
    /** The visible rail's root context. Prevents rail shuffling when viewing Settings or Admin */
    activeBaseContext: NavigationContext;
    /** Active workspace section — determines which sidebar content to show */
    activeWorkspaceSection: WorkspaceSection;
    activeProjectId: string | null;
    sidebarMode: SidebarMode;
    sidebarProjectAvatars: boolean;
    headerTitle: React.ReactNode | null;
    fontSize: FontSize;
    previousPath: string | null;
    /** Optimistic pathname — set immediately on sidebar click, cleared when real pathname catches up */
    pendingPathname: string | null;

    actions: {
        setLayoutMode: (mode: LayoutMode) => void;
        setActiveContext: (context: NavigationContext) => void;
        setActiveBaseContext: (context: NavigationContext) => void;
        setActiveWorkspaceSection: (section: WorkspaceSection) => void;
        setActiveProjectId: (projectId: string | null) => void;
        setSidebarMode: (mode: SidebarMode) => void;
        setSidebarProjectAvatars: (enabled: boolean) => void;
        setHeaderTitle: (title: React.ReactNode | null) => void;
        setFontSize: (size: FontSize) => void;
        setPreviousPath: (path: string | null) => void;
        setPendingPathname: (path: string | null) => void;
    };
}

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set) => ({
            layoutMode: 'sidebar',
            activeContext: 'home',
            activeBaseContext: 'organization',
            activeWorkspaceSection: 'overview',
            activeProjectId: null,
            sidebarMode: 'docked',
            sidebarProjectAvatars: true,
            headerTitle: null,
            fontSize: 'default',
            previousPath: null,
            pendingPathname: null,
            actions: {
                setLayoutMode: (mode) => set({ layoutMode: mode }),
                setActiveContext: (context) => {
                    set({ activeContext: context });
                    if (context === 'organization' || context === 'learnings' || context === 'discover' || context === 'home') {
                        set({ activeBaseContext: context });
                    }
                },
                setActiveBaseContext: (context) => set({ activeBaseContext: context }),
                setActiveWorkspaceSection: (section) => set({ activeWorkspaceSection: section }),
                setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
                setSidebarMode: (mode) => set({ sidebarMode: mode }),
                setSidebarProjectAvatars: (enabled) => set({ sidebarProjectAvatars: enabled }),
                setHeaderTitle: (title) => set({ headerTitle: title }),
                setFontSize: (size) => {
                    set({ fontSize: size });
                    if (typeof document !== 'undefined') {
                        document.documentElement.setAttribute('data-font-size', size);
                    }
                },
                setPreviousPath: (path) => set({ previousPath: path }),
                setPendingPathname: (path) => set({ pendingPathname: path }),
            },
        }),
        {
            name: 'seencel-layout',
            version: 2, // Bump to force sidebarMode reset from old localStorage values
            partialize: (state) => ({
                layoutMode: state.layoutMode,
                activeContext: state.activeContext,
                activeBaseContext: state.activeBaseContext,
                activeWorkspaceSection: state.activeWorkspaceSection,
                activeProjectId: state.activeProjectId,
                fontSize: state.fontSize,
                sidebarMode: state.sidebarMode,
                // sidebarMode now persisted to localStorage
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
export const usePendingPathname = () => useLayoutStore((state) => state.pendingPathname);
export const useActiveWorkspaceSection = () => useLayoutStore((state) => state.activeWorkspaceSection);
