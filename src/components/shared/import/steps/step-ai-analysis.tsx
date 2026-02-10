"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, ChevronDown, ChevronRight, Package, Wrench, CheckCircle2, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@/i18n/routing";
import type { AIAnalysisResult, AIAnalyzedTask } from "@/features/ai/types";

// ============================================================================
// Types
// ============================================================================

interface StepAIAnalysisProps {
    /** Raw 2D data from XLSX parsing (includes header + data rows) */
    rawData: any[][];
    /** 0-based index of the header row */
    headerRowIndex: number;
    /** Server action to call for AI analysis */
    onAnalyze: (rows: any[][], headerRowIndex: number) => Promise<{ success: true; data: AIAnalysisResult } | { success: false; error: string }>;
    /** Called when user accepts the AI result */
    onAccept: (result: AIAnalysisResult) => void;
    /** Called when user wants to skip AI and do manual import */
    onSkip: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function StepAIAnalysis({
    rawData,
    headerRowIndex,
    onAnalyze,
    onAccept,
    onSkip,
}: StepAIAnalysisProps) {
    const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
    const [result, setResult] = useState<AIAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

    // Start analysis
    const handleAnalyze = async () => {
        setStatus("analyzing");
        setError(null);

        const response = await onAnalyze(rawData, headerRowIndex);

        if (response.success) {
            setResult(response.data);
            setStatus("done");
            // Auto-expand first 3 tasks
            setExpandedTasks(new Set([0, 1, 2]));
        } else {
            setError(response.error);
            setStatus("error");
        }
    };

    const toggleTask = (index: number) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    // ========================================================================
    // Idle State — offer to analyze
    // ========================================================================

    if (status === "idle") {
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col h-full min-h-0"
            >
                <ScrollArea className="flex-1 min-h-0">
                    <div className="flex flex-col items-center gap-6 p-8 w-full">
                        {/* Header */}
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold">Análisis con Inteligencia Artificial</h3>
                            <p className="text-base text-muted-foreground">
                                La IA analizará tu archivo para detectar <strong>tareas con sus recetas</strong> (materiales y mano de obra) automáticamente.
                                Ideal para archivos Excel con estructura jerárquica.
                            </p>
                        </div>

                        {/* How it works */}
                        <div className="w-full rounded-lg border bg-muted/20 p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500 shrink-0" />
                                <p className="text-base font-medium">¿Cómo funciona?</p>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-2.5 ml-6 list-disc">
                                <li>
                                    La IA detecta las <strong>tareas</strong> en tu archivo y las crea en el catálogo.
                                    Si tu Excel solo tiene tareas sin recetas, usá este flujo sin problemas.
                                </li>
                                <li>
                                    Si tu Excel contiene <strong>materiales y mano de obra</strong> debajo de cada tarea, la IA los detecta y los vincula armando <strong>recetas automáticas</strong>.
                                </li>
                                <li>
                                    El matching se hace por <strong>nombre o código</strong>: si un material en el Excel coincide con uno que ya tenés en tu catálogo (por nombre o código), se vincula automáticamente.
                                </li>
                                <li>
                                    Los materiales o mano de obra que <strong>no se encuentren</strong> en tus catálogos se omiten con un aviso. No se crean items nuevos.
                                </li>
                            </ul>
                        </div>

                        {/* Prerequisite callout */}
                        <div className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                <p className="text-base font-medium text-amber-700 dark:text-amber-400">Requisito previo</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Para que la IA pueda vincular materiales y mano de obra, estos deben <strong>existir previamente</strong> en tus catálogos.
                                Si aún no los creaste, hacelo primero desde estas secciones:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href="/organization/catalog"
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline bg-blue-500/10 px-3 py-1.5 rounded-md"
                                >
                                    <Package className="h-3.5 w-3.5" />
                                    Materiales e Insumos
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                                <Link
                                    href="/organization/catalog"
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline bg-orange-500/10 px-3 py-1.5 rounded-md"
                                >
                                    <Wrench className="h-3.5 w-3.5" />
                                    Mano de Obra
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onSkip}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Importar manualmente
                            </button>
                            <button
                                onClick={handleAnalyze}
                                className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <Sparkles className="h-4 w-4" />
                                Analizar con IA
                            </button>
                        </div>
                    </div>
                </ScrollArea>
            </motion.div>
        );
    }

    // ========================================================================
    // Analyzing State — loading
    // ========================================================================

    if (status === "analyzing") {
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-6 p-8"
            >
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                    <p className="text-lg font-medium">Analizando estructura...</p>
                    <p className="text-sm text-muted-foreground">
                        La IA está identificando tareas, materiales y mano de obra en tu archivo.
                    </p>
                </div>
            </motion.div>
        );
    }

    // ========================================================================
    // Error State
    // ========================================================================

    if (status === "error") {
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-6 p-8"
            >
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div className="text-center space-y-2 max-w-md">
                    <h3 className="text-lg font-semibold">Error en el análisis</h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onSkip}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Importar manualmente
                    </button>
                    <button
                        onClick={handleAnalyze}
                        className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </motion.div>
        );
    }

    // ========================================================================
    // Done State — show results
    // ========================================================================

    if (!result) return null;

    const confidenceColor = {
        high: "text-green-600 dark:text-green-400",
        medium: "text-amber-600 dark:text-amber-400",
        low: "text-red-600 dark:text-red-400",
    };

    const confidenceLabel = {
        high: "Alta",
        medium: "Media",
        low: "Baja",
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col h-full min-h-0"
        >
            {/* Summary bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{result.summary.totalTasks} tareas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">{result.summary.totalMaterials} materiales</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Wrench className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-muted-foreground">{result.summary.totalLabor} mano de obra</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confianza:</span>
                    <span className={`text-xs font-medium ${confidenceColor[result.summary.confidence]}`}>
                        {confidenceLabel[result.summary.confidence]}
                    </span>
                </div>
            </div>

            {/* Task list */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-2">
                    {result.tasks.map((task, index) => (
                        <TaskPreviewItem
                            key={index}
                            task={task}
                            index={index}
                            isExpanded={expandedTasks.has(index)}
                            onToggle={() => toggleTask(index)}
                        />
                    ))}
                </div>
            </ScrollArea>

            {/* Action buttons */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-background shrink-0">
                <button
                    onClick={onSkip}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Descartar y hacer manualmente
                </button>
                <button
                    onClick={() => onAccept(result)}
                    className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Importar {result.summary.totalTasks} tareas con recetas
                </button>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Task Preview Item
// ============================================================================

function TaskPreviewItem({
    task,
    index,
    isExpanded,
    onToggle,
}: {
    task: AIAnalyzedTask;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const hasResources = task.materials.length > 0 || task.labor.length > 0;

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Task header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
            >
                {hasResources ? (
                    isExpanded
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                    <div className="w-4" />
                )}

                <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">
                    {index + 1}
                </span>

                {task.code && (
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                        {task.code}
                    </Badge>
                )}

                <span className="text-sm font-medium flex-1 truncate">{task.name}</span>

                {task.unit && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                        {task.unit}
                    </Badge>
                )}

                <div className="flex items-center gap-2 shrink-0">
                    {task.materials.length > 0 && (
                        <span className="text-xs text-blue-500">{task.materials.length} mat.</span>
                    )}
                    {task.labor.length > 0 && (
                        <span className="text-xs text-orange-500">{task.labor.length} MO</span>
                    )}
                </div>
            </button>

            {/* Expanded resources */}
            {isExpanded && hasResources && (
                <div className="border-t bg-muted/20 px-4 py-2 space-y-2">
                    {task.materials.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-blue-500 mb-1 flex items-center gap-1">
                                <Package className="h-3 w-3" /> Materiales
                            </p>
                            <div className="space-y-1 ml-4">
                                {task.materials.map((mat, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-mono w-5 text-right">{i + 1}.</span>
                                        {mat.code && <span className="font-mono text-foreground/70">[{mat.code}]</span>}
                                        <span className="flex-1 truncate">{mat.name}</span>
                                        {mat.quantity != null && (
                                            <span className="shrink-0">{mat.quantity} {mat.unit || ""}</span>
                                        )}
                                        {mat.wastePercentage != null && mat.wastePercentage > 0 && (
                                            <span className="shrink-0 text-amber-500">+{mat.wastePercentage}%</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {task.labor.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-orange-500 mb-1 flex items-center gap-1">
                                <Wrench className="h-3 w-3" /> Mano de Obra
                            </p>
                            <div className="space-y-1 ml-4">
                                {task.labor.map((lab, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-mono w-5 text-right">{i + 1}.</span>
                                        <span className="flex-1 truncate">{lab.name}</span>
                                        {lab.quantity != null && (
                                            <span className="shrink-0">{lab.quantity} {lab.unit || ""}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
