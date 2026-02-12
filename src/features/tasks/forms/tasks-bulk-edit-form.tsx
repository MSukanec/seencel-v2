"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { SelectField } from "@/components/shared/forms/fields";
import type { SelectOption, FilterTab } from "@/components/shared/forms/fields";
import { updateTasksBulk } from "../actions";
import { Unit, TaskDivision } from "../types";

// ============================================================================
// Types
// ============================================================================

type DivisionSource = "own" | "system";

interface TasksBulkEditFormProps {
    /** IDs of the tasks to update */
    taskIds: string[];
    /** Available units */
    units: Unit[];
    /** Available divisions */
    divisions: TaskDivision[];
    /** Whether we're in admin mode */
    isAdminMode?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DIVISION_FILTER_TABS: FilterTab[] = [
    { key: "own", label: "Propios" },
    { key: "system", label: "Sistema" },
];

// ============================================================================
// Component (Semi-Autónomo — según skill seencel-forms-modals)
// ============================================================================

export function TasksBulkEditForm({
    taskIds,
    units,
    divisions,
    isAdminMode = false,
}: TasksBulkEditFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    // Track which fields the user explicitly changed
    const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

    // Form state — starts empty (partial update pattern)
    const [unitId, setUnitId] = useState("");
    const [divisionId, setDivisionId] = useState("");

    // Division source filter
    const hasOwnDivisions = divisions.some(d => !d.is_system && !d.parent_id);
    const initialSource: DivisionSource = hasOwnDivisions ? "own" : "system";
    const [divisionSource, setDivisionSource] = useState<DivisionSource>(initialSource);

    // ========================================================================
    // Options
    // ========================================================================

    const unitOptions: SelectOption[] = useMemo(() =>
        units.map(u => ({
            value: u.id,
            label: u.symbol ? `${u.name} (${u.symbol})` : u.name,
        })),
        [units]
    );

    const divisionOptions: SelectOption[] = useMemo(() => {
        const filtered = isAdminMode
            ? divisions.filter(d => d.is_system)
            : divisions.filter(d =>
                divisionSource === "own" ? !d.is_system : d.is_system
            );

        // Build hierarchy: parents then children indented
        const parents = filtered.filter(d => !d.parent_id);
        const result: SelectOption[] = [];

        parents.forEach(parent => {
            result.push({ value: parent.id, label: parent.name });
            const children = filtered
                .filter(d => d.parent_id === parent.id)
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
            children.forEach(child => {
                result.push({ value: child.id, label: `  └ ${child.name}` });
            });
        });

        return result;
    }, [divisions, divisionSource, isAdminMode]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleUnitChange = (value: string) => {
        setUnitId(value);
        setChangedFields(prev => new Set(prev).add("unit_id"));
    };

    const handleDivisionChange = (value: string) => {
        setDivisionId(value);
        setChangedFields(prev => new Set(prev).add("task_division_id"));
    };

    const handleSourceChange = (key: string) => {
        setDivisionSource(key as DivisionSource);
        setDivisionId("");
    };

    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (changedFields.size === 0) {
            toast.warning("No se modificó ningún campo");
            return;
        }

        setIsLoading(true);

        // Build partial update — only changed fields
        const updates: { task_division_id?: string | null; unit_id?: string | null } = {};
        if (changedFields.has("unit_id")) {
            updates.unit_id = unitId || null;
        }
        if (changedFields.has("task_division_id")) {
            updates.task_division_id = divisionId || null;
        }

        try {
            const result = await updateTasksBulk(taskIds, updates, isAdminMode);
            if (result.error) {
                toast.error(result.error);
            } else {
                const count = taskIds.length;
                toast.success(`${count} tarea${count > 1 ? "s" : ""} actualizada${count > 1 ? "s" : ""}`);
                closeModal();
                router.refresh();
            }
        } catch {
            toast.error("Error al actualizar tareas");
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                {/* Info banner */}
                <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 mb-6">
                    <p className="text-sm text-muted-foreground">
                        Editando <span className="font-semibold text-foreground">{taskIds.length} tarea{taskIds.length > 1 ? "s" : ""}</span> en masa.
                        Solo los campos que modifiques se actualizarán.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {/* Division / Rubro */}
                    <SelectField
                        label="Rubro / División"
                        value={divisionId}
                        onChange={handleDivisionChange}
                        options={divisionOptions}
                        placeholder="Sin cambios"
                        searchable
                        searchPlaceholder="Buscar rubro..."
                        clearable
                        filterTabs={!isAdminMode ? DIVISION_FILTER_TABS : undefined}
                        activeFilterTab={divisionSource}
                        onFilterTabChange={handleSourceChange}
                    />

                    {/* Unit */}
                    <SelectField
                        label="Unidad de Medida"
                        value={unitId}
                        onChange={handleUnitChange}
                        options={unitOptions}
                        placeholder="Sin cambios"
                        searchable
                        searchPlaceholder="Buscar unidad..."
                        clearable
                    />
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel="Aplicar Cambios"
                onCancel={handleCancel}
                submitDisabled={changedFields.size === 0}
            />
        </form>
    );
}
