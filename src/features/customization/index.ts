/**
 * Feature: Customization
 * 
 * Sistema de personalización UX/UI para usuarios de Seencel.
 * Incluye: paletas curadas, extracción desde imagen, temas.
 * 
 * ⚠️ EXPERIMENTAL - En desarrollo activo
 */

// Types
export * from './types';
export type { CuratedPalette, ExtractedColor, OklchColor, PalettePreset } from './types/palette';

// Lib
export { extractColorsFromImage, rgbToOklch, oklchToCss } from './lib/color-extraction';
export { generateCuratedPalette, applyPaletteToDocument, applyPaletteToElement, resetPalette } from './lib/palette-mapping';
export { CURATED_PRESETS } from './lib/curated-presets';

// Components
export { ThemeSelector } from './components/theme-selector';
export { CustomizationClientWrapper } from './components/client-wrapper';
export { PaletteExtractor } from './components/palette-extractor';
export { PalettePresetGrid } from './components/palette-preset-grid';
export { PalettePlayground } from './components/palette-playground';
export { DesignerPlayground } from './components/designer-playground';

// Provider
export { CustomizationProvider, useCustomization } from './provider';
