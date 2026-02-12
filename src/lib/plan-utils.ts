/**
 * Utility functions for plan name translations and display
 */

/**
 * Maps plan names from database to translated display names
 * FREE → Gratis
 * PRO → Profesional
 * TEAMS → Equipos
 */
const PLAN_NAME_MAP: Record<string, string> = {
    'free': 'Esencial',
    'essential': 'Esencial',
    'pro': 'Profesional',
    'teams': 'Equipos',
    'enterprise': 'Empresa',
};

/**
 * Returns the translated display name for a plan
 * @param planName - The plan name from database (e.g., "Free", "Pro", "Teams")
 * @returns The translated name (e.g., "Gratis", "Profesional", "Equipos")
 */
export function getPlanDisplayName(planName: string): string {
    const lower = planName.toLowerCase();
    return PLAN_NAME_MAP[lower] || planName;
}

/**
 * Returns the original plan key from a display name (reverse lookup)
 * Useful for comparisons and logic that needs the original key
 */
export function getPlanKey(planName: string): string {
    const lower = planName.toLowerCase();
    // Check if it's already a key
    if (PLAN_NAME_MAP[lower]) return lower;

    // Reverse lookup
    for (const [key, value] of Object.entries(PLAN_NAME_MAP)) {
        if (value.toLowerCase() === lower) return key;
    }

    return lower;
}
