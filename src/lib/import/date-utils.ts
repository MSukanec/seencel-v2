/**
 * Core import utilities - date parsing helper
 */

/**
 * Parses dates in multiple formats commonly used in Excel/CSV imports.
 * Handles:
 * - Excel serial numbers (e.g., 45883 = some date in 2025)
 * - DD-MM-YY or DD/MM/YY (Latin American format)
 * - DD-MM-YYYY or DD/MM/YYYY
 * - YYYY-MM-DD (ISO format)
 * - MM/DD/YYYY (US format)
 * - JavaScript Date objects (from xlsx cellDates: true)
 * @returns Date object or null if parsing fails
 */
export function parseFlexibleDate(value: any): Date | null {
    if (!value) return null;

    // Already a Date object (from xlsx with cellDates: true)
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value;
    }

    // Excel serial number (number of days since 1900-01-01, with Excel's quirk)
    if (typeof value === 'number' && value > 0 && value < 100000) {
        // Excel epoch is 1900-01-01, but Excel incorrectly considers 1900 a leap year
        // Days need adjustment: Excel day 1 = 1900-01-01
        const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
        const result = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        if (!isNaN(result.getTime())) return result;
    }

    const str = String(value).trim();

    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) return parsed;
    }

    // DD-MM-YY or DD/MM/YY (common in Latin America)
    let match = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/);
    if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // 0-indexed
        let year = parseInt(match[3], 10);
        // Assume 2000s for years 00-99
        year = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
        const result = new Date(year, month, day);
        if (!isNaN(result.getTime())) return result;
    }

    // DD-MM-YYYY or DD/MM/YYYY
    match = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const result = new Date(year, month, day);
        if (!isNaN(result.getTime())) return result;
    }

    // MM/DD/YYYY (US format) - try as fallback
    match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
        const month = parseInt(match[1], 10) - 1;
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const result = new Date(year, month, day);
        // Only accept if month <= 12 (could be DD/MM/YYYY)
        if (!isNaN(result.getTime()) && month < 12) return result;
    }

    // Generic Date.parse fallback
    const generic = new Date(str);
    if (!isNaN(generic.getTime())) return generic;

    return null;
}
