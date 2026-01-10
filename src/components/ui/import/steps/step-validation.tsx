"use client";

import { useMemo } from "react";
import { ImportConfig } from "@/lib/import-utils";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ImportStepValidationProps {
    config: ImportConfig;
    data: any[];
}

export function ImportStepValidation({ config, data }: ImportStepValidationProps) {
    const t = useTranslations('ImportSystem.Validation');
    const validationResults = useMemo(() => {
        let validCount = 0;
        let invalidCount = 0;
        const processedRows = data.map((originalRow, index) => {
            const errors: string[] = [];
            const currentRowData: Record<string, any> = {}; // To store normalized values

            config.columns.forEach(col => {
                let value = (originalRow as any)[col.id as string]; // Get original value w/ cast

                // Apply normalization
                if (col.normalization) {
                    value = col.normalization(value);
                }

                // Store the (potentially normalized) value
                currentRowData[col.id as string] = value;

                // Validate requirements
                // Check for undefined, null, or empty string for required fields
                if (col.required && (value === undefined || value === null || value === "")) {
                    errors.push(`${col.label} es requerido`);
                }

                // Custom validation
                // Only validate if value exists after normalization and is not an empty string
                if (col.validation && value !== undefined && value !== null && value !== "") {
                    const error = col.validation(value);
                    if (error) errors.push(error);
                }
            });

            if (errors.length === 0) validCount++;
            else invalidCount++;

            // Return the row with normalized data, errors, and index
            return { ...currentRowData, __errors: errors, __index: index };
        });

        return { validCount, invalidCount, processedRows };
    }, [data, config.columns]);

    const { validCount, invalidCount, processedRows } = validationResults;
    const hasErrors = invalidCount > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
        >
            <div className="grid grid-cols-2 gap-4 p-6 pb-2">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-700">{validCount}</div>
                        <div className="text-xs font-medium text-green-600/80 uppercase">{t('summary.validRecords')}</div>
                    </div>
                </div>
                <div className={cn(
                    "border rounded-lg p-4 flex items-center gap-3",
                    hasErrors ? "bg-red-500/10 border-red-500/20" : "bg-muted/10 border-border"
                )}>
                    <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        hasErrors ? "bg-red-500/20 text-red-600" : "bg-muted text-muted-foreground"
                    )}>
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <div className={cn("text-2xl font-bold", hasErrors ? "text-red-700" : "text-muted-foreground")}>
                            {invalidCount}
                        </div>
                        <div className={cn("text-xs font-medium uppercase", hasErrors ? "text-red-600/80" : "text-muted-foreground")}>
                            {t('summary.errorsFound')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 pt-2 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{t('preview')}</h3>
                    <div className="text-xs text-muted-foreground">
                        {t('showingRows', { count: Math.min(processedRows.length, 50) })}
                    </div>
                </div>

                <div className="flex-1 border rounded-md overflow-hidden bg-background">
                    <ScrollArea className="h-full">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">#</TableHead>
                                    <TableHead className="w-[60px]">Estado</TableHead>
                                    {config.columns.map(col => (
                                        <TableHead key={col.id.toString()}>{col.label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processedRows.slice(0, 50).map((row) => (
                                    <TableRow key={row.__index} className={row.__errors.length > 0 ? "bg-red-50 dark:bg-red-950/10" : ""}>
                                        <TableCell className="text-center text-xs text-muted-foreground">
                                            {row.__index + 1}
                                        </TableCell>
                                        <TableCell>
                                            {row.__errors.length === 0 ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <div className="group relative">
                                                    <AlertCircle className="h-4 w-4 text-red-500 cursor-help" />
                                                    <div className="absolute left-6 top-0 hidden group-hover:block z-50 w-64 p-2 bg-destructive text-destructive-foreground text-xs rounded shadow-lg pointer-events-none">
                                                        <ul className="list-disc list-inside">
                                                            {row.__errors.map((e: string, i: number) => (
                                                                <li key={i}>{e}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        {config.columns.map(col => (
                                            <TableCell key={col.id.toString()} className="text-sm">
                                                {(row as any)[col.id] || <span className="text-muted-foreground italic">-</span>}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </div>


        </motion.div>
    );
}
