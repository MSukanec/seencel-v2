export const normalizeEmail = (value: any): string => {
    if (!value) return "";
    return String(value).trim().toLowerCase();
};

export const normalizePhone = (value: any): string => {
    if (!value) return "";
    // Remove all non-numeric characters
    let cleaned = String(value).replace(/\D/g, '');

    // Legacy system logic for Argentina:
    // If starts with 0, remove it.
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // If it's a mobile number (15...) or just 10 digits, we might want to standardize
    // For now, let's just ensure it's clean digits. 
    // Ideally we would prepend country code if missing, but let's keep it safe.

    return cleaned;
};

export const normalizeCurrency = (value: any): number | null => {
    if (!value) return null;
    if (typeof value === 'number') return value;

    const str = String(value).trim();

    // Handle formats like "$ 1.500,00" (AR/EU) vs "$ 1,500.00" (US)
    // Detection logic:
    // If comma comes after dot, or only comma exists -> likely decimal comma (1.000,00 or 100,00)
    // If dot comes after comma, or only dot exists -> likely decimal dot (1,000.00 or 100.00)

    let cleanStr = str.replace(/[^0-9.,-]/g, ''); // Remove symbols

    const lastDot = cleanStr.lastIndexOf('.');
    const lastComma = cleanStr.lastIndexOf(',');

    if (lastComma > lastDot) {
        // Decimal separator is comma
        cleanStr = cleanStr.replace(/\./g, ''); // Remove thousand separators (dots)
        cleanStr = cleanStr.replace(',', '.');  // Replace decimal comma with dot
    } else {
        // Decimal separator is dot
        cleanStr = cleanStr.replace(/,/g, ''); // Remove thousand separators (commas)
    }

    const num = parseFloat(cleanStr);
    return isNaN(num) ? null : num;
};

export const normalizeDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;

    // Excel serial number?
    if (typeof value === 'number') {
        // Excel base date is 1900-01-01
        // This is a simplified conversion, might need moment/date-fns for robust timezone handling
        return new Date(Math.round((value - 25569) * 86400 * 1000));
    }

    const str = String(value).trim();
    // Try standard parsing
    const date = new Date(str);
    if (!isNaN(date.getTime())) return date;

    // Try DD/MM/YYYY
    const parts = str.split(/[\/\-]/);
    if (parts.length === 3) {
        // Assume DD/MM/YYYY if first part > 12 likely, but strict DD/MM/YYYY is safer for LATAM
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
};

