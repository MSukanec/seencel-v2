"use client";

import { useState } from "react";
import { ImportConfig, ParseResult } from "@/lib/import-utils";
import { ImportStepUpload } from "./steps/step-upload";
import { ImportStepMapping } from "./steps/step-mapping";
import { ImportStepValidation } from "./steps/step-validation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useModal } from "@/providers/modal-store";
import { updateMappingPatterns } from "@/actions/import-mapping";
import { FormFooter } from "@/components/global/form-footer";
import { useTranslations } from "next-intl";

interface BulkImportModalProps<T> {
    config: ImportConfig<T>;
    organizationId: string;
}

type Step = 'upload' | 'mapping' | 'validation' | 'importing' | 'result';

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
    const [importResult, setImportResult] = useState<{ success: number; errors: any[] } | null>(null);

    const handleBack = () => {
        if (step === 'mapping') setStep('upload');
        if (step === 'validation') setStep('mapping');
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

    const handleImport = async () => {
        setStep('importing');
        try {
            const result = await config.onImport(mappedData);

            if (result.success > 0) {
                // Background update patterns - Fire and forget
                updateMappingPatterns(organizationId, config.entityId, mapping).catch(console.error);
            }

            setImportResult(result);
            setStep('result');
        } catch (error) {
            console.error("Import failed", error);
            // Handle fatal error
            setStep('validation'); // Go back to validation?
        }
    };

    return (
        <div className="flex flex-col h-full sm:h-[80vh]">
            {/* Steps Indicator */}
            {/* Dynamic Step Header */}
            <div className="flex flex-col border-b shrink-0 -mx-4 -mt-4 mb-0 bg-muted/10">
                {/* Top Bar with Back & Title */}
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
                                {step === 'importing' && t('headers.importing')}
                                {step === 'result' && t('headers.result')}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                {step === 'upload' && t('descriptions.upload')}
                                {step === 'mapping' && t('descriptions.mapping')}
                                {step === 'validation' && t('descriptions.validation')}
                                {step === 'importing' && t('descriptions.importing')}
                                {step === 'result' && t('descriptions.result')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StepDot active={step === 'upload'} completed={['mapping', 'validation', 'result'].includes(step)} label={t('steps.upload')} />
                        <div className="w-8 h-[1px] bg-border" />
                        <StepDot active={step === 'mapping'} completed={['validation', 'result'].includes(step)} label={t('steps.mapping')} />
                        <div className="w-8 h-[1px] bg-border" />
                        <StepDot active={step === 'validation'} completed={['result'].includes(step)} label={t('steps.validation')} />
                    </div>
                </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
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
                        />
                    )}
                    {step === 'validation' && (
                        <ImportStepValidation
                            key="step-validation"
                            config={config}
                            data={mappedData}
                        />
                    )}
                    {step === 'importing' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full gap-4"
                        >
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">{t('headers.importing')}</p>
                        </motion.div>
                    )}
                    {step === 'result' && importResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center"
                        >
                            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">{tResult('successTitle')}</h3>
                                <p className="text-muted-foreground">
                                    {tResult.rich('successMessage', {
                                        count: importResult.success,
                                        bold: (chunks) => <span className="font-medium text-foreground">{chunks}</span>
                                    })}
                                </p>
                                {importResult.errors.length > 0 && (
                                    <p className="text-sm text-red-500">
                                        {tResult('errorsMessage', { count: importResult.errors.length })}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Standard Footer */}
            {step !== 'importing' && step !== 'result' && (
                <div className="shrink-0 z-50 bg-background relative -mx-4 -mb-4 pt-2">
                    <FormFooter
                        className=""
                        isForm={false}
                        onCancel={step === 'upload' ? closeModal : handleBack}
                        cancelLabel={step === 'upload' ? tActions('cancel') : tActions('back')}
                        onSubmit={() => {
                            if (step === 'upload') setStep('mapping');
                            else if (step === 'mapping') transformDataAndProceed();
                            else if (step === 'validation') handleImport();
                        }}
                        submitLabel={
                            step === 'validation' ? tActions('import') : tActions('continue')
                        }
                        submitDisabled={
                            (step === 'upload' && !file) ||
                            (step === 'mapping' && !isMappingValid)
                        }
                        variant="default" // 25% - 75%
                    />
                </div>
            )}

            {/* Result Step Footer */}
            {step === 'result' && (
                <div className="shrink-0 z-50 bg-background relative -mx-4 -mb-4 pt-2 flex items-center justify-between p-4 border-t">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (importResult?.batchId) {
                                // Undo Logic
                                try {
                                    await config.onRevert?.(importResult.batchId);
                                    closeModal();
                                    // Optional: Toast success "Import reverted"
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
