"use client";

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { ExternalActorType } from '@/features/external-actors/types';
import { ALL_MODULES, type NavModule } from '@/config/navigation-modules';

// ============================================
// ACCESS CONTEXT STORE
// ============================================
// Determina cómo el usuario actual accede a la organización:
// - "member": acceso completo como miembro interno
// - "external": acceso limitado como actor externo
//
// También gestiona:
// - memberVisibleModules: qué accordions del sidebar ve un miembro
// - viewingAs: modo "ver como" para que un admin previsualice
//   el sidebar de un actor externo sin cambiar sesión
// ============================================

export type AccessMode = "member" | "external";

// "Viewing As" — admin previewing an external actor's sidebar
export interface ViewingAsState {
    userId: string;
    userName: string;
    actorType: ExternalActorType;
}

interface AccessContextState {
    // Current mode
    activeAccessMode: AccessMode;
    externalActorType: ExternalActorType | null;

    // Available modes for this user in this org
    availableModes: AccessMode[];

    // Module visibility for members (which accordions to show)
    memberVisibleModules: NavModule[];

    // "Viewing As" mode — admin previewing external actor's sidebar
    viewingAs: ViewingAsState | null;

    // Hydration
    isHydrated: boolean;

    // Actions
    hydrate: (data: {
        isMember: boolean;
        isExternal: boolean;
        externalActorType: ExternalActorType | null;
        memberVisibleModules?: NavModule[];
    }) => void;
    switchMode: (mode: AccessMode) => void;
    setMemberVisibleModules: (modules: NavModule[]) => void;
    setViewingAs: (data: ViewingAsState) => void;
    clearViewingAs: () => void;
    reset: () => void;
}

export const useAccessContextStore = create<AccessContextState>((set, get) => ({
    activeAccessMode: "member",
    externalActorType: null,
    availableModes: ["member"],
    memberVisibleModules: ALL_MODULES,
    viewingAs: null,
    isHydrated: false,

    hydrate: ({ isMember, isExternal, externalActorType, memberVisibleModules }) => {
        const availableModes: AccessMode[] = [];
        if (isMember) availableModes.push("member");
        if (isExternal) availableModes.push("external");

        // Default: prefer member mode if available
        const defaultMode: AccessMode = isMember ? "member" : "external";

        set({
            activeAccessMode: defaultMode,
            externalActorType: isExternal ? externalActorType : null,
            availableModes,
            memberVisibleModules: memberVisibleModules ?? ALL_MODULES,
            isHydrated: true,
        });
    },

    switchMode: (mode) => {
        const { availableModes } = get();
        if (!availableModes.includes(mode)) return;
        set({ activeAccessMode: mode });
    },

    setMemberVisibleModules: (modules) => {
        set({ memberVisibleModules: modules });
    },

    setViewingAs: (data) => {
        set({ viewingAs: data });
    },

    clearViewingAs: () => {
        set({ viewingAs: null });
    },

    reset: () => set({
        activeAccessMode: "member",
        externalActorType: null,
        availableModes: ["member"],
        memberVisibleModules: ALL_MODULES,
        viewingAs: null,
        isHydrated: false,
    }),
}));

// ============================================
// CONVENIENCE HOOKS (useShallow prevents infinite loops)
// ============================================

export const useAccessContext = () => useAccessContextStore(useShallow((state) => ({
    accessMode: state.activeAccessMode,
    externalActorType: state.externalActorType,
    availableModes: state.availableModes,
    isHydrated: state.isHydrated,
})));

export const useAccessMode = () => useAccessContextStore((state) => state.activeAccessMode);
export const useAvailableModes = () => useAccessContextStore((state) => state.availableModes);
export const useAccessActions = () => useAccessContextStore(useShallow((state) => ({
    switchMode: state.switchMode,
    hydrate: state.hydrate,
    reset: state.reset,
    setViewingAs: state.setViewingAs,
    clearViewingAs: state.clearViewingAs,
    setMemberVisibleModules: state.setMemberVisibleModules,
})));

/** True if user has both member and external access */
export const useIsDualAccess = () => useAccessContextStore((state) => state.availableModes.length > 1);

/** True if currently in external mode */
export const useIsExternalMode = () => useAccessContextStore((state) => state.activeAccessMode === "external");

/** Member's visible modules */
export const useMemberModules = () => useAccessContextStore((state) => state.memberVisibleModules);

/** "Viewing As" state — null if not active */
export const useViewingAs = () => useAccessContextStore((state) => state.viewingAs);

/** True if currently in "Viewing As" mode */
export const useIsViewingAs = () => useAccessContextStore((state) => state.viewingAs !== null);
