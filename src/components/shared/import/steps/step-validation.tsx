"use client";

import { useMemo, useState, useEffect } from "react";
import { ImportConfig } from "@/lib/import-utils";
import { checkDuplicates } from "@/actions/validation-actions"; // Import the server action

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
import { AlertCircle, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ImportStepValidationProps {
    config: ImportConfig;
    data: any[];
    organizationId: string;
}

export function ImportStepValidation({ config, data, organizationId }: ImportStepValidationProps) {
    const t = useTranslations('ImportSystem.Validation');
    const [dbDuplicates, setDbDuplicates] = useState<Record<string, Set<string>>>({}); // colId -> Set of lowercase duplicate values
    const [isValidating, setIsValidating] = useState(false);

    // 1. Async Database Duplicate Check
    useEffect(() => {
        const checkDbDuplicates = async () => {
            const uniqueCols = config.columns.filter(c => c.unique);
            if (uniqueCols.length === 0) return;

            setIsValidating(true);
            const newDbDuplicates: Record<string, Set<string>> = {};

            try {
                // Check all unique columns in parallel
                await Promise.all(uniqueCols.map(async (col) => {
                    const values = data.map(row => row[col.id as string]).filter(Boolean);
                    if (values.length === 0) return;

                    const tableMap: Record<string, string> = {
                        'contact': 'contacts',
                        'contactos': 'contacts',
                        'product': 'products',
                        'productos': 'products'
                    };
                    const tableName = tableMap[config.entityId] || config.entityId;

                    // Call server action to check for duplicates
                    const duplicates = await checkDuplicates(
                        organizationId,
                        tableName,
                        col.id as string,
                        values
                    );

                    if (duplicates.length > 0) {
                        newDbDuplicates[col.id as string] = new Set(
                            duplicates.map(d => String(d).toLowerCase())
                        );
                    }
                }));

                setDbDuplicates(newDbDuplicates);
            } catch (error) {
                console.error("Validation failed", error);
            } finally {
                setIsValidating(false);
            }
        };

        if (organizationId) {
            checkDbDuplicates();
        }
    }, [data, config.columns, organizationId]);


    // Validation Calculation
    const validationResults = useMemo(() => {
        let validCount = 0;
        let invalidCount = 0;
        const processedRows = data.map((originalRow, index) => {
            const errors: string[] = [];
            const warnings: string[] = [];
            const currentRowData: Record<string, any> = {};

            config.columns.forEach(col => {
                let value = (originalRow as any)[col.id as string];

                // Normalization
                if (col.normalization) value = col.normalization(value);
                currentRowData[col.id as string] = value;

                // 1. Required Check
                if (col.required && (value === undefined || value === null || value === "")) {
                    errors.push(`${col.label} es requerido`);
                }

                // 2. Format Validation
                if (col.validation && value) {
                    const error = col.validation(value);
                    if (error) errors.push(error);
                }

                // 3. Database Duplicate Check (injected via state)
                // We check if this value exists in the dbDuplicates set for this column
                if (col.unique && value && dbDuplicates[col.id as string]?.has(String(value).toLowerCase())) {
                    errors.push(`${col.label} ya existe en el sistema`);
                }
            });

            // 4. In-File Duplicate Check
            // (Simplified: We could check previous rows here, but expensive inside map. 
            // Better to pre-calculate in-file dupes outside loop)

            if (errors.length === 0) validCount++;
            else invalidCount++;

            return { ...currentRowData, __errors: errors, __index: index };
        });

        return { validCount, invalidCount, processedRows };
    }, [data, config.columns, dbDuplicates]);

    const { validCount, invalidCount, processedRows } = validationResults;
    const hasErrors = invalidCount > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
        >
            {/* Summary Cards */}
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
                        <div className="flex items-center gap-2">
                            <div className={cn("text-xs font-medium uppercase", hasErrors ? "text-red-600/80" : "text-muted-foreground")}>
                                {t('summary.errorsFound')}
                            </div>
                            {isValidating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 p-6 pt-2 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                        {t('preview')}
                        {isValidating && <span className="text-xs text-muted-foreground italic font-normal">(Verificando duplicados...)</span>}
                    </h3>
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
