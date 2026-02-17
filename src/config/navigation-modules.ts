/**
 * Navigation Modules — Config central de visibilidad del sidebar
 * 
 * Define los módulos de navegación y cómo mapean a los accordions del sidebar.
 * Cada accordion del sidebar tiene un módulo asociado — si el módulo no está
 * en la lista de visibles del usuario, el accordion no se muestra.
 * 
 * Niveles de resolución:
 * 1. Org Mode (profesional/proveedor) → define qué set de nav groups base se usa (futuro)
 * 2. User Type (miembro/externo) → determina si ve accordions estándar o portales propios
 * 3. Preferences → miembros pueden ocultar módulos según su industria
 */

// ============================================
// Module Types
// ============================================

/**
 * Módulos de navegación del sistema.
 * Mapean 1:1 con los accordion IDs del sidebar en use-sidebar-navigation.ts
 */
export type NavModule =
    | 'overview'        // "principal" — Visión General
    | 'management'      // "gestion" — Proyectos, Docs, Contactos, Catálogo, Config, Presupuestos, Informes
    | 'construction'    // "construccion" — Tareas, Materiales, MO, Subcontratos, Sitelog, Salud
    | 'finance';        // "finanzas" — Finanzas, Capital, Gastos Generales, Clientes

// ============================================
// Module ↔ Accordion Mapping
// ============================================

/** Mapeo: módulo → accordion ID del sidebar */
export const MODULE_TO_ACCORDION_ID: Record<NavModule, string> = {
    overview: 'principal',
    management: 'gestion',
    construction: 'construccion',
    finance: 'finanzas',
};

/** Mapeo inverso: accordion ID → módulo */
export const ACCORDION_TO_MODULE: Record<string, NavModule> = {
    principal: 'overview',
    gestion: 'management',
    construccion: 'construction',
    finanzas: 'finance',
};

// ============================================
// Defaults & Presets
// ============================================

/** Todos los módulos — default para miembros sin preferencia específica */
export const ALL_MODULES: NavModule[] = ['overview', 'management', 'construction', 'finance'];

/**
 * Presets de visibilidad para miembros según industria/rubro.
 * Se aplica al onboarding cuando el usuario indica su actividad.
 * Siempre editable después desde configuración.
 */
export const MEMBER_INDUSTRY_PRESETS: Record<string, NavModule[]> = {
    // Constructora o empresa de obra: ve todo
    construction_firm: ['overview', 'management', 'construction', 'finance'],
    // Estudio de diseño/arquitectura: sin construcción
    design_studio: ['overview', 'management', 'finance'],
    // General / sin especificar: ve todo
    general: ['overview', 'management', 'construction', 'finance'],
};

// ============================================
// Helpers
// ============================================

/**
 * Determina si un accordion del sidebar debe mostrarse
 * dado un conjunto de módulos visibles.
 */
export function isAccordionVisible(accordionId: string, visibleModules: NavModule[]): boolean {
    const module = ACCORDION_TO_MODULE[accordionId];
    // Si el accordion no tiene módulo asociado, siempre se muestra
    if (!module) return true;
    return visibleModules.includes(module);
}
