"use client";

import { create } from 'zustand';
import { UserProfile } from '@/types/user';

// ============================================
// USER STORE - Estado global del usuario actual
// ============================================
// NOTE: No usamos persist porque el servidor ya tiene el user.
// Persistir en localStorage sería redundante y potencialmente stale.

interface UserState {
    // Core data
    user: UserProfile | null;
    isHydrated: boolean;

    // Actions
    setUser: (user: UserProfile | null) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isHydrated: false,

    setUser: (user) => set({ user, isHydrated: true }),
    clearUser: () => set({ user: null, isHydrated: false }),
}));

// ============================================
// HOOKS HELPER
// ============================================

/**
 * Hook para obtener el usuario actual
 * Retorna el user directamente (no wrapeado en objeto)
 */
export function useUser() {
    return useUserStore(state => state.user);
}

/**
 * Hook para verificar si el store está hidratado
 */
export function useUserHydrated() {
    return useUserStore(state => state.isHydrated);
}

/**
 * Hook para obtener el usuario requerido (throws si no hay usuario)
 */
export function useUserRequired() {
    const user = useUser();
    if (!user) {
        throw new Error("useUserRequired debe usarse cuando hay un usuario autenticado");
    }
    return user;
}

/**
 * Hook para acciones del usuario
 */
export function useUserActions() {
    const setUser = useUserStore(state => state.setUser);
    const clearUser = useUserStore(state => state.clearUser);

    return { setUser, clearUser };
}
