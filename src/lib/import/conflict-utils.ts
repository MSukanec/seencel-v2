/**
 * Import Conflict Detection Utilities
 * 
 * Detects foreign key conflicts in imported data and provides resolution options.
 */

import { ImportConfig, ImportColumn, ForeignKeyOption } from './utils';

// Conflict detection result for a single FK field
export interface FKConflict {
    field: string;                      // Column id (e.g., 'contact_types')
    fieldLabel: string;                 // Human label (e.g., 'Tipo de Contacto')
    table: string;                      // FK table name
    missingValues: string[];            // Values not found in DB
    matchedValues: { original: string; targetId: string; targetLabel: string }[]; // Values found in DB
    existingOptions: ForeignKeyOption[]; // Available options from DB
    allowCreate: boolean;               // Can user create new inline?
}

// User's resolution for a single missing value
export interface FKResolution {
    originalValue: string;
    action: 'create' | 'map' | 'ignore';
    targetId?: string;                  // ID to map to (for 'map' action)
}

// Resolution map: field -> originalValue -> FKResolution
export type ResolutionMap = Record<string, Record<string, FKResolution>>;

/**
 * Detects FK conflicts in the imported data.
 * Returns a list of conflicts, one per FK field that has missing values.
 */
export async function detectConflicts(
    data: Record<string, any>[],
    config: ImportConfig,
    organizationId: string,
    learnedPatterns?: Record<string, Record<string, string>> // { fieldId: { sourceVal: targetId } }
): Promise<FKConflict[]> {
    const conflicts: FKConflict[] = [];

    // Find columns with FK config
    const fkColumns = config.columns.filter(col => col.foreignKey);

    for (const column of fkColumns) {
        if (!column.foreignKey) continue;

        const fkConfig = column.foreignKey;
        const fieldId = String(column.id);

        // Extract unique values from data for this field
        const valuesInData = new Set<string>();
        for (const row of data) {
            const value = row[fieldId];
            if (value && typeof value === 'string' && value.trim()) {
                valuesInData.add(value.trim());
            }
        }

        if (valuesInData.size === 0) continue; // No values to check

        // Fetch existing options from DB
        const existingOptions = await fkConfig.fetchOptions(organizationId);

        // Optimize lookups
        const labelToOption = new Map<string, ForeignKeyOption>();
        const idToOption = new Map<string, ForeignKeyOption>();

        existingOptions.forEach(opt => {
            labelToOption.set(opt.label.toLowerCase(), opt);
            idToOption.set(opt.id, opt);
        });

        const missingValues: string[] = [];
        const matchedValues: { original: string; targetId: string; targetLabel: string }[] = [];

        // Check patterns for this field
        const fieldPatterns = learnedPatterns?.[fieldId] || {};

        for (const value of valuesInData) {
            const lowerValue = value.toLowerCase();

            // 1. Check Learned Patterns (Exact string match)
            if (fieldPatterns[value]) {
                const targetId = fieldPatterns[value];
                const option = idToOption.get(targetId);

                if (option) {
                    matchedValues.push({
                        original: value,
                        targetId: option.id,
                        targetLabel: `[Aprendido] ${option.label}`
                    });
                    continue; // Done with this value
                }
            }

            // 2. String Match
            const match = labelToOption.get(lowerValue);

            if (match) {
                matchedValues.push({
                    original: value,
                    targetId: match.id,
                    targetLabel: match.label
                });
            } else {
                // Try Substring Match first (e.g., "Pesos" matches "Peso Argentino (ARS)")
                const normalizedValue = lowerValue.trim();
                const substringMatch = existingOptions.find(opt => {
                    const normalizedOpt = opt.label.toLowerCase().trim();
                    // Check if one contains the other (handles plurals too)
                    // Also check without last char to handle "Pesos" vs "Peso"
                    const valueRoot = normalizedValue.length > 3 ? normalizedValue.slice(0, -1) : normalizedValue;
                    const optRoot = normalizedOpt.length > 3 ? normalizedOpt.split(' ')[0].slice(0, -1) : normalizedOpt;
                    return normalizedOpt.includes(normalizedValue) ||
                        normalizedValue.includes(normalizedOpt.split(' ')[0]) ||
                        valueRoot === optRoot;
                });

                if (substringMatch) {
                    matchedValues.push({
                        original: value,
                        targetId: substringMatch.id,
                        targetLabel: substringMatch.label
                    });
                } else {
                    // Try Fuzzy Match (Levenshtein)
                    const fuzzyMatch = existingOptions.find(opt => {
                        const normalizedOpt = opt.label.trim().toLowerCase();
                        const distance = levenshteinDistance(normalizedValue, normalizedOpt);
                        // Threshold: Allow 1 error per 4 characters, max 3 errors
                        const allowedErrors = Math.min(3, Math.floor(normalizedValue.length / 4) + 1);
                        return distance <= allowedErrors;
                    });

                    if (fuzzyMatch) {
                        matchedValues.push({
                            original: value,
                            targetId: fuzzyMatch.id,
                            targetLabel: fuzzyMatch.label
                        });
                    } else {
                        missingValues.push(value);
                    }
                }
            }
        }

        // Always push if we have values, because we need to map matched values to IDs too!

        // Always push if we have values, because we need to map matched values to IDs too!
        if (missingValues.length > 0 || matchedValues.length > 0) {
            conflicts.push({
                field: fieldId,
                fieldLabel: column.label,
                table: fkConfig.table,
                missingValues,
                matchedValues,
                existingOptions,
                allowCreate: fkConfig.allowCreate ?? false
            });
        }
    }

    return conflicts;
}



/**
 * Applies resolutions to the data before import.
 * Returns transformed data with FK values replaced by IDs.
 */
export function applyResolutions(
    data: Record<string, any>[],
    config: ImportConfig,
    resolutions: ResolutionMap
): Record<string, any>[] {
    return data.map(row => {
        const newRow = { ...row };

        for (const column of config.columns) {
            if (!column.foreignKey) continue;

            const fieldId = String(column.id);
            const value = row[fieldId];
            const fieldResolutions = resolutions[fieldId];

            if (!value || !fieldResolutions) continue;

            const normalizedValue = String(value).trim().toLowerCase();

            // Check if we have a resolution for this value
            for (const [originalValue, resolution] of Object.entries(fieldResolutions)) {
                if (originalValue.toLowerCase() === normalizedValue) {
                    if (resolution.targetId) {
                        newRow[fieldId] = resolution.targetId; // Replace with resolved ID
                    }
                    break;
                }
            }
        }

        return newRow;
    });
}

/**
 * Filters out rows that have unresolved FK values (user chose 'ignore')
 */
export function filterIgnoredRows(
    data: Record<string, any>[],
    config: ImportConfig,
    resolutions: ResolutionMap
): Record<string, any>[] {
    return data.filter(row => {
        for (const column of config.columns) {
            if (!column.foreignKey) continue;

            const fieldId = String(column.id);
            const value = row[fieldId];
            const fieldResolutions = resolutions[fieldId];

            if (!value || !fieldResolutions) continue;

            const normalizedValue = String(value).trim().toLowerCase();

            for (const [originalValue, resolution] of Object.entries(fieldResolutions)) {
                if (originalValue.toLowerCase() === normalizedValue && resolution.action === 'ignore') {
                    return false; // This row should be ignored
                }
            }
        }

        return true;
    });
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

