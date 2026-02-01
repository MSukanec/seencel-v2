/**
 * Typography & Mood Detection
 * 
 * Analiza la paleta para determinar el "mood" y seleccionar
 * la tipografía más apropiada.
 */

import type { ExtractedColor, OklchColor } from '../types/palette';

/** Typography mood categories */
export type TypographyMood =
    | 'classic'     // Serif - Paletas cálidas, elegantes, tradicionales
    | 'modern'      // Sans-serif - Paletas neutras, limpias
    | 'luxe'        // Display serif - Paletas con dorados, negro, crema
    | 'natural'     // Organic sans - Verdes, tierras, naturales
    | 'industrial'; // Monospace/geometric - Grises, concreto, metálicos

/** Font configuration for each mood */
export interface MoodTypography {
    mood: TypographyMood;
    headingFont: string;
    bodyFont: string;
    headingWeight: number;
    bodyWeight: number;
    letterSpacing: string;
    googleFontsUrl?: string;
    // Dynamic styling
    borderRadius: string;        // Card border radius
    borderRadiusLg: string;      // Large elements (modals, sheets)
    hoverScale: string;          // Hover transform scale
    transitionTiming: string;    // Transition easing function
    shadowStyle: 'soft' | 'sharp' | 'glow';  // Shadow aesthetic
}

/** Mood typography configurations */
export const MOOD_TYPOGRAPHY: Record<TypographyMood, MoodTypography> = {
    classic: {
        mood: 'classic',
        headingFont: "'Playfair Display', Georgia, serif",
        bodyFont: "'Source Serif 4', Georgia, serif",
        headingWeight: 500,
        bodyWeight: 400,
        letterSpacing: '0.01em',
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Source+Serif+4:wght@400;500&display=swap',
        // Classic: refined curves, subtle interactions
        borderRadius: '12px',
        borderRadiusLg: '20px',
        hoverScale: '1.01',
        transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)',
        shadowStyle: 'soft'
    },
    modern: {
        mood: 'modern',
        headingFont: "'Inter', system-ui, sans-serif",
        bodyFont: "'Inter', system-ui, sans-serif",
        headingWeight: 600,
        bodyWeight: 400,
        letterSpacing: '-0.02em',
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
        // Modern: medium radius, snappy transitions
        borderRadius: '8px',
        borderRadiusLg: '16px',
        hoverScale: '1.02',
        transitionTiming: 'cubic-bezier(0.22, 1, 0.36, 1)',
        shadowStyle: 'soft'
    },
    luxe: {
        mood: 'luxe',
        headingFont: "'Cormorant Garamond', Georgia, serif",
        bodyFont: "'Montserrat', system-ui, sans-serif",
        headingWeight: 500,
        bodyWeight: 400,
        letterSpacing: '0.02em',
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Montserrat:wght@400;500&display=swap',
        // Luxe: sharp corners, dramatic interactions
        borderRadius: '4px',
        borderRadiusLg: '8px',
        hoverScale: '1.015',
        transitionTiming: 'cubic-bezier(0.16, 1, 0.3, 1)',
        shadowStyle: 'glow'
    },
    natural: {
        mood: 'natural',
        headingFont: "'DM Sans', system-ui, sans-serif",
        bodyFont: "'DM Sans', system-ui, sans-serif",
        headingWeight: 500,
        bodyWeight: 400,
        letterSpacing: '0em',
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap',
        // Natural: organic, rounded, smooth
        borderRadius: '16px',
        borderRadiusLg: '24px',
        hoverScale: '1.02',
        transitionTiming: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        shadowStyle: 'soft'
    },
    industrial: {
        mood: 'industrial',
        headingFont: "'Space Grotesk', system-ui, sans-serif",
        bodyFont: "'IBM Plex Mono', monospace",
        headingWeight: 500,
        bodyWeight: 400,
        letterSpacing: '0.01em',
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap',
        // Industrial: sharp, geometric, no curves
        borderRadius: '2px',
        borderRadiusLg: '4px',
        hoverScale: '1.01',
        transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)',
        shadowStyle: 'sharp'
    }
};

