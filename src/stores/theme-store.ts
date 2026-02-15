"use client";

import { create } from 'zustand';
import { useEffect } from 'react';
import { rgbToOklch } from '@/components/shared/theme-customizer/lib/color-extraction';
import { useActiveProjectId } from '@/stores/layout-store';
import { useLayoutData } from '@/hooks/use-layout-data';

// ============================================
// TYPES
// ============================================

/** Minimal project shape needed for theme resolution */
export interface ThemeProjectData {
    id: string;
    use_palette_theme?: boolean;
    image_palette?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
    } | null;
}

interface ThemeVars {
    [key: string]: string;
}

interface ThemeCustomizationState {
    /** Whether a custom project theme is currently active on :root */
    isCustomThemeActive: boolean;
    /** The project ID whose theme is currently applied (null = system default) */
    activeThemeProjectId: string | null;
    /** Current applied CSS vars (for cleanup on reset) */
    appliedVars: ThemeVars | null;
    /** Session-local overrides for use_palette_theme (survives sidebar data staleness) */
    projectThemeOverrides: Record<string, boolean>;

    /** Apply theme from a project's image_palette. Only applies if use_palette_theme is true. */
    applyProjectTheme: (project: ThemeProjectData) => void;
    /** Reset to system default theme */
    resetTheme: () => void;
    /** Resolve which theme should be active based on the given project data */
    resolveThemeForProject: (project: ThemeProjectData | null) => void;
    /** Record a toggle-theme change for a project (session-local) */
    setProjectThemeOverride: (projectId: string, enabled: boolean) => void;
}

// ============================================
// HELPERS
// ============================================

/** Parse hex (#RRGGBB) → { r, g, b } (0-255) */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleaned = hex.replace('#', '');
    return {
        r: parseInt(cleaned.substring(0, 2), 16) || 0,
        g: parseInt(cleaned.substring(2, 4), 16) || 0,
        b: parseInt(cleaned.substring(4, 6), 16) || 0,
    };
}

/** Convert hex to OKLCH css string */
function hexToOklchCss(hex: string): string {
    const { r, g, b } = hexToRgb(hex);
    const oklch = rgbToOklch(r, g, b);
    return `oklch(${oklch.l.toFixed(4)} ${oklch.c.toFixed(4)} ${oklch.h.toFixed(2)})`;
}

/** Get OKLCH values from hex */
function hexToOklch(hex: string) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToOklch(r, g, b);
}

/** Generate a contrasting foreground (white or dark) for a given background hex */
function deriveForeground(bgHex: string): string {
    const oklch = hexToOklch(bgHex);
    // Dark background → light text, Light background → dark text
    if (oklch.l < 0.5) {
        return `oklch(0.95 0.005 ${oklch.h.toFixed(2)})`;
    }
    return `oklch(0.20 0.015 ${oklch.h.toFixed(2)})`;
}

/** Shift luminance of a hex color by a delta (OKLCH space), clamped 0-1 */
function shiftLuminance(hex: string, delta: number): string {
    const oklch = hexToOklch(hex);
    const newL = Math.max(0, Math.min(1, oklch.l + delta));
    return `oklch(${newL.toFixed(4)} ${oklch.c.toFixed(4)} ${oklch.h.toFixed(2)})`;
}

/** Derive card color: slightly lighter or darker than background depending on luminance */
function deriveCard(bgHex: string): string {
    const oklch = hexToOklch(bgHex);
    // Dark bg → card is slightly lighter; Light bg → card is slightly darker
    const delta = oklch.l < 0.5 ? 0.03 : -0.02;
    return shiftLuminance(bgHex, delta);
}

/** Derive border color: more contrast shift from background */
function deriveBorder(bgHex: string): string {
    const oklch = hexToOklch(bgHex);
    const delta = oklch.l < 0.5 ? 0.08 : -0.08;
    return shiftLuminance(bgHex, delta);
}

/** Derive muted color: desaturated mid-luminance from background */
function deriveMuted(bgHex: string): string {
    const oklch = hexToOklch(bgHex);
    const delta = oklch.l < 0.5 ? 0.06 : -0.05;
    const newL = Math.max(0, Math.min(1, oklch.l + delta));
    return `oklch(${newL.toFixed(4)} ${Math.min(oklch.c, 0.02).toFixed(4)} ${oklch.h.toFixed(2)})`;
}

/** Derive muted foreground: mid-contrast text */
function deriveMutedForeground(bgHex: string): string {
    const oklch = hexToOklch(bgHex);
    const targetL = oklch.l < 0.5 ? 0.65 : 0.45;
    return `oklch(${targetL.toFixed(4)} 0.015 ${oklch.h.toFixed(2)})`;
}

/**
 * Generate CSS variable map from a project's image_palette.
 * Uses the 4 user-chosen colors DIRECTLY and derives
 * foreground, card, border, muted intelligently via OKLCH.
 */
