"use client";

import { Upload, FileSpreadsheet, History, FileText } from "lucide-react";
import type { ToolbarAction } from "@/components/layout/dashboard/shared/toolbar/toolbar-button";

// ============================================================================
// Standard Toolbar Actions — OBLIGATORIO para unificar split button
// ============================================================================
// Según regla 7 (no duplicar lógica), todas las vistas que usen Importar/Exportar
// deben usar este helper en vez de definir actions manualmente.

/**
 * Options for generating standard toolbar secondary actions.
 * Only pass handlers for the actions you want to show.
 */
export interface StandardToolbarActionsOptions {
    /** Handler for "Importar" action */
    onImport?: () => void;
    /** Handler for "Historial de Importación" action */
    onImportHistory?: () => void;
    /** Handler for "Exportar PDF" action (locked for non-PRO by default) */
    onExportPDF?: () => void;
    /** Handler for "Exportar CSV" action */
    onExportCSV?: () => void;
    /** Handler for "Exportar Excel (.xlsx)" action */
    onExportExcel?: () => void;
    /** Whether PDF export is enabled (plan feature). Default: false (locked) */
    canExportPDF?: boolean;
}

/**
 * Generate standard secondary toolbar actions.
 * 
 * Standard order:
 * 1. Importar
 * 2. Historial de Importación
 * 3. ─ (separator via order)
 * 4. Exportar PDF (locked by default)
 * 5. Exportar CSV
 * 6. Exportar Excel (.xlsx)
 * 
 * Only includes actions whose handler is provided.
 */
export function getStandardToolbarActions(options: StandardToolbarActionsOptions): ToolbarAction[] {
    const actions: ToolbarAction[] = [];

    if (options.onImport) {
        actions.push({
            label: "Importar",
            icon: Upload,
            onClick: options.onImport,
        });
    }

    if (options.onImportHistory) {
        actions.push({
            label: "Historial de Importación",
            icon: History,
            onClick: options.onImportHistory,
        });
    }

    // PDF export — always visible, locked by default (PRO feature)
    if (options.onExportPDF || options.onExportPDF === undefined) {
        actions.push({
            label: "Exportar PDF",
            icon: FileText,
            onClick: options.onExportPDF ?? (() => { }),
            featureGuard: {
                isEnabled: options.canExportPDF ?? false,
                featureName: "Exportar PDF",
                requiredPlan: "PRO",
            },
        });
    }

    if (options.onExportCSV) {
        actions.push({
            label: "Exportar CSV",
            icon: FileSpreadsheet,
            onClick: options.onExportCSV,
        });
    }

    if (options.onExportExcel) {
        actions.push({
            label: "Exportar Excel (.xlsx)",
            icon: FileSpreadsheet,
            onClick: options.onExportExcel,
        });
    }

    return actions;
}
