/**
 * Palette Types
 * 
 * Tipos para el sistema de paletas curadas
 */

/** Representación de un color en oklch */
export interface OklchColor {
    l: number;  // Luminance 0-1
    c: number;  // Chroma 0-0.4
    h: number;  // Hue 0-360
}

/** Color extraído con metadata */
export interface ExtractedColor {
    rgb: { r: number; g: number; b: number };
    hex: string;
    oklch: OklchColor;
    population: number;  // Frequency in image
}

/** Paleta completa con roles asignados */
export interface CuratedPalette {
    id: string;
    name: string;
    source?: 'image' | 'preset' | 'custom';
    colors: {
        background: string;      // oklch string
        backgroundSubtle: string;
        foreground: string;
        primary: string;
        primaryForeground: string;
        accent: string;
        accentForeground: string;
        muted: string;
        mutedForeground: string;
        border: string;
        card: string;
        cardForeground: string;
    };
    /** Original extracted colors (if from image) */
    sourceColors?: ExtractedColor[];
}

/** Preset de paleta predefinida */
export interface PalettePreset {
    id: string;
    name: string;
    description?: string;
    thumbnail?: string;
    palette: CuratedPalette;
}
