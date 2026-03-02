"use client";

/**
 * General Costs — Concepts View
 * Standard 19.0 - Lean View Pattern
 *
 * Vista de conceptos de gasto (recurrentes o eventuales).
 * Usa columnas de tables/ + useTableActions.
 */

import { Plus, FileText } from "lucide-react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { usePanel } from "@/stores/panel-store";
import { useTableActions } from "@/hooks/use-table-actions";
import { deleteGeneralCost } from "../actions";
import { getGeneralCostConceptColumns } from "../tables/general-costs-concept-columns";
import { GeneralCost, GeneralCostCategory } from "../types";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────

interface GeneralCostsConceptsViewProps {
    data: GeneralCost[];
    categories: GeneralCostCategory[];
    organizationId: string;
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsConceptsView({ data, categories, organizationId }: GeneralCostsConceptsViewProps) {
    const { openPanel } = usePanel();

    // ─── Delete actions ──────────────────────────────────
    const { handleDelete, DeleteConfirmDialog } = useTableActions<GeneralCost>({
        onDelete: async (item) => {
            try {
                await deleteGeneralCost(item.id);
                toast.success("Concepto eliminado");
                return { success: true };
            } catch {
                toast.error("Error al eliminar el concepto");
                return { success: false };
            }
        },
        entityName: "concepto",
        entityNamePlural: "conceptos",
    });

    // ─── Handlers ────────────────────────────────────────
    const handleCreate = () => {
        openPanel('general-cost-concept-form', {
            organizationId,
            categories,
        });
    };

    const handleEdit = (concept: GeneralCost) => {
        openPanel('general-cost-concept-form', {
            organizationId,
            categories,
            initialData: concept,
        });
    };

    // ─── Columns ─────────────────────────────────────────
    const columns = getGeneralCostConceptColumns();

    // ─── Toolbar actions ─────────────────────────────────
    const toolbarActions = [
        { label: "Nuevo Concepto", icon: Plus, onClick: handleCreate },
    ];

    // ─── Empty state ─────────────────────────────────────
    if (data.length === 0) {
        return (
            <>
                <Toolbar portalToHeader actions={toolbarActions} />
                <ViewEmptyState
                    mode="empty"
                    icon={FileText}
                    viewName="Conceptos de Gasto"
                    featureDescription="Definí los tipos de gastos recurrentes o eventuales de tu organización."
                    onAction={handleCreate}
                    actionLabel="Nuevo Concepto"
                />
            </>
        );
    }

    // ─── Render ──────────────────────────────────────────
    return (
        <>
            <DataTable
                columns={columns}
                data={data}
                enableRowActions
                onEdit={handleEdit}
                onDelete={handleDelete}
                embeddedToolbar={() => <Toolbar actions={toolbarActions} />}
            />
            <DeleteConfirmDialog />
        </>
    );
}
