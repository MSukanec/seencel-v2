/**
 * Theme Customizer
 * 
 * Shared utilities for extracting color palettes from images,
 * analyzing palettes, and selecting specific image zones.
 */

// Types
export type { CuratedPalette, ExtractedColor, OklchColor } from './types/palette';

// Lib
export { extractColorsFromImage, rgbToOklch, oklchToCss } from './lib/color-extraction';
export { generateRefinedPalette, isPaletteLightMode } from './lib/palette-analysis';

// Components
export { PhotoZoneSelector } from './photo-zone-selector';
