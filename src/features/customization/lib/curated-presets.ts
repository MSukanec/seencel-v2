/**
 * Curated Palette Presets
 * 
 * Paletas pre-diseñadas inspiradas en estilos de diseño interior.
 * Cada una está cuidadosamente balanceada para verse profesional.
 */

import type { PalettePreset } from '../types/palette';

export const CURATED_PRESETS: PalettePreset[] = [
    {
        id: 'earth-terracotta',
        name: 'Terracotta Earth',
        description: 'Cálido y natural, inspirado en arcilla y tierra',
        palette: {
            id: 'earth-terracotta',
            name: 'Terracotta Earth',
            source: 'preset',
            colors: {
                background: 'oklch(12% 0.02 40)',
                backgroundSubtle: 'oklch(14% 0.025 40)',
                foreground: 'oklch(95% 0.015 50)',
                primary: 'oklch(62% 0.14 45)',        // Terracotta
                primaryForeground: 'oklch(98% 0 0)',
                accent: 'oklch(55% 0.10 85)',         // Olive gold
                accentForeground: 'oklch(98% 0 0)',
                muted: 'oklch(22% 0.03 40)',
                mutedForeground: 'oklch(65% 0.03 45)',
                border: 'oklch(28% 0.04 42)',
                card: 'oklch(16% 0.025 40)',
                cardForeground: 'oklch(95% 0.015 50)',
            }
        }
    },
    {
        id: 'nordic-frost',
        name: 'Nordic Frost',
        description: 'Minimalista escandinavo con toques glaciales',
        palette: {
            id: 'nordic-frost',
            name: 'Nordic Frost',
            source: 'preset',
            colors: {
                background: 'oklch(13% 0.015 220)',
                backgroundSubtle: 'oklch(15% 0.02 220)',
                foreground: 'oklch(96% 0.01 210)',
                primary: 'oklch(70% 0.12 210)',       // Ice blue
                primaryForeground: 'oklch(12% 0.02 220)',
                accent: 'oklch(65% 0.08 180)',        // Teal
                accentForeground: 'oklch(98% 0 0)',
                muted: 'oklch(20% 0.015 220)',
                mutedForeground: 'oklch(60% 0.02 215)',
                border: 'oklch(25% 0.02 220)',
                card: 'oklch(16% 0.018 220)',
                cardForeground: 'oklch(96% 0.01 210)',
            }
        }
    },
    {
        id: 'midnight-jade',
        name: 'Midnight Jade',
        description: 'Elegante y sofisticado con verde jade',
        palette: {
            id: 'midnight-jade',
            name: 'Midnight Jade',
            source: 'preset',
            colors: {
                background: 'oklch(10% 0.02 160)',
                backgroundSubtle: 'oklch(12% 0.025 160)',
                foreground: 'oklch(95% 0.015 155)',
                primary: 'oklch(60% 0.13 165)',       // Jade green
                primaryForeground: 'oklch(98% 0 0)',
                accent: 'oklch(72% 0.08 90)',         // Soft gold
                accentForeground: 'oklch(15% 0.02 160)',
                muted: 'oklch(18% 0.025 160)',
                mutedForeground: 'oklch(58% 0.04 160)',
                border: 'oklch(24% 0.03 160)',
                card: 'oklch(14% 0.025 160)',
                cardForeground: 'oklch(95% 0.015 155)',
            }
        }
    },
    {
        id: 'blush-marble',
        name: 'Blush & Marble',
        description: 'Lujoso y femenino con rosa empolvado',
        palette: {
            id: 'blush-marble',
            name: 'Blush & Marble',
            source: 'preset',
            colors: {
                background: 'oklch(12% 0.015 350)',
                backgroundSubtle: 'oklch(14% 0.02 350)',
                foreground: 'oklch(96% 0.01 350)',
                primary: 'oklch(70% 0.12 350)',       // Blush pink
                primaryForeground: 'oklch(15% 0.02 350)',
                accent: 'oklch(75% 0.06 60)',         // Warm cream
                accentForeground: 'oklch(20% 0.02 350)',
                muted: 'oklch(20% 0.02 350)',
                mutedForeground: 'oklch(62% 0.03 350)',
                border: 'oklch(26% 0.025 350)',
                card: 'oklch(15% 0.018 350)',
                cardForeground: 'oklch(96% 0.01 350)',
            }
        }
    },
    {
        id: 'urban-concrete',
        name: 'Urban Concrete',
        description: 'Industrial moderno con acentos cobre',
        palette: {
            id: 'urban-concrete',
            name: 'Urban Concrete',
            source: 'preset',
            colors: {
                background: 'oklch(14% 0.005 280)',
                backgroundSubtle: 'oklch(16% 0.008 280)',
                foreground: 'oklch(92% 0.005 280)',
                primary: 'oklch(65% 0.12 55)',        // Copper
                primaryForeground: 'oklch(98% 0 0)',
                accent: 'oklch(55% 0.08 200)',        // Steel blue
                accentForeground: 'oklch(98% 0 0)',
                muted: 'oklch(22% 0.005 280)',
                mutedForeground: 'oklch(58% 0.01 280)',
                border: 'oklch(28% 0.008 280)',
                card: 'oklch(17% 0.006 280)',
                cardForeground: 'oklch(92% 0.005 280)',
            }
        }
    },
    {
        id: 'ocean-dusk',
        name: 'Ocean at Dusk',
        description: 'Profundo y misterioso con violetas marinos',
        palette: {
            id: 'ocean-dusk',
            name: 'Ocean at Dusk',
            source: 'preset',
            colors: {
                background: 'oklch(11% 0.025 270)',
                backgroundSubtle: 'oklch(13% 0.03 270)',
                foreground: 'oklch(95% 0.01 260)',
                primary: 'oklch(62% 0.15 280)',       // Deep violet
                primaryForeground: 'oklch(98% 0 0)',
                accent: 'oklch(68% 0.12 200)',        // Teal blue
                accentForeground: 'oklch(98% 0 0)',
                muted: 'oklch(18% 0.025 270)',
                mutedForeground: 'oklch(58% 0.04 270)',
                border: 'oklch(24% 0.03 270)',
                card: 'oklch(14% 0.028 270)',
                cardForeground: 'oklch(95% 0.01 260)',
            }
        }
    }
];
