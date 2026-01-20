/**
 * Curated list of common timezones for user selection
 * Organized by region, sorted by offset within each group
 */

// LATAM timezones (main focus)
const LATAM_TIMEZONES = [
    { value: "America/Argentina/Buenos_Aires", label: "🇦🇷 Argentina" },
    { value: "America/Santiago", label: "🇨🇱 Chile" },
    { value: "America/Montevideo", label: "🇺🇾 Uruguay" },
    { value: "America/Asuncion", label: "🇵🇾 Paraguay" },
    { value: "America/Sao_Paulo", label: "🇧🇷 Brasil" },
    { value: "America/Lima", label: "🇵🇪 Perú" },
    { value: "America/Bogota", label: "🇨🇴 Colombia" },
    { value: "America/Caracas", label: "🇻🇪 Venezuela" },
    { value: "America/La_Paz", label: "🇧🇴 Bolivia" },
    { value: "America/Guayaquil", label: "🇪🇨 Ecuador" },
    { value: "America/Mexico_City", label: "🇲🇽 México" },
    { value: "America/Panama", label: "🇵🇦 Panamá" },
] as const;

// Other common timezones
const OTHER_TIMEZONES = [
    { value: "America/New_York", label: "🇺🇸 Eastern (New York)" },
    { value: "America/Los_Angeles", label: "🇺🇸 Pacific (Los Angeles)" },
    { value: "Europe/Madrid", label: "🇪🇸 España" },
    { value: "Europe/London", label: "🇬🇧 Reino Unido" },
    { value: "UTC", label: "🌐 UTC" },
] as const;

// Combined export for UI
export const TIMEZONES = [...LATAM_TIMEZONES, ...OTHER_TIMEZONES];

export const TIMEZONE_GROUPS = {
    latam: {
        label: "Latinoamérica",
        timezones: LATAM_TIMEZONES,
    },
    other: {
        label: "Otros",
        timezones: OTHER_TIMEZONES,
    },
};

export type TimezoneValue = typeof TIMEZONES[number]['value'];

/**
 * Get timezone label from value
 */
export function getTimezoneLabel(value: string): string {
    const tz = TIMEZONES.find(t => t.value === value);
    return tz?.label || value;
}

/**
 * Detect browser's timezone
 */
export function detectBrowserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return "UTC";
    }
}

/**
 * Check if a timezone value is in our curated list
 */
export function isKnownTimezone(value: string): boolean {
    return TIMEZONES.some(t => t.value === value);
}
