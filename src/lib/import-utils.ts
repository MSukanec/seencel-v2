

export interface ImportColumn<T = any> {
    id: keyof T;
    label: string;
    required?: boolean;
    description?: string;
    example?: string;
    type?: 'string' | 'number' | 'date' | 'email' | 'phone' | 'currency';
    validation?: (value: any) => string | undefined; // Returns error message if invalid
    normalization?: (value: any) => any; // Transform value before validation/import
}

export interface ImportConfig<T = any> {
    entityLabel: string;
    entityId: string; // Key for machine learning patterns (e.g. 'contacts', 'materials')
    columns: ImportColumn<T>[];
    onImport: (data: T[]) => Promise<{ success: number; errors: any[]; batchId?: string }>;
    onRevert?: (batchId: string) => Promise<void>;
    sampleFileUrl?: string;
}

export interface ParsedRow {
    [key: string]: any;
}

export interface ParseResult {
    data: ParsedRow[];
    headers: string[];
    errors: string[];
    rawPreview?: any[][]; // Top rows for manual header selection
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
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0]; // TODO: Support sheet selection
                const worksheet = workbook.Sheets[firstSheetName];

                // Parse standard "array of arrays" to inspect structure
                const rawData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: "",
                    blankrows: false
                }) as any[][];

                if (!rawData || rawData.length === 0) {
                    resolve({ data: [], headers: [], errors: ["Archivo vacío"], rawPreview: [] });
                    return;
                }

                const headerRowIndex = options?.headerRowIndex ?? 0;

                // Validate if header row exists
                if (headerRowIndex >= rawData.length) {
                    resolve({ data: [], headers: [], errors: ["La fila de encabezado seleccionada no existe"], rawPreview: rawData.slice(0, 20) });
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
                    rawPreview: rawData.slice(0, 20) // Return top 20 rows for preview UI
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

export function findBestMatch(header: string, columns: ImportColumn[]): string | undefined {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Direct match
    const directMatch = columns.find(col =>
        col.id.toString().toLowerCase() === normalizedHeader ||
        col.label.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedHeader
    );
    if (directMatch) return directMatch.id.toString();

    // Partial match (simple heuristic)
    const partialMatch = columns.find(col =>
        normalizedHeader.includes(col.id.toString().toLowerCase()) ||
        col.id.toString().toLowerCase().includes(normalizedHeader)
    );

    if (partialMatch) return partialMatch.id.toString();

    return undefined;
}
