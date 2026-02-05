"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

// ============================================
// THEME CUSTOMIZATION STORE
// ============================================
// Maneja temas personalizados con persistencia en localStorage

interface ThemeVars {
    '--background': string;
    '--foreground': string;
    '--card': string;
    '--card-foreground': string;
    '--primary': string;
    '--primary-foreground': string;
    '--secondary': string;
    '--secondary-foreground': string;
    '--muted': string;
    '--muted-foreground': string;
    '--accent': string;
    '--accent-foreground': string;
    '--border': string;
    '--input': string;
    '--ring': string;
    [key: string]: string;
}

interface ThemeCustomizationState {
    isCustomThemeActive: boolean;
    customTheme: ThemeVars | null;
    isHydrated: boolean;

    hydrate: () => void;
    applyTheme: (vars: ThemeVars) => void;
    resetTheme: () => void;
}

export const useThemeCustomizationStore = create<ThemeCustomizationState>()(
    persist(
        (set, get) => ({
            isCustomThemeActive: false,
            customTheme: null,
            isHydrated: false,

            hydrate: () => {
                const { customTheme, isHydrated } = get();
                if (isHydrated) return;

                // Apply theme to :root if exists
                if (customTheme && typeof window !== 'undefined') {
                    Object.entries(customTheme).forEach(([key, value]) => {
                        document.documentElement.style.setProperty(key, value);
                    });
                }

                set({ isHydrated: true });
            },

            applyTheme: (vars) => {
                // Apply to :root
                if (typeof window !== 'undefined') {
                    Object.entries(vars).forEach(([key, value]) => {
                        document.documentElement.style.setProperty(key, value);
                    });
                }

                set({
                    customTheme: vars,
                    isCustomThemeActive: true,
                });
            },

            resetTheme: () => {
                const { customTheme } = get();

                // Remove custom properties from :root
                if (customTheme && typeof window !== 'undefined') {
                    Object.keys(customTheme).forEach((key) => {
                        document.documentElement.style.removeProperty(key);
                    });
                }

                set({
                    customTheme: null,
                    isCustomThemeActive: false,
                });
            },
        }),
        {
            name: 'seencel-custom-theme',
            partialize: (state) => ({
                customTheme: state.customTheme,
                isCustomThemeActive: state.isCustomThemeActive,
            }),
        }
    )
);

// ============================================
// HOOKS
// ============================================

/**
 * Hook para acceder a la customización de tema
 */
export function useThemeCustomization() {
    const isCustomThemeActive = useThemeCustomizationStore(state => state.isCustomThemeActive);
    const customTheme = useThemeCustomizationStore(state => state.customTheme);
    const applyTheme = useThemeCustomizationStore(state => state.applyTheme);
    const resetTheme = useThemeCustomizationStore(state => state.resetTheme);

    return { isCustomThemeActive, customTheme, applyTheme, resetTheme };
}

// ============================================
// HYDRATOR COMPONENT
// ============================================

/**
 * Component to hydrate theme customization on mount
 * Should be placed in the layout
 */
export function ThemeCustomizationHydrator() {
    const hydrate = useThemeCustomizationStore(state => state.hydrate);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    return null;
}
