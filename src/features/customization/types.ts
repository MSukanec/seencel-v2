/**
 * Customization Types
 * 
 * Definición de tipos para el sistema de personalización.
 */

// Re-export palette types
export * from './types/palette';

/** Available theme presets */
export type ThemePreset =
    | 'default'     // Sistema por defecto (sin override)
    | 'midnight'    // Premium dark
    | 'cyber'       // Neon cyberpunk
    | 'ocean'       // Deep blues
    | 'sunset'      // Warm oranges
    | 'forest';     // Natural greens

/** Theme configuration */
export interface ThemeConfig {
    preset: ThemePreset;
    customColors?: Partial<ThemeColors>;
}

/** Color tokens that can be customized */
export interface ThemeColors {
    primary: string;
    background: string;
    card: string;
    accent: string;
    // Add more as needed
}

/** Bento card size options */
export type BentoSize = 'sm' | 'md' | 'lg' | 'wide' | 'tall';

/** Layout item for a single card in the grid */
export interface LayoutItem {
    id: string;
    type: 'kpi' | 'list' | 'chart' | 'custom';
    size: BentoSize;
    position: {
        col: number;
        row: number;
    };
    config?: Record<string, unknown>;
}

/** Complete layout configuration */
export interface LayoutConfig {
    id: string;
    name: string;
    items: LayoutItem[];
    columns: 2 | 3 | 4 | 6;
}

/** User's full customization preferences */
export interface UserCustomization {
    userId: string;
    theme: ThemeConfig;
    layouts: Record<string, LayoutConfig>; // keyed by page/section
    createdAt: Date;
    updatedAt: Date;
}

/** Customization context value */
export interface CustomizationContextValue {
    // Theme
    theme: ThemePreset;
    setTheme: (theme: ThemePreset) => void;

    // Layout (future)
    // layout: LayoutConfig | null;
    // setLayout: (layout: LayoutConfig) => void;

    // Persistence (future)
    // save: () => Promise<void>;
    // reset: () => void;
}
