"use client";

import { Table } from "@tanstack/react-table";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableExportProps<TData> {
    table: Table<TData>;
}

export function DataTableExport<TData>({
    table,
}: DataTableExportProps<TData>) {
    const generateCsvData = () => {
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
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type: `${type};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCsv = () => {
        const { headers, rows } = generateCsvData();
        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        downloadFile(csvContent, "export.csv", "text/csv");
    };

    const handleExportExcel = () => {
        const { headers, rows } = generateCsvData();
        // For now, we use a CSV with specific encoding that Excel opens easily, 
        // or we could output a simple HTML table which Excel also interprets as a spreadsheet.
        // Using Tab Separated Values (TSV) is also often better for Excel than CSV.
        // Let's stick to CSV for now but verify it opens nicely. 
        // Adding BOM for Excel compatibility with UTF-8.
        const BOM = "\uFEFF";
        const csvContent = BOM + [
            headers.join(","),
            ...rows.map((row) => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        downloadFile(csvContent, "export.csv", "text/csv");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="hidden h-9 lg:flex"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuItem onClick={handleExportCsv}>
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-muted-foreground" />
                    Excel
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
