/**
 * Palette Analysis & Mode Detection
 * 
 * Analiza una paleta extraída y determina si debe usar
 * modo claro (refined) o modo oscuro (tech).
 */

import type { ExtractedColor, CuratedPalette, OklchColor } from '../types/palette';
import { oklchToCss } from './color-extraction';

/**
 * Analyze if a palette is predominantly light or dark
 */
export function isPaletteLightMode(colors: ExtractedColor[]): boolean {
    if (colors.length === 0) return true;

    // Calculate average luminance weighted by population
    let totalLuminance = 0;
    let totalPopulation = 0;

    for (const color of colors) {
        totalLuminance += color.oklch.l * color.population;
        totalPopulation += color.population;
    }

    const avgLuminance = totalLuminance / totalPopulation;

    // If average luminance > 0.5, it's a light palette
    return avgLuminance > 0.45;
}

/**
 * Generate a refined palette optimized for light mode UI
 * This creates a premium, interior-design-grade palette
 */
export function generateRefinedPalette(
    colors: ExtractedColor[],
    name: string = 'Refined Palette'
): CuratedPalette {
    // Sort by various characteristics
    const byLuminance = [...colors].sort((a, b) => b.oklch.l - a.oklch.l);
    const byChroma = [...colors].sort((a, b) => b.oklch.c - a.oklch.c);

    // Find the lightest color for background
    const lightestColor = byLuminance[0].oklch;

    // Find the darkest for foreground
    const darkestColor = byLuminance[byLuminance.length - 1].oklch;

    // Find most chromatic for accent (but desaturate it)
    const accentBase = byChroma[0].oklch;

    // Secondary accent
    const secondaryAccent = byChroma.find(c =>
        Math.abs(c.oklch.h - accentBase.h) > 40
    )?.oklch || accentBase;

    // Background: Very light with subtle tint from the palette
    const background: OklchColor = {
        l: Math.max(0.94, Math.min(0.98, lightestColor.l)),
        c: Math.min(0.015, lightestColor.c * 0.3),
        h: lightestColor.h
    };

    // Card: Slightly different from background
    const card: OklchColor = {
        l: Math.min(0.99, background.l + 0.02),
        c: background.c * 0.5,
        h: background.h
    };

    // Foreground: Dark but not pure black, with palette tint
    const foreground: OklchColor = {
        l: Math.max(0.15, Math.min(0.25, darkestColor.l)),
        c: Math.min(0.03, darkestColor.c * 0.5),
        h: darkestColor.h
    };

    // Primary: The most chromatic color, but refined
    const primary: OklchColor = {
        l: Math.max(0.35, Math.min(0.50, accentBase.l)),
        c: Math.max(0.06, Math.min(0.12, accentBase.c)),
        h: accentBase.h
    };

    // Accent: Secondary chromatic color
    const accent: OklchColor = {
        l: Math.max(0.85, Math.min(0.92, secondaryAccent.l * 1.5)),
        c: Math.min(0.04, secondaryAccent.c * 0.4),
        h: secondaryAccent.h
    };

    // Muted: Very subtle, for secondary elements
    const muted: OklchColor = {
        l: 0.93,
        c: 0.01,
        h: lightestColor.h
    };

    // Border: Almost invisible, just enough separation
    const border: OklchColor = {
        l: 0.88,
        c: 0.01,
        h: lightestColor.h
    };

    return {
        id: `refined-${Date.now()}`,
        name,
        source: 'image',
        colors: {
            background: oklchToCss(background),
            backgroundSubtle: oklchToCss({ ...background, l: background.l - 0.02 }),
            foreground: oklchToCss(foreground),
            primary: oklchToCss(primary),
            primaryForeground: oklchToCss({ l: 0.98, c: 0.005, h: primary.h }),
            accent: oklchToCss(accent),
            accentForeground: oklchToCss(foreground),
            muted: oklchToCss(muted),
            mutedForeground: oklchToCss({ l: 0.50, c: 0.02, h: foreground.h }),
            border: oklchToCss(border),
            card: oklchToCss(card),
            cardForeground: oklchToCss(foreground),
        },
        sourceColors: colors
    };
}

/**
 * Apply refined palette with additional style adjustments
 */
export function applyRefinedPalette(
    element: HTMLElement,
    palette: CuratedPalette
): void {
    const { colors } = palette;

    // Add refined-mode class
    element.classList.add('refined-mode');

    // Apply all color variables
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
    element.style.setProperty('--input', colors.muted);
    element.style.setProperty('--ring', colors.primary);

    // Shadow color based on darkest tone
    if (palette.sourceColors && palette.sourceColors.length > 0) {
        const darkest = [...palette.sourceColors].sort((a, b) => a.oklch.l - b.oklch.l)[0];
        element.style.setProperty(
            '--shadow-color',
            `oklch(${darkest.oklch.l * 100}% ${darkest.oklch.c} ${darkest.oklch.h} / 0.08)`
        );
    }
}

/**
 * Remove refined mode
 */
export function removeRefinedMode(element: HTMLElement): void {
    element.classList.remove('refined-mode');

    // Remove inline styles
    const properties = [
        '--background', '--foreground', '--card', '--card-foreground',
        '--popover', '--popover-foreground', '--primary', '--primary-foreground',
        '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
        '--accent', '--accent-foreground', '--border', '--input', '--ring',
        '--shadow-color'
    ];

    properties.forEach(prop => element.style.removeProperty(prop));
}
