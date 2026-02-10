"use client";

import * as XLSX from 'xlsx';

/**
 * Column definition for export.
 * Maps data keys to human-readable headers.
 */
export interface ExportColumn<T> {
    /** Key in the data object */
    key: keyof T;
    /** Human-readable header label */
    header: string;
    /** Optional transform function for the value */
    transform?: (value: any, row: T) => string | number;
}

interface ExportOptions<T> {
    /** Data rows to export */
    data: T[];
    /** Column definitions */
    columns: ExportColumn<T>[];
    /** File name without extension */
    fileName: string;
    /** Sheet name (Excel only) */
    sheetName?: string;
}

/**
 * Transform data rows using column definitions into a 2D array
 * with headers as the first row.
 */
function transformData<T>(data: T[], columns: ExportColumn<T>[]): (string | number)[][] {
    const headers = columns.map(col => col.header);
    const rows = data.map(row =>
        columns.map(col => {
            const value = row[col.key];
            if (col.transform) return col.transform(value, row);
            if (value === null || value === undefined) return '';
            return value as string | number;
        })
    );
    return [headers, ...rows];
}

/**
 * Trigger a browser download for a Blob.
 */
function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and trigger download.
 */
export function exportToCSV<T>(options: ExportOptions<T>) {
    const { data, columns, fileName } = options;
    const rows = transformData(data, columns);

    const csvContent = rows.map(row =>
        row.map(cell => {
            const str = String(cell);
            // Escape cells with commas, quotes, or newlines
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',')
    ).join('\n');

    // BOM for UTF-8 Excel compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${fileName}.csv`);
}

/**
 * Export data to Excel (.xlsx) and trigger download.
 */
export function exportToExcel<T>(options: ExportOptions<T>) {
    const { data, columns, fileName, sheetName = 'Datos' } = options;
    const rows = transformData(data, columns);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Auto-size columns based on content
    const colWidths = columns.map((col, i) => {
        const maxLen = Math.max(
            col.header.length,
            ...data.map(row => {
                const val = col.transform
                    ? col.transform(row[col.key], row)
                    : row[col.key];
                return String(val ?? '').length;
            })
        );
        return { wch: Math.min(maxLen + 2, 40) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadBlob(blob, `${fileName}.xlsx`);
}
