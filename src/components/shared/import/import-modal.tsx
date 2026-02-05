"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FKConflict, ResolutionMap, detectConflicts, applyResolutions, filterIgnoredRows } from "@/lib/import-conflict-utils";
import { ImportStepUpload } from "./steps/step-upload";
import { ImportStepMapping } from "./steps/step-mapping";
import { ImportStepValidation } from "./steps/step-validation";
import { ImportStepConflicts } from "./steps/step-conflicts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useModal } from "@/stores/modal-store";
import { updateMappingPatterns } from "@/actions/import-mapping";
import { getAllValuePatternsForEntity, updateValuePatterns } from "@/actions/import-values";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";
import { ImportConfig, ParseResult } from "@/lib/import-utils";

interface BulkImportModalProps<T> {
    config: ImportConfig<T>;
    organizationId: string;
}

type Step = 'upload' | 'mapping' | 'validation' | 'conflicts' | 'importing' | 'result';

export function BulkImportModal<T>({ config, organizationId }: BulkImportModalProps<T>) {
    const t = useTranslations('ImportSystem.Modal');
    const tActions = useTranslations('ImportSystem.Actions');
    const tResult = useTranslations('ImportSystem.Result');

    const { closeModal } = useModal();
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParseResult | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({}); // Header -> ColumnId
    const [isMappingValid, setIsMappingValid] = useState(false);
    const [mappedData, setMappedData] = useState<any[]>([]);
    const [importResult, setImportResult] = useState<{ success: number; errors: any[]; warnings?: string[]; batchId?: string } | null>(null);

    // NEW: Conflict resolution state
    const [conflicts, setConflicts] = useState<FKConflict[]>([]);
    const [resolutions, setResolutions] = useState<ResolutionMap>({});
    const [conflictsResolved, setConflictsResolved] = useState(false);
    const [isDetectingConflicts, setIsDetectingConflicts] = useState(false);

    // Import progress state
    const [importProgress, setImportProgress] = useState<{ total: number; current: number; phase: string }>({ total: 0, current: 0, phase: '' });

    const handleBack = () => {
        if (step === 'mapping') setStep('upload');
        if (step === 'validation') setStep('mapping');
        if (step === 'conflicts') setStep('validation');
    };

    const handleFileUpload = (file: File, result: ParseResult) => {
        setFile(file);
        setParsedData(result);
        setStep('mapping');
    };

    const handleMappingChange = (newMapping: Record<string, string>, isValid: boolean) => {
        setMapping(newMapping);
        setIsMappingValid(isValid);
    };

    const transformDataAndProceed = () => {
        if (!parsedData) return;

        const transformed = parsedData.data.map(row => {
            const newRow: any = {};
            Object.entries(mapping).forEach(([header, colId]) => {
                if (colId) {
                    newRow[colId] = row[header];
                }
            });
            return newRow;
        });

        setMappedData(transformed);
        setStep('validation');
    };

    // NEW: Detect conflicts after validation
    const handleValidationContinue = async () => {
        // Check if config has any FK columns
        const hasFKColumns = config.columns.some(col => col.foreignKey);

        if (!hasFKColumns) {
            // No FK columns, skip conflict detection
            handleImport();
            return;
        }

        setIsDetectingConflicts(true);
        try {
            // Fetch learned patterns first
            const learnedPatterns = await getAllValuePatternsForEntity(organizationId, config.entityId);

            const detectedConflicts = await detectConflicts(mappedData, config, organizationId, learnedPatterns);
            setConflicts(detectedConflicts);
            setStep('conflicts'); // Always show conflicts step if FK columns exist
        } catch (error) {
            console.error("Conflict detection failed", error);
            // Proceed anyway
            handleImport();
        } finally {
            setIsDetectingConflicts(false);
        }
    };

    const handleResolutionsChange = (newResolutions: ResolutionMap, allResolved: boolean) => {
        setResolutions(newResolutions);
        setConflictsResolved(allResolved);
    };

    const handleImport = async () => {
        setStep('importing');
        const totalRecords = mappedData.length;
        setImportProgress({ total: totalRecords, current: 0, phase: 'Preparando datos...' });

        try {
            // Apply resolutions if any
            let dataToImport = mappedData;

            // 1. Execute deferred creations (Quick Create)
            // Iterate over all fields and values to find pending creations
            const pendingCreations: Array<{
                field: string;
                value: string;
                createAction: (orgId: string, value: string) => Promise<{ id: string }>;
            }> = [];

            const configResolutions = { ...resolutions }; // Clone to avoid mutation during iteration

            for (const [field, fieldResolutions] of Object.entries(configResolutions)) {
                const column = config.columns.find(c => String(c.id) === field);
                if (!column?.foreignKey?.createAction) continue;

                for (const [value, resolution] of Object.entries(fieldResolutions)) {
                    if (resolution.action === 'create' && !resolution.targetId) {
                        pendingCreations.push({
                            field,
                            value,
                            createAction: column.foreignKey.createAction
                        });
                    }
                }
            }

            // Execute creations in parallel
            if (pendingCreations.length > 0) {
                setImportProgress(prev => ({ ...prev, phase: `Creando ${pendingCreations.length} registro(s) automático(s)...` }));
                try {
                    const results = await Promise.all(
                        pendingCreations.map(async (item) => {
                            try {
                                const result = await item.createAction(organizationId, item.value);
                                return { ...item, resultId: result.id };
                            } catch (e) {
                                console.error(`Failed to create ${item.value}`, e);
                                return null;
                            }
                        })
                    );

                    // Update resolutions with new IDs
                    results.forEach(res => {
                        if (res && res.resultId) {
                            configResolutions[res.field][res.value] = {
                                ...configResolutions[res.field][res.value],
                                targetId: res.resultId,
                                // We keep action as 'create' or switch to 'map'?
                                // applyResolutions likely handles 'create' if targetId is present, or we can switch to 'map'.
                                // Switching to 'map' is safer if applyResolutions is strict.
                                action: 'map'
                            };
                        }
                    });
                } catch (err) {
                    console.error("Critical error in deferred creation", err);
                    throw new Error("No se pudieron crear los registros automáticos.");
                }
            }

            if (Object.keys(configResolutions).length > 0) {
                dataToImport = applyResolutions(mappedData, config, configResolutions);
                dataToImport = filterIgnoredRows(dataToImport, config, configResolutions);
            }

            setImportProgress(prev => ({ ...prev, phase: `Importando ${dataToImport.length} registro(s)...`, current: 0 }));
            const result = await config.onImport(dataToImport);

            if (result.success > 0) {
                // Background update patterns - Fire and forget
                updateMappingPatterns(organizationId, config.entityId, mapping).catch(console.error);
                // Transform ResolutionMap to the format expected by updateValuePatterns
                const valuePatterns: Record<string, Record<string, string | null>> = {};
                for (const [field, fieldResolutions] of Object.entries(resolutions)) {
                    valuePatterns[field] = {};
                    for (const [value, resolution] of Object.entries(fieldResolutions)) {
                        valuePatterns[field][value] = resolution.targetId ?? null;
                    }
                }
                updateValuePatterns(organizationId, config.entityId, valuePatterns).catch(console.error);
            }

            setImportResult(result);
            setStep('result');
        } catch (error) {
            console.error("Import failed", error);
            setStep('validation');
        }
    };

    // Determine step dot completion
    const isStepCompleted = (s: Step) => {
        const order: Step[] = ['upload', 'mapping', 'validation', 'conflicts', 'importing', 'result'];
        return order.indexOf(s) < order.indexOf(step);
    };

    return (
        <div className="flex flex-col h-full sm:h-[80vh] min-h-0">
            {/* Dynamic Step Header */}
            <div className="flex flex-col border-b shrink-0 -mx-4 -mt-4 mb-0 bg-muted/10">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-2">
                        {step !== 'upload' && step !== 'result' && step !== 'importing' && (
                            <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div>
                            <h2 className="text-base font-semibold leading-none">
                                {step === 'upload' && t('headers.upload', { entity: config.entityLabel })}
                                {step === 'mapping' && t('headers.mapping')}
                                {step === 'validation' && t('headers.validation')}
                                {step === 'conflicts' && 'Resolver Conflictos'}
                                {step === 'importing' && t('headers.importing')}
                                {step === 'result' && t('headers.result')}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                {step === 'upload' && t('descriptions.upload')}
                                {step === 'mapping' && t('descriptions.mapping')}
                                {step === 'validation' && t('descriptions.validation')}
                                {step === 'conflicts' && 'Algunos valores no existen en el sistema. Decide cómo proceder.'}
                                {step === 'importing' && t('descriptions.importing')}
                                {step === 'result' && t('descriptions.result')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StepDot active={step === 'upload'} completed={isStepCompleted('upload')} label={t('steps.upload')} />
                        <div className="w-8 h-[1px] bg-border" />
                        <StepDot active={step === 'mapping'} completed={isStepCompleted('mapping')} label={t('steps.mapping')} />
                        <div className="w-8 h-[1px] bg-border" />
                        <StepDot active={step === 'validation'} completed={isStepCompleted('validation')} label={t('steps.validation')} />
                        <div className="w-8 h-[1px] bg-border" />
                        <StepDot active={step === 'conflicts'} completed={isStepCompleted('conflicts')} label="Verificación" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-1 min-h-0">
                <AnimatePresence mode="wait">
                    {step === 'upload' && (
                        <ImportStepUpload
                            key="step-upload"
                            config={config}
                            onFileSelected={handleFileUpload}
                            onReset={() => {
                                setFile(null);
                                setParsedData(null);
                            }}
                            initialFile={file}
                            initialResult={parsedData}
                        />
                    )}
                    {step === 'mapping' && parsedData && (
                        <ImportStepMapping
                            key="step-mapping"
                            config={config}
                            organizationId={organizationId}
                            headers={parsedData.headers}
                            initialMapping={mapping}
                            onChange={handleMappingChange}
                            previewData={parsedData.data[0]}
                        />
                    )}
                    {step === 'validation' && (
                        <ImportStepValidation
                            key="step-validation"
                            config={config}
                            organizationId={organizationId}
                            data={mappedData}
                        />
                    )}
                    {step === 'conflicts' && (
                        <ImportStepConflicts
                            key="step-conflicts"
                            config={config}
                            conflicts={conflicts}
                            organizationId={organizationId}
                            onResolutionsChange={handleResolutionsChange}
                        />
                    )}
                    {step === 'importing' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full gap-6 p-8"
                        >
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="text-center space-y-2">
                                <p className="text-lg font-medium">{t('headers.importing')}</p>
                                <p className="text-sm text-muted-foreground">{importProgress.phase}</p>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full max-w-md space-y-2">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary rounded-full"
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Procesando...</span>
                                    <span>{importProgress.total} registro{importProgress.total !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {step === 'result' && importResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center min-h-0"
                        >
                            <div className={cn(
                                "h-16 w-16 rounded-full flex items-center justify-center shrink-0",
                                importResult.success > 0 ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"
                            )}>
                                {importResult.success > 0 ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                            </div>

                            <div className="space-y-2 shrink-0">
                                <h3 className="text-2xl font-bold">
                                    {importResult.success > 0 ? tResult('successTitle') : "Importación Fallida"}
                                </h3>
                                <p className="text-muted-foreground">
                                    {importResult.success > 0
                                        ? tResult.rich('successMessage', {
                                            count: importResult.success,
                                            bold: (chunks) => <span className="font-medium text-foreground">{chunks}</span>
                                        })
                                        : "No se pudieron importar los registros."
                                    }
                                </p>
                            </div>

                            {/* Warnings Section (amber) */}
                            {importResult.warnings && importResult.warnings.length > 0 && (
                                <div className="w-full max-w-md mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                            Advertencias
                                        </p>
                                    </div>
                                    <div className="border border-amber-500/30 rounded-md bg-amber-500/5 p-3">
                                        {importResult.warnings.map((w, i) => (
                                            <p key={i} className="text-xs text-amber-700 dark:text-amber-300">{w}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {importResult.errors.length > 0 && (
                                <div className="w-full max-w-md mt-4 flex flex-col min-h-0 flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-destructive">
                                            {tResult('errorsMessage', { count: importResult.errors.length })}
                                        </p>
                                    </div>
                                    <div className="border rounded-md bg-destructive/5 overflow-hidden flex-1 relative">
                                        <ScrollArea className="h-full">
                                            <div className="p-3 text-left space-y-2">
                                                {Array.from(new Set(importResult.errors.map(e => typeof e === 'string' ? e : JSON.stringify(e)))).map((err, i) => (
                                                    <div key={i} className="text-xs text-destructive flex items-start gap-2">
                                                        <span className="font-mono opacity-70">•</span>
                                                        <span className="font-mono break-all">{err}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            {step !== 'importing' && step !== 'result' && (
                <FormFooter
                    className="-mx-4 -mb-4 mt-4 border-t pt-4 px-4 bg-background z-10"
                    isForm={false}
                    onCancel={step === 'upload' ? closeModal : handleBack}
                    cancelLabel={step === 'upload' ? tActions('cancel') : tActions('back')}
                    onSubmit={() => {
                        if (step === 'upload') setStep('mapping');
                        else if (step === 'mapping') transformDataAndProceed();
                        else if (step === 'validation') handleValidationContinue();
                        else if (step === 'conflicts') handleImport();
                    }}
                    submitLabel={
                        step === 'conflicts'
                            ? (isDetectingConflicts ? 'Analizando...' : tActions('import'))
                            : step === 'validation'
                                ? (config.columns.some(col => col.foreignKey) ? tActions('continue') : tActions('import'))
                                : (step === 'mapping' && !isMappingValid) ? 'Faltan campos requeridos' : tActions('continue')
                    }
                    submitDisabled={
                        (step === 'upload' && !file) ||
                        (step === 'mapping' && !isMappingValid) ||
                        (step === 'conflicts' && !conflictsResolved) ||
                        isDetectingConflicts
                    }
                    variant="default"
                />
            )}

            {/* Result Footer */}
            {step === 'result' && (
                <div className="shrink-0 z-50 bg-background relative -mx-4 -mb-4 pt-2 flex items-center justify-between p-4 border-t">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (importResult?.batchId) {
                                try {
                                    await config.onRevert?.(importResult.batchId);
                                    closeModal();
                                } catch (e) {
                                    console.error("Revert failed", e);
                                }
                            }
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        Deshacer Importación
                    </Button>
                    <Button onClick={closeModal}>
                        {tResult('finish')}
                    </Button>
                </div>
            )}
        </div>
    );
}

function StepDot({ active, completed, label }: { active: boolean, completed: boolean, label: string }) {
    return (
        <div className={`flex items-center gap-2 ${active ? 'text-primary font-medium' : completed ? 'text-foreground' : 'text-muted-foreground/50'}`}>
            <div className={`
                h-2.5 w-2.5 rounded-full transition-colors 
                ${active ? 'bg-primary' : completed ? 'bg-primary/50' : 'bg-border'}
            `} />
            <span>{label}</span>
        </div>
    );
}