function generateThemeVarsFromPalette(imagePalette: NonNullable<ThemeProjectData['image_palette']>): ThemeVars | null {
    if (!imagePalette.primary || !imagePalette.background) return null;

    const bg = imagePalette.background;
    const primary = imagePalette.primary;
    const secondary = imagePalette.secondary || imagePalette.primary;
    const accent = imagePalette.accent || imagePalette.primary;

    // Direct colors as OKLCH CSS
    const bgCss = hexToOklchCss(bg);
    const primaryCss = hexToOklchCss(primary);
    const secondaryCss = hexToOklchCss(secondary);
    const accentCss = hexToOklchCss(accent);

    // Derived colors (intelligent, contrast-aware)
    const fgCss = deriveForeground(bg);
    const cardCss = deriveCard(bg);
    const borderCss = deriveBorder(bg);
    const mutedCss = deriveMuted(bg);
    const mutedFgCss = deriveMutedForeground(bg);
    const primaryFgCss = deriveForeground(primary);
    const secondaryFgCss = deriveForeground(secondary);
    const accentFgCss = deriveForeground(accent);

    return {
        '--background': bgCss,
        '--foreground': fgCss,
        '--card': cardCss,
        '--card-foreground': fgCss,
        '--primary': primaryCss,
        '--primary-foreground': primaryFgCss,
        '--secondary': secondaryCss,
        '--secondary-foreground': secondaryFgCss,
        '--muted': mutedCss,
        '--muted-foreground': mutedFgCss,
        '--accent': accentCss,
        '--accent-foreground': accentFgCss,
        '--border': borderCss,
        '--input': borderCss,
        '--ring': primaryCss,
        '--popover': cardCss,
        '--popover-foreground': fgCss,
        '--sidebar': bgCss,
        '--sidebar-foreground': fgCss,
        '--sidebar-primary': primaryCss,
        '--sidebar-primary-foreground': primaryFgCss,
        '--sidebar-accent': accentCss,
        '--sidebar-accent-foreground': accentFgCss,
        '--sidebar-border': borderCss,
        '--sidebar-ring': primaryCss,
    };
}

/** Apply CSS vars to :root */
function applyVarsToRoot(vars: ThemeVars) {
    if (typeof window === 'undefined') return;
    Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
    });
}

/** Remove CSS vars from :root */
function removeVarsFromRoot(vars: ThemeVars) {
    if (typeof window === 'undefined') return;
    Object.keys(vars).forEach((key) => {
        document.documentElement.style.removeProperty(key);
    });
}

// ============================================
// STORE
// ============================================

export const useThemeCustomizationStore = create<ThemeCustomizationState>()(
    (set, get) => ({
        isCustomThemeActive: false,
        activeThemeProjectId: null,
        appliedVars: null,
        projectThemeOverrides: {},

        applyProjectTheme: (project) => {
            const { appliedVars } = get();

            // Clean previous theme
            if (appliedVars) removeVarsFromRoot(appliedVars);

            if (!project.image_palette) {
                set({ isCustomThemeActive: false, activeThemeProjectId: null, appliedVars: null });
                return;
            }

            const vars = generateThemeVarsFromPalette(project.image_palette);
            if (!vars) {
                set({ isCustomThemeActive: false, activeThemeProjectId: null, appliedVars: null });
                return;
            }

            applyVarsToRoot(vars);
            set({
                isCustomThemeActive: true,
                activeThemeProjectId: project.id,
                appliedVars: vars,
            });
        },

        resetTheme: () => {
            const { appliedVars } = get();
            if (appliedVars) removeVarsFromRoot(appliedVars);
            set({
                isCustomThemeActive: false,
                activeThemeProjectId: null,
                appliedVars: null,
            });
        },

        resolveThemeForProject: (project) => {
            const { resetTheme, applyProjectTheme, projectThemeOverrides } = get();

            if (!project) {
                resetTheme();
                return;
            }

            // Check session-local override first (handles stale sidebar data)
            const override = projectThemeOverrides[project.id];
            const isEnabled = override !== undefined ? override : project.use_palette_theme;

            if (!isEnabled || !project.image_palette) {
                resetTheme();
                return;
            }

            applyProjectTheme(project);
        },

        setProjectThemeOverride: (projectId, enabled) => {
            set(state => ({
                projectThemeOverrides: {
                    ...state.projectThemeOverrides,
                    [projectId]: enabled,
                },
            }));
        },
    })
);

// ============================================
// HOOKS
// ============================================

/**
 * Hook para acceder a la customización de tema
 */
export function useThemeCustomization() {
    const isCustomThemeActive = useThemeCustomizationStore(state => state.isCustomThemeActive);
    const activeThemeProjectId = useThemeCustomizationStore(state => state.activeThemeProjectId);
    const applyProjectTheme = useThemeCustomizationStore(state => state.applyProjectTheme);
    const resetTheme = useThemeCustomizationStore(state => state.resetTheme);
    const resolveThemeForProject = useThemeCustomizationStore(state => state.resolveThemeForProject);
    const setProjectThemeOverride = useThemeCustomizationStore(state => state.setProjectThemeOverride);

    return { isCustomThemeActive, activeThemeProjectId, applyProjectTheme, resetTheme, resolveThemeForProject, setProjectThemeOverride };
}

// ============================================
// HYDRATOR COMPONENT
// ============================================

/**
 * Component to hydrate theme on mount and when active project changes.
 * Reads activeProjectId from layout-store, finds the project data from
 * sidebar data (which includes image_palette + use_palette_theme), and
 * applies or resets the theme accordingly.
 */
export function ThemeCustomizationHydrator() {
    const activeProjectId = useActiveProjectId();
    const resolveThemeForProject = useThemeCustomizationStore(state => state.resolveThemeForProject);
    const { projects } = useLayoutData();

    useEffect(() => {
        if (!activeProjectId) {
            // No active project — reset to system theme
            useThemeCustomizationStore.getState().resetTheme();
            return;
        }

        // Find the project with theme data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const project = projects?.find((p: any) => p.id === activeProjectId) as any;
        if (project) {
            resolveThemeForProject({
                id: project.id,
                use_palette_theme: project.use_palette_theme,
                image_palette: project.image_palette,
            });
        }
    }, [activeProjectId, projects, resolveThemeForProject]);

    return null;
}
