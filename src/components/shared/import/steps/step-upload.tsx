"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { ImportConfig, parseFile, ParseResult } from "@/lib/import";
import { Upload, FileType, AlertCircle, FileSpreadsheet, ArrowRight, X, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";

interface ImportStepUploadProps {
    config: ImportConfig;
    onFileSelected: (file: File, result: ParseResult) => void;
    onReset?: () => void;
    initialFile?: File | null;
    initialResult?: ParseResult | null;
    // Expose header selection state to parent for footer actions
    onHeaderSelectionStateChange?: (state: {
        isInHeaderSelection: boolean;
        selectedRowIndex: number;
        onConfirm: () => void;
        onCancel: () => void;
    }) => void;
}

export function ImportStepUpload({ config, onFileSelected, onReset, initialFile, initialResult, onHeaderSelectionStateChange }: ImportStepUploadProps) {
    const t = useTranslations('ImportSystem.Upload');
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<{ file: File, result: ParseResult } | null>(
        initialFile && initialResult ? { file: initialFile, result: initialResult } : null
    );

    // Header Selection State
    // If we have initial data, we assume it's already 'preview' ready (processed)
    const [stage, setStage] = useState<'upload' | 'header-selection' | 'preview'>(
        initialFile && initialResult ? 'preview' : 'upload'
    );
    const [rawResult, setRawResult] = useState<ParseResult | null>(null);
    const [selectedHeaderIndex, setSelectedHeaderIndex] = useState<number>(0);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsParsing(true);
        setError(null);

        try {
            // Validate extension
            if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
                throw new Error("Formato no soportado. Usa CSV o Excel.");
            }

            const result = await parseFile(file);

            if (!result.rawPreview || result.rawPreview.length === 0) {
                // Fallback if no preview available or empty
                if (result.data.length === 0) throw new Error("Archivo vacío o inválido.");

                setPreviewFile({ file, result });
                setStage('preview');
                onFileSelected(file, result);
            } else {
                setRawResult(result);
                setPreviewFile({ file, result });
                setSelectedHeaderIndex(0);
                setStage('header-selection');
            }

        } catch (err: any) {
            setError(err.message || "Error al procesar el archivo");
        } finally {
            setIsParsing(false);
        }
    }, [onFileSelected]);

    const confirmHeaderSelection = async () => {
        if (!previewFile) return;
        setIsParsing(true);
        try {
            const result = await parseFile(previewFile.file, { headerRowIndex: selectedHeaderIndex });
            setPreviewFile({ ...previewFile, result });
            setStage('preview');
            onFileSelected(previewFile.file, result);
        } catch (err: any) {
            setError("Error al aplicar encabezados: " + err.message);
        } finally {
            setIsParsing(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv', '.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: 1,
        multiple: false,
        disabled: stage !== 'upload'
    });

    const handleReset = () => {
        setPreviewFile(null);
        setRawResult(null);
        setStage('upload');
        setSelectedHeaderIndex(0);
        setError(null);
        if (onReset) onReset();
    };

    // Notify parent about header selection state for footer integration
    useEffect(() => {
        if (onHeaderSelectionStateChange) {
            onHeaderSelectionStateChange({
                isInHeaderSelection: stage === 'header-selection',
                selectedRowIndex: selectedHeaderIndex,
                onConfirm: confirmHeaderSelection,
                onCancel: handleReset
            });
        }
    }, [stage, selectedHeaderIndex, onHeaderSelectionStateChange]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full min-h-0"
        >
            {stage === 'upload' && (
                // Upload State
                <div className="flex flex-col items-center justify-center p-8 h-full min-h-0 gap-6">
                    {/* Introduction Section */}
                    {config.description && (
                        <div className="w-full max-w-2xl text-center space-y-3">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {config.description}
                            </p>
                            {config.docsPath && (
                                <a
                                    href={config.docsPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    Ver documentación completa
                                </a>
                            )}
                        </div>
                    )}

                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={cn(
                            "flex flex-col items-center justify-center w-full max-w-2xl h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 bg-muted/10",
                            isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30",
                            error && "border-red-500 bg-red-500/5"
                        )}
                    >
                        <input {...getInputProps()} />

                        <div className="h-16 w-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-4 text-primary">
                            {isParsing ? (
                                <FileType className="h-8 w-8 animate-pulse" />
                            ) : (
                                <FileSpreadsheet className="h-8 w-8" />
                            )}
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium">
                                {isDragActive ? t('dragActive') : t('dragInactive')}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                {t.rich('supports', { br: () => <br /> })}<br />
                                <span className="text-xs opacity-70">
                                    {t('maxSize')}
                                </span>
                            </p>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-md"
                        >
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                    )}
                </div>
            )}

            {stage === 'header-selection' && rawResult?.rawPreview && previewFile && (
                // Header Selection State
                <div className="flex flex-col h-full min-h-0 overflow-hidden">
                    {/* Header card with selected row preview */}
                    <div className="px-6 py-4 border-b shrink-0 bg-yellow-50/50 dark:bg-yellow-900/10 space-y-3">
                        <div className="space-y-1">
                            <h3 className="font-medium flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                {t('headerSelection.title')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {t('headerSelection.description')}
                            </p>
                        </div>

                        {/* Selected row preview */}
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 overflow-x-auto">
                            <div className="flex items-center gap-3 min-w-max">
                                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                                    Fila {selectedHeaderIndex + 1}
                                </span>
                                <div className="flex gap-2">
                                    {rawResult.rawPreview[selectedHeaderIndex]?.map((cell: any, i: number) => (
                                        <span
                                            key={i}
                                            className="text-sm font-semibold text-primary bg-background px-3 py-1 rounded shadow-sm ring-1 ring-primary/20 truncate max-w-[150px]"
                                        >
                                            {String(cell || `Col ${i + 1}`)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Full table below */}
                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full">
                            <div className="min-w-max">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px] text-center">#</TableHead>
                                            {rawResult.rawPreview[0]?.map((_: any, i: number) => (
                                                <TableHead key={i} className="min-w-[100px] max-w-[180px]">
                                                    Col {i + 1}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rawResult.rawPreview.map((row, rowIndex) => (
                                            <TableRow
                                                key={rowIndex}
                                                className={cn(
                                                    "cursor-pointer transition-colors",
                                                    selectedHeaderIndex === rowIndex
                                                        ? "bg-primary/10 hover:bg-primary/15 ring-2 ring-primary ring-inset"
                                                        : "hover:bg-muted/50"
                                                )}
                                                onClick={() => setSelectedHeaderIndex(rowIndex)}
                                            >
                                                <TableCell className="w-[50px] text-center font-mono text-xs text-muted-foreground bg-muted/30">
                                                    {rowIndex + 1}
                                                </TableCell>
                                                {row.map((cell: any, cellIndex: number) => (
                                                    <TableCell
                                                        key={cellIndex}
                                                        className={cn(
                                                            "min-w-[100px] max-w-[180px] truncate",
                                                            selectedHeaderIndex === rowIndex && "font-semibold text-primary"
                                                        )}
                                                    >
                                                        {String(cell || "")}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}

            {stage === 'preview' && previewFile && (
                // Preview State
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center">
                                <FileSpreadsheet className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-medium text-sm">{previewFile.file.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {(previewFile.file.size / 1024).toFixed(1)} KB • {previewFile.result.data.length} filas
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive">
                            <X className="mr-2 h-4 w-4" />
                            {t('changeFile')}
                        </Button>
                    </div>

                    <div className="flex-1 p-6 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{t('preview.showingRows', { count: 15 })}</h4>
                        </div>

                        <div className="flex-1 border rounded-md overflow-hidden bg-background relative">
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px] text-center">#</TableHead>
                                            {previewFile.result.headers.map((header, i) => (
                                                <TableHead key={i} className="whitespace-nowrap">{header}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewFile.result.data.slice(0, 15).map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-center text-xs text-muted-foreground">
                                                    {i + 1}
                                                </TableCell>
                                                {previewFile.result.headers.map((header, j) => (
                                                    <TableCell key={j} className="whitespace-nowrap max-w-[200px] truncate">
                                                        {String(row[header] || "")}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            {/* Gradient fade at bottom */}
                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                        </div>
                    </div>

                </div>
            )}
        </motion.div>
    );
}

