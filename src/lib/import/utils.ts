

// Foreign Key Configuration for import conflict resolution
export interface ForeignKeyOption {
    id: string;
    label: string;
}

export interface ForeignKeyConfig {
    table: string;                                                    // Table name for reference
    labelField: string;                                               // Field used in Excel (e.g., 'name')
    valueField: string;                                               // Field to use as ID (e.g., 'id')
    fetchOptions: (orgId: string) => Promise<ForeignKeyOption[]>;     // Get existing options
    allowCreate?: boolean;                                            // Can user create new values inline?
    createAction?: (orgId: string, value: string) => Promise<{ id: string }>; // Create new option
}

export interface ImportColumn<T = any> {
    id: keyof T;
    label: string;
    required?: boolean;
    description?: string;
    example?: string;
    type?: 'string' | 'number' | 'date' | 'email' | 'phone' | 'currency';
    validation?: (value: any) => string | undefined; // Returns error message if invalid
    normalization?: (value: any) => any; // Transform value before validation/import
    foreignKey?: ForeignKeyConfig; // FK resolution config
    unique?: boolean; // Check for duplicates in DB
}


export interface ImportConfig<T = any> {
    entityLabel: string;
    entityId: string; // Key for machine learning patterns (e.g. 'contacts', 'materials')
    columns: ImportColumn<T>[];
    onImport: (data: T[]) => Promise<{ success: number; errors: any[]; batchId?: string }>;
    onRevert?: (batchId: string) => Promise<void>;
    sampleFileUrl?: string;
    /** Description shown in the first step explaining what this import does */
    description?: string;
    /** Path to documentation for this import (e.g. '/docs/materiales/importar') */
    docsPath?: string;
    /** AI-powered analysis config — when present, offers AI structure detection after upload */
    aiAnalyzer?: {
        /** Server action that analyzes raw Excel rows with AI */
        analyzeAction: (rows: any[][], headerRowIndex: number) => Promise<
            { success: true; data: import("@/features/ai/types").AIAnalysisResult } |
            { success: false; error: string }
        >;
        /** Server action that imports the AI-analyzed data in batch */
        onImportAI: (result: import("@/features/ai/types").AIAnalysisResult) => Promise<
            { success: number; errors: any[]; batchId?: string }
        >;
    };
}

export interface ParsedRow {
    [key: string]: any;
}

export interface ParseResult {
    data: ParsedRow[];
    headers: string[];
    errors: string[];
    rawData?: any[][]; // All raw rows as 2D array (for AI analysis and header selection)
}

import * as XLSX from 'xlsx';

export interface ParseOptions {
    headerRowIndex?: number; // 0-based index of the header row
}

export async function parseFile(file: File, options?: ParseOptions): Promise<ParseResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                // cellDates: true converts Excel serial dates to JS Date objects
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const firstSheetName = workbook.SheetNames[0]; // TODO: Support sheet selection
                const worksheet = workbook.Sheets[firstSheetName];

                // Parse standard "array of arrays" to inspect structure
                const rawData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: "",
                    blankrows: false
                }) as any[][];

                if (!rawData || rawData.length === 0) {
                    resolve({ data: [], headers: [], errors: ["Archivo vacío"], rawData: [] });
                    return;
                }

                const headerRowIndex = options?.headerRowIndex ?? 0;

                // Validate if header row exists
                if (headerRowIndex >= rawData.length) {
                    resolve({ data: [], headers: [], errors: ["La fila de encabezado seleccionada no existe"], rawData: rawData });
                    return;
                }

                // Get headers from the selected row
                const headers = rawData[headerRowIndex].map(h => String(h).trim());

                // Parse DATA rows (everything AFTER the header row)
                // We use sheet_to_json with 'range' option to skip rows above header
                const rows = XLSX.utils.sheet_to_json(worksheet, {
                    header: headers,
                    range: headerRowIndex + 1, // Start reading data immediately after header
                    defval: ""
                }) as ParsedRow[];

                resolve({
                    data: rows,
                    headers: headers,
                    errors: [],
                    rawData: rawData // Return all raw rows (for AI and header selection UI)
                });

            } catch (error: any) {
                resolve({
                    data: [],
                    headers: [],
                    errors: [error.message || "Error al leer archivo"]
                });
            }
        };

        reader.onerror = (error) => {
            resolve({
                data: [],
                headers: [],
                errors: ["Error de lectura de archivo"]
            });
        };

        reader.readAsBinaryString(file);
    });
}

// Enterprise-grade string normalization
// Handles accents (diacritics), trimming, casing, and special characters.
// "Teléfono" -> "telefono"
// "  Ubicación  " -> "ubicacion"
export function normalizeString(str: string | null | undefined): string {
    if (!str) return "";
    return String(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .toLowerCase()
        .trim();
}

/**
 * Finds the best column match for a given header.
 * Uses normalized comparison to handle accents and casing.
 */
export function findBestMatch(header: string, columns: ImportColumn[]): string | undefined {
    // Aggressive normalization for matching (remove all non-alphanumeric)
    // "E-mail" -> "email", "Teléfono" -> "telefono"
    const clean = (s: string) => normalizeString(s).replace(/[^a-z0-9]/g, "");

    const normalizedHeader = clean(header);

    // Direct match with normalized strings
    const directMatch = columns.find(col =>
        clean(col.id.toString()) === normalizedHeader ||
        clean(col.label) === normalizedHeader
    );
    if (directMatch) return directMatch.id.toString();

    // Partial match (simple heuristic)
    const partialMatch = columns.find(col =>
        normalizedHeader.includes(clean(col.id.toString())) ||
        clean(col.id.toString()).includes(normalizedHeader) ||
        normalizedHeader.includes(clean(col.label)) ||
        clean(col.label).includes(normalizedHeader)
    );

    if (partialMatch) return partialMatch.id.toString();

    return undefined;
}

