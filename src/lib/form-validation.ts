/**
 * Form Validation Utilities
 *
 * Client-side validation for panel forms.
 * Pattern: validate required fields BEFORE closing the panel.
 *
 * Usage:
 *   const error = validateRequired([
 *       { value: name, label: "El nombre" },
 *       { value: unitId, label: "La unidad" },
 *   ]);
 *   if (error) {
 *       toast.error(error);
 *       return; // Panel stays open
 *   }
 *   // Safe to close optimistically
 *   closePanel();
 */

interface RequiredField {
    /** The field value to check */
    value: unknown;
    /** Human-readable label for the error message (e.g. "La unidad", "El nombre") */
    label: string;
}

/**
 * Validates that all required fields have values.
 * Returns an error message string if validation fails, or null if valid.
 *
 * Checks:
 * - `null`, `undefined`, `""` → invalid
 * - Strings with only whitespace → invalid
 * - `0` and `false` → valid (they are intentional values)
 * - Arrays → must have at least one element
 */
export function validateRequired(fields: RequiredField[]): string | null {
    for (const { value, label } of fields) {
        if (value === null || value === undefined) {
            return `${label} es requerido/a`;
        }
        if (typeof value === "string" && value.trim() === "") {
            return `${label} es requerido/a`;
        }
        if (Array.isArray(value) && value.length === 0) {
            return `${label} es requerido/a`;
        }
    }
    return null;
}
