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

/**
 * Format a Date object for database storage (DATE columns).
 * 
 * CRITICAL: This function preserves the LOCAL date without converting to UTC.
 * Use this instead of toISOString() when storing dates in DATE columns.
 * 
 * Problem with toISOString():
 * - User in Argentina (UTC-3) selects Jan 30 at 00:00 local
 * - toISOString() converts to UTC: Jan 29 21:00:00Z
 * - Database DATE column stores only the date part: Jan 29 ❌
 * 
 * @param date - Date object to format
 * @returns String in YYYY-MM-DD format (local date, no timezone conversion)
 * 
 * @example
 * // User selects January 30th in any timezone
 * formatDateForDB(new Date(2026, 0, 30)) // Returns "2026-01-30"
 */
export function formatDateForDB(date: Date | null | undefined): string | null {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Parse a date string from database (DATE columns) back to a local Date object.
 * 
 * CRITICAL: This function prevents the timezone shift that occurs when using
 * new Date("2026-02-02") which JavaScript interprets as UTC midnight.
 * 
 * Problem with new Date("YYYY-MM-DD"):
 * - Database returns "2026-02-02"
 * - new Date("2026-02-02") = Feb 2 at 00:00 UTC
 * - In Argentina (UTC-3) this becomes Feb 1 at 21:00 ❌
 * 
 * Solution: Parse the date components and create a LOCAL date.
 * 
 * @param dateString - String in YYYY-MM-DD format from database
 * @returns Date object representing the LOCAL date at noon (to avoid DST edge cases)
 * 
 * @example
 * // Database returns "2026-02-02"
 * parseDateFromDB("2026-02-02") // Returns Date for Feb 2, 2026 at local noon
 */
export function parseDateFromDB(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;

    // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SS" formats
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    // Create date at noon LOCAL time to avoid any DST edge cases
    return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Format a Date object for database storage with time (TIMESTAMP columns).
 * Preserves local date/time - use when you specifically want local time stored.
 * 
 * For TIMESTAMPTZ columns where you DO want UTC conversion, use toISOString().
 * 
 * @param date - Date object to format  
 * @returns String in YYYY-MM-DD HH:MM:SS format (local time)
 */
export function formatDateTimeForDB(date: Date | null | undefined): string | null {
    if (!date) return null;

    const datePart = formatDateForDB(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${datePart} ${hours}:${minutes}:${seconds}`;
}

