
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SidebarMode } from '@/types/preferences';

export type LayoutMode = 'default' | 'sidebar';
export type NavigationContext = 'organization' | 'project' | 'learnings' | 'community' | 'admin';

interface LayoutState {
    layoutMode: LayoutMode;
    activeContext: NavigationContext;
    activeProjectId: string | null;
    sidebarMode: SidebarMode;
    headerTitle: React.ReactNode | null;

    actions: {
        setLayoutMode: (mode: LayoutMode) => void;
        setActiveContext: (context: NavigationContext) => void;
        setActiveProjectId: (projectId: string | null) => void;
        setSidebarMode: (mode: SidebarMode) => void;
        setHeaderTitle: (title: React.ReactNode | null) => void;
    };

}

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set) => ({
            layoutMode: 'default', // Default to existing layout initially
            activeContext: 'organization',
            activeProjectId: null,
            sidebarMode: 'expanded_hover',
            headerTitle: null,
            actions: {
                setLayoutMode: (mode) => set({ layoutMode: mode }),
                setActiveContext: (context) => set({ activeContext: context }),
                setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
                setSidebarMode: (mode) => set({ sidebarMode: mode }),
                setHeaderTitle: (title) => set({ headerTitle: title }),
            },
        }),
        {
            name: 'uitemplate-layout-storage',
            partialize: (state) => ({
                layoutMode: state.layoutMode,
                activeContext: state.activeContext,
                activeProjectId: state.activeProjectId,
                sidebarMode: state.sidebarMode
                // headerTitle is not persisted as it depends on current page
            }),

        }
    )
);

export const useLayoutActions = () => useLayoutStore((state) => state.actions);
export const useLayoutMode = () => useLayoutStore((state) => state.layoutMode);
export const useActiveContext = () => useLayoutStore((state) => state.activeContext);
export const useActiveProjectId = () => useLayoutStore((state) => state.activeProjectId);
export const useHeaderTitle = () => useLayoutStore((state) => state.headerTitle);

