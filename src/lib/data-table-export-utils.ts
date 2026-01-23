import { Table } from "@tanstack/react-table";

// Helper to extract data
function generateCsvData<TData>(table: Table<TData>) {
    // Get headers
    const headers = table
        .getAllColumns()
        .filter((column) => column.getIsVisible())
        .map((column) => {
            const header = column.columnDef.header;
            if (typeof header === 'string') return header;
            return column.id;
        });

    // Get data
    const rows = table.getFilteredRowModel().rows.map((row) => {
        return table
            .getAllColumns()
            .filter((column) => column.getIsVisible())
            .map((column) => {
                const value = row.getValue(column.id);
                if (Array.isArray(value)) {
                    return value.map(v => typeof v === 'object' ? v.name || v.label || JSON.stringify(v) : v).join(", ");
                }
                if (typeof value === 'object' && value !== null) {
                    return JSON.stringify(value);
                }
                return value;
            });
    });

    return { headers, rows };
}

function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportTableToCsv<TData>(table: Table<TData>, filename = "export.csv") {
    const { headers, rows } = generateCsvData(table);
    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    downloadFile(csvContent, filename, "text/csv");
}

export function exportTableToExcel<TData>(table: Table<TData>, filename = "export.csv") {
    const { headers, rows } = generateCsvData(table);
    const BOM = "\uFEFF";
    const csvContent = BOM + [
        headers.join(","),
        ...rows.map((row) => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    downloadFile(csvContent, filename, "text/csv");
}
