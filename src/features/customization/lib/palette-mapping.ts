/**
 * Palette Mapping
 * 
 * Lógica inteligente para mapear colores extraídos a roles de UI.
 * El secreto de que una paleta se vea "curada" está aquí.
 */

import type { ExtractedColor, CuratedPalette, OklchColor } from '../types/palette';
import { oklchToCss, adjustLuminance, adjustChroma } from './color-extraction';

/**
 * Generate a curated palette from extracted colors
 * 
 * The magic sauce: intelligent color role assignment based on
 * luminance, chroma, and color theory.
 */
export function generateCuratedPalette(
    colors: ExtractedColor[],
    name: string = 'Custom Palette'
): CuratedPalette {
    // Sort by different characteristics
    const byLuminance = [...colors].sort((a, b) => a.oklch.l - b.oklch.l);
    const byChroma = [...colors].sort((a, b) => b.oklch.c - a.oklch.c);

    // Find the most vibrant color (highest chroma) - this becomes primary
    const primaryColor = byChroma[0].oklch;

    // Find a contrasting vibrant color for accent
    // Look for a color with different hue (at least 60° apart)
    const accentColor = byChroma.find(c =>
        Math.abs(c.oklch.h - primaryColor.h) > 60 &&
        Math.abs(c.oklch.h - primaryColor.h) < 300
    )?.oklch || adjustLuminance(primaryColor, -0.15);

    // Background: darkest color, desaturated
    const bgBase = byLuminance[0].oklch;
    const background: OklchColor = {
        l: Math.min(0.15, bgBase.l),
        c: Math.min(0.02, bgBase.c),
        h: primaryColor.h  // Tint towards primary
    };

    // Card: slightly lighter than background
    const card: OklchColor = {
        l: background.l + 0.05,
        c: background.c + 0.01,
        h: background.h
    };

    // Foreground: very light with slight tint
    const foreground: OklchColor = {
        l: 0.95,
        c: 0.01,
        h: primaryColor.h
    };

    // Muted: mid-tone for secondary elements
    const muted: OklchColor = {
        l: 0.22,
        c: 0.02,
        h: primaryColor.h
    };

    // Border: subtle division
    const border: OklchColor = {
        l: 0.28,
        c: 0.03,
        h: primaryColor.h
    };

    // Adjust primary for good contrast
    const primaryAdjusted: OklchColor = {
        ...primaryColor,
        l: Math.max(0.55, Math.min(0.75, primaryColor.l)),
        c: Math.max(0.12, primaryColor.c)
    };

    // Accent with good visibility
    const accentAdjusted: OklchColor = {
        ...accentColor,
        l: Math.max(0.50, Math.min(0.70, accentColor.l)),
        c: Math.max(0.10, accentColor.c)
    };

    return {
        id: `palette-${Date.now()}`,
        name,
        source: 'image',
        colors: {
            background: oklchToCss(background),
            backgroundSubtle: oklchToCss({ ...background, l: background.l + 0.02 }),
            foreground: oklchToCss(foreground),
            primary: oklchToCss(primaryAdjusted),
            primaryForeground: oklchToCss({ l: 0.98, c: 0, h: 0 }),
            accent: oklchToCss(accentAdjusted),
            accentForeground: oklchToCss({ l: 0.98, c: 0, h: 0 }),
            muted: oklchToCss(muted),
            mutedForeground: oklchToCss({ l: 0.65, c: 0.02, h: primaryColor.h }),
            border: oklchToCss(border),
            card: oklchToCss(card),
            cardForeground: oklchToCss(foreground),
        },
        sourceColors: colors
    };
}

/**
 * Apply a curated palette to the document
 */
export function applyPaletteToDocument(palette: CuratedPalette): void {
    const root = document.documentElement;
    const { colors } = palette;

    // Apply as CSS custom properties
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--card', colors.card);
    root.style.setProperty('--card-foreground', colors.cardForeground);
    root.style.setProperty('--popover', colors.card);
    root.style.setProperty('--popover-foreground', colors.cardForeground);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--secondary', colors.muted);
    root.style.setProperty('--secondary-foreground', colors.mutedForeground);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--muted-foreground', colors.mutedForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-foreground', colors.accentForeground);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--input', colors.border);
    root.style.setProperty('--ring', colors.primary);

    // Chart colors from source colors if available
    if (palette.sourceColors && palette.sourceColors.length >= 5) {
        palette.sourceColors.forEach((color, i) => {
            if (i < 5) {
                root.style.setProperty(`--chart-${i + 1}`, color.hex);
            }
        });
    }
}

/**
 * Apply palette to a specific element (scoped)
 */
export function applyPaletteToElement(element: HTMLElement, palette: CuratedPalette): void {
    const { colors } = palette;

    element.style.setProperty('--background', colors.background);
    element.style.setProperty('--foreground', colors.foreground);
    element.style.setProperty('--card', colors.card);
    element.style.setProperty('--card-foreground', colors.cardForeground);
    element.style.setProperty('--popover', colors.card);
    element.style.setProperty('--popover-foreground', colors.cardForeground);
    element.style.setProperty('--primary', colors.primary);
    element.style.setProperty('--primary-foreground', colors.primaryForeground);
    element.style.setProperty('--secondary', colors.muted);
    element.style.setProperty('--secondary-foreground', colors.mutedForeground);
    element.style.setProperty('--muted', colors.muted);
    element.style.setProperty('--muted-foreground', colors.mutedForeground);
    element.style.setProperty('--accent', colors.accent);
    element.style.setProperty('--accent-foreground', colors.accentForeground);
    element.style.setProperty('--border', colors.border);
    element.style.setProperty('--input', colors.border);
    element.style.setProperty('--ring', colors.primary);
}

/**
 * Reset palette to defaults (remove inline styles)
 */
export function resetPalette(element?: HTMLElement): void {
    const target = element || document.documentElement;
    const properties = [
        '--background', '--foreground', '--card', '--card-foreground',
        '--popover', '--popover-foreground', '--primary', '--primary-foreground',
        '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
        '--accent', '--accent-foreground', '--border', '--input', '--ring'
    ];

    properties.forEach(prop => target.style.removeProperty(prop));
}
