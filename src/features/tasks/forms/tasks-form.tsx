"use client";

import { useState, useMemo } from "react";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { TextField, SelectField } from "@/components/shared/forms/fields";
import type { SelectOption, FilterTab } from "@/components/shared/forms/fields";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { createTask, updateTask } from "../actions";
import { Task, Unit, TaskDivision } from "../types";

// ============================================================================
// Status
// ============================================================================

export type TaskCatalogStatus = "draft" | "active" | "archived";

const STATUS_OPTIONS: SelectOption[] = [
    { value: "draft", label: "Borrador" },
    { value: "active", label: "Activa" },
    { value: "archived", label: "Archivada" },
];

// ============================================================================
// Types
// ============================================================================

type DivisionSource = "own" | "system";

interface TasksFormProps {
    mode: "create" | "edit";
    initialData?: Task;
    organizationId: string;
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
    defaultDivisionId?: string | null;
    onCancel?: () => void;
    onSuccess?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DIVISION_FILTER_TABS: FilterTab[] = [
    { key: "own", label: "Propios" },
    { key: "system", label: "Sistema" },
];

// ============================================================================
// Component
// ============================================================================

export function TasksForm({
    mode,
    initialData,
    organizationId,
    units,
    divisions,
    isAdminMode = false,
    defaultDivisionId,
    onCancel,
    onSuccess,
}: TasksFormProps) {
    const router = useRouter();

    // Form state
    const [name, setName] = useState(initialData?.name || initialData?.custom_name || "");
    const [code, setCode] = useState(initialData?.code || "");
    const [unitId, setUnitId] = useState(initialData?.unit_id || "");
    const [divisionId, setDivisionId] = useState(
        initialData?.task_division_id || defaultDivisionId || ""
    );
    const [status, setStatus] = useState<TaskCatalogStatus>(
        (initialData as any)?.status || "draft"
    );

    // Division source — detect from initial data or default to own if they exist
    const initialSource = useMemo<DivisionSource>(() => {
        if (initialData?.task_division_id) {
            const div = divisions.find(d => d.id === initialData.task_division_id);
            if (div?.is_system) return "system";
        }
        const hasOwn = divisions.some(d => !d.is_system && !d.parent_id);
        return hasOwn ? "own" : "system";
    }, [initialData, divisions]);

    const [divisionSource, setDivisionSource] = useState<DivisionSource>(initialSource);

    // ── Derived data ────────────────────────────────────────────────────

    // Division options filtered by source
    const divisionOptions = useMemo<SelectOption[]>(() => {
        return divisions
            .filter(d => !d.parent_id)
            .filter(d => isAdminMode ? true : (divisionSource === "system" ? d.is_system : !d.is_system))
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map(d => ({
                value: d.id,
                label: d.order != null ? `${d.order}. ${d.name}` : d.name,
            }));
    }, [divisions, divisionSource, isAdminMode]);

    // Unit options filtered by task-applicable
    const unitOptions = useMemo<SelectOption[]>(() => {
        return units
            .filter(u => u.applicable_to?.includes("task"))
            .map(u => ({
                value: u.id,
                label: `${u.name} (${u.symbol})`,
            }));
    }, [units]);

    // ── Handlers ────────────────────────────────────────────────────────

    const handleSourceChange = (key: string) => {
        setDivisionSource(key as DivisionSource);
        setDivisionId(""); // Clear selection when switching source
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        formData.set("name", name.trim());
        formData.set("code", code.trim());
        formData.set("status", status);
        if (unitId) formData.set("unit_id", unitId);
        if (divisionId) formData.set("task_division_id", divisionId);

        if (mode === "edit" && initialData?.id) {
            formData.append("id", initialData.id);
        }

        // ✅ OPTIMISTIC: Close and show success immediately
        onSuccess?.();
        toast.success(mode === "create" ? "¡Tarea creada!" : "¡Cambios guardados!");

        // 🔄 BACKGROUND: Submit to server
        try {
            const result =
                mode === "create"
                    ? await createTask(formData)
                    : await updateTask(formData);

            if (result.error) {
                toast.error(result.error);
            }
        } catch (error: any) {
            console.error("Task form error:", error);
            toast.error("Error al guardar: " + error.message);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Hidden fields */}
            {isAdminMode && (
                <>
                    <input type="hidden" name="is_system" value="true" />
                    <input type="hidden" name="is_admin_mode" value="true" />
                </>
            )}
            {!isAdminMode && (
                <input type="hidden" name="organization_id" value={organizationId} />
            )}
            <input type="hidden" name="is_published" value={String(initialData?.is_published ?? false)} />

            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fila 1: Rubro (izquierda) | Código (derecha) */}
                    <SelectField
                        label="Rubro / División"
                        value={divisionId}
                        onChange={setDivisionId}
                        options={divisionOptions}
                        placeholder="Sin rubro / división"
                        searchable
                        searchPlaceholder="Buscar rubro..."
                        clearable
                        filterTabs={!isAdminMode ? DIVISION_FILTER_TABS : undefined}
                        activeFilterTab={divisionSource}
                        onFilterTabChange={handleSourceChange}
                        emptyState={{
                            message: divisionSource === "own"
                                ? "No tenés rubros propios."
                                : "No hay rubros del sistema.",
                            linkText: divisionSource === "own" ? "Ir a Catálogo Técnico > Rubros" : undefined,
                            onLinkClick: divisionSource === "own" ? () => {
                                onCancel?.();
                                router.push("/organization/catalog");
                            } : undefined,
                        }}
                    />

                    <TextField
                        label="Código"
                        value={code}
                        onChange={setCode}
                        placeholder="Ej: ALB-001"
                        required={false}
                    />

                    {/* Fila 2: Nombre — full width */}
                    <div className="md:col-span-2">
                        <TextField
                            label="Nombre de la Tarea"
                            value={name}
                            onChange={setName}
                            placeholder="Ej: Colocación de mampostería"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Fila 3: Unidad (izquierda) | Estado (derecha) */}
                    <SelectField
                        label="Unidad de Medida"
                        value={unitId}
                        onChange={setUnitId}
                        options={unitOptions}
                        placeholder="Seleccionar unidad..."
                        required
                    />

                    <SelectField
                        label="Estado"
                        value={status}
                        onChange={(v) => setStatus(v as TaskCatalogStatus)}
                        options={STATUS_OPTIONS}
                        required
                    />
                </div>
            </div>

            <FormFooter
                onCancel={onCancel}
                cancelLabel="Cancelar"
                submitLabel={mode === "create" ? "Crear Tarea" : "Guardar Cambios"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