/**
 * Detect the mood of a color palette
 */
export function detectPaletteMood(colors: ExtractedColor[]): TypographyMood {
    if (colors.length === 0) return 'modern';

    // Analyze color characteristics
    const avgHue = colors.reduce((sum, c) => sum + c.oklch.h, 0) / colors.length;
    const avgChroma = colors.reduce((sum, c) => sum + c.oklch.c, 0) / colors.length;
    const avgLuminance = colors.reduce((sum, c) => sum + c.oklch.l, 0) / colors.length;

    // High chroma with warm hues (gold, cream) → Luxe
    const hasGold = colors.some(c =>
        c.oklch.h >= 40 && c.oklch.h <= 90 &&
        c.oklch.c > 0.08 && c.oklch.l > 0.6
    );

    // Deep contrast (very dark + very light) → Luxe
    const hasHighContrast = colors.some(c => c.oklch.l < 0.2) &&
        colors.some(c => c.oklch.l > 0.85);

    if (hasGold && hasHighContrast) {
        return 'luxe';
    }

    // Green/earth tones → Natural
    const isNatural = colors.filter(c =>
        (c.oklch.h >= 80 && c.oklch.h <= 180) && c.oklch.c > 0.03
    ).length >= 2;

    if (isNatural) {
        return 'natural';
    }

    // Very low chroma (grays) → Industrial
    const isDesaturated = avgChroma < 0.04;
    const hasGrays = colors.filter(c => c.oklch.c < 0.02).length >= 3;

    if (isDesaturated || hasGrays) {
        return 'industrial';
    }

    // Warm earth tones (beige, terracotta) → Classic
    const isWarm = colors.filter(c =>
        c.oklch.h >= 20 && c.oklch.h <= 80 &&
        c.oklch.c > 0.02 && c.oklch.c < 0.15
    ).length >= 2;

    if (isWarm && avgLuminance > 0.5) {
        return 'classic';
    }

    // Default to modern
    return 'modern';
}

/**
 * Load Google Fonts for the mood
 */
export function loadMoodFonts(mood: TypographyMood): void {
    const config = MOOD_TYPOGRAPHY[mood];
    if (!config.googleFontsUrl) return;

    // Check if already loaded
    const existingLink = document.querySelector(`link[data-mood="${mood}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = config.googleFontsUrl;
    link.setAttribute('data-mood', mood);
    document.head.appendChild(link);
}

/**
 * Apply typography and styling to an element based on mood
 */
export function applyMoodTypography(element: HTMLElement, mood: TypographyMood): void {
    const config = MOOD_TYPOGRAPHY[mood];

    // Load fonts
    loadMoodFonts(mood);

    // Apply typography CSS variables
    element.style.setProperty('--font-heading', config.headingFont);
    element.style.setProperty('--font-body', config.bodyFont);
    element.style.setProperty('--font-heading-weight', config.headingWeight.toString());
    element.style.setProperty('--font-body-weight', config.bodyWeight.toString());
    element.style.setProperty('--letter-spacing', config.letterSpacing);

    // Apply dynamic styling CSS variables (Border Radius & Micro-interactions)
    element.style.setProperty('--radius', config.borderRadius);
    element.style.setProperty('--radius-lg', config.borderRadiusLg);
    element.style.setProperty('--hover-scale', config.hoverScale);
    element.style.setProperty('--transition-timing', config.transitionTiming);
    element.style.setProperty('--shadow-style', config.shadowStyle);

    // Shadow presets based on style
    const shadowPresets = {
        soft: '0 4px 20px rgba(0, 0, 0, 0.08)',
        sharp: '0 2px 8px rgba(0, 0, 0, 0.15)',
        glow: '0 8px 32px rgba(var(--primary-rgb, 0, 0, 0), 0.15)'
    };
    element.style.setProperty('--card-shadow', shadowPresets[config.shadowStyle]);

    // Add mood class
    element.classList.remove('mood-classic', 'mood-modern', 'mood-luxe', 'mood-natural', 'mood-industrial');
    element.classList.add(`mood-${mood}`);
}
