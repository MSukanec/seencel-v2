/**
 * Import Conflict Detection Utilities
 * 
 * Detects foreign key conflicts in imported data and provides resolution options.
 */

import { ImportConfig, ImportColumn, ForeignKeyOption } from './import-utils';

// Conflict detection result for a single FK field
export interface FKConflict {
    field: string;                      // Column id (e.g., 'contact_types')
    fieldLabel: string;                 // Human label (e.g., 'Tipo de Contacto')
    table: string;                      // FK table name
    missingValues: string[];            // Values not found in DB
    existingOptions: ForeignKeyOption[]; // Available options from DB
    allowCreate: boolean;               // Can user create new inline?
}

// User's resolution for a single missing value
export interface FKResolution {
    originalValue: string;
    action: 'create' | 'map' | 'ignore';
    targetId?: string;                  // ID to map to (for 'map' action)
}

// Resolution map: field -> originalValue -> targetId
export type ResolutionMap = Record<string, Record<string, string | null>>;

/**
 * Detects FK conflicts in the imported data.
 * Returns a list of conflicts, one per FK field that has missing values.
 */
export async function detectConflicts(
    data: Record<string, any>[],
    config: ImportConfig,
    organizationId: string
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
                valuesInData.add(value.trim().toLowerCase());
            }
        }

        if (valuesInData.size === 0) continue; // No values to check

        // Fetch existing options from DB
        const existingOptions = await fkConfig.fetchOptions(organizationId);
        const existingLabels = new Set(
            existingOptions.map(opt => opt.label.toLowerCase())
        );

        // Find missing values
        const missingValues: string[] = [];
        for (const value of valuesInData) {
            if (!existingLabels.has(value)) {
                // Get original case from data
                const original = Array.from(
                    new Set(data.map(row => row[fieldId]))
                ).find(v => v && v.toLowerCase() === value);
                if (original) missingValues.push(original);
            }
        }

        if (missingValues.length > 0) {
            conflicts.push({
                field: fieldId,
                fieldLabel: column.label,
                table: fkConfig.table,
                missingValues,
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
            for (const [originalValue, targetId] of Object.entries(fieldResolutions)) {
                if (originalValue.toLowerCase() === normalizedValue) {
                    newRow[fieldId] = targetId; // Replace with resolved ID
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

            for (const [originalValue, targetId] of Object.entries(fieldResolutions)) {
                if (originalValue.toLowerCase() === normalizedValue && targetId === null) {
                    return false; // This row should be ignored
                }
            }
        }

        return true;
    });
}

