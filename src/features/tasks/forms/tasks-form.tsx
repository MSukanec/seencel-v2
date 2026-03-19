"use client";

import { useState, useMemo, useEffect } from "react";
import { ClipboardList, Home, Globe, FolderTree, Ruler } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { validateRequired } from "@/lib/form-validation";
import { createTask, updateTask } from "../actions";
import { cn } from "@/lib/utils";
import { ChipRow, SelectChip, StatusChip, UnitChip } from "@/components/shared/chips";
import type { StatusVariant } from "@/components/shared/chips";
import { FormTextField } from "@/components/shared/forms/fields/form-text-field";
import { TasksParametricForm } from "./tasks-parametric-form";
import { Task, Unit, TaskDivision } from "../types";

// ============================================================================
// Status
// ============================================================================

export type TaskCatalogStatus = "draft" | "active" | "archived";

// ============================================================================
// Type Selector sub-types
// ============================================================================

export type TaskCreationType = "own" | "parametric";

const TASK_STATUS_OPTIONS: { value: string; label: string; variant: StatusVariant }[] = [
    { value: "active", label: "Activa", variant: "positive" },
    { value: "archived", label: "Archivada", variant: "negative" },
];

// ============================================================================
// Types
// ============================================================================

type DivisionSource = "own" | "system";

interface TasksFormProps {
    mode?: "create" | "edit";
    initialData?: Task;
    organizationId: string;
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
    defaultDivisionId?: string | null;
    /** Skip type selector and go directly to this type */
    directType?: TaskCreationType;
    onCancel?: () => void;
    onSuccess?: () => void;
    /** Passed automatically by PanelProvider */
    formId?: string;
}

// ============================================================================
// Component — Unified Task Form
// ============================================================================
// When mode="create" (default):
//   Step 1: Type selector (own vs parametric)
//   Step 2: Show the actual form based on selection
// When mode="edit":
//   Show the form directly (no selector)

export function TasksForm({
    mode = "create",
    initialData,
    organizationId,
    units,
    divisions,
    isAdminMode = false,
    defaultDivisionId,
    directType,
    onCancel,
    onSuccess,
    formId,
}: TasksFormProps) {
    const { setPanelMeta, closePanel } = usePanel();

    // ── Type selection (always starts as "own", admins can switch) ──────
    const [selectedType, setSelectedType] = useState<TaskCreationType>(
        directType || "own"
    );

    // Update panel metadata when type/mode changes
    useEffect(() => {
        const isEditing = mode === "edit";

        setPanelMeta({
            icon: ClipboardList,
            title: isEditing
                ? "Editar Tarea"
                : selectedType === "parametric"
                    ? "Nueva Tarea Paramétrica"
                    : "Nueva Tarea",
            description: isEditing
                ? "Modifica los datos de esta tarea"
                : undefined,
            // Footer for own task form (parametric has its own submit)
            footer: selectedType === "own"
                ? { submitLabel: isEditing ? "Guardar Cambios" : "Crear Tarea" }
                : undefined,
        });
    }, [selectedType, mode, setPanelMeta]);

    // ── Parametric form (admin only) ────────────────────────────────────
    if (selectedType === "parametric") {
        return (
            <TasksParametricForm
                units={units}
                isAdminMode={isAdminMode}
                onBack={() => setSelectedType("own")}
            />
        );
    }

    // ── Own task form ──────────────────────────────────────────────────
    return (
        <>
            {/* Compact type toggle (admin only — users get form directly) */}
            {mode === "create" && isAdminMode && (
                <TypeToggle
                    selectedType={selectedType}
                    onTypeChange={setSelectedType}
                />
            )}
            <OwnTaskForm
                mode={mode}
                initialData={initialData}
                organizationId={organizationId}
                units={units}
                divisions={divisions}
                isAdminMode={isAdminMode}
                defaultDivisionId={defaultDivisionId}
                onCancel={onCancel}
                onSuccess={onSuccess}
                formId={formId}
            />
        </>
    );
}

// ============================================================================
// Internal: Own Task Form (Chip-based layout)
// ============================================================================
// Layout: ChipRow → Divider → FormTextField hero (nombre) → FormTextField body (código)

interface OwnTaskFormProps {
    mode: "create" | "edit";
    initialData?: Task;
    organizationId: string;
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
    defaultDivisionId?: string | null;
    onCancel?: () => void;
    onSuccess?: () => void;
    formId?: string;
}

function OwnTaskForm({
    mode,
    initialData,
    organizationId,
    units,
    divisions,
    isAdminMode = false,
    defaultDivisionId,
    onCancel,
    onSuccess,
    formId,
}: OwnTaskFormProps) {
    const { closePanel, completePanel } = usePanel();

    // Form state
    const [name, setName] = useState(initialData?.name || initialData?.custom_name || "");
    const [code, setCode] = useState(initialData?.code || "");
    const [unitId, setUnitId] = useState(initialData?.unit_id || "");
    const [divisionId, setDivisionId] = useState(
        initialData?.task_division_id || defaultDivisionId || ""
    );
    const [systemDivisionId, setSystemDivisionId] = useState(
        initialData?.system_division_id || ""
    );
    const [status, setStatus] = useState<TaskCatalogStatus>(
        (initialData as any)?.status || "active"
    );

    // ── Chip options ────────────────────────────────────────────────────

    const ownDivisionOptions = useMemo(() => {
        const filtered = divisions.filter(d => !d.is_system);
        
        return filtered
            .sort((a, b) => {
                const getSortKey = (d: TaskDivision) => {
                    if (!d.parent_id) return `${String(d.order ?? 999).padStart(3, '0')}-${d.name}`;
                    const parent = filtered.find(p => p.id === d.parent_id);
                    const parentKey = parent ? `${String(parent.order ?? 999).padStart(3, '0')}-${parent.name}` : '999-Z';
                    return `${parentKey}-${String(d.order ?? 999).padStart(3, '0')}-${d.name}`;
                };
                return getSortKey(a).localeCompare(getSortKey(b));
            })
            .map(d => {
                let label = d.order != null ? `${d.order}. ${d.name}` : d.name;
                if (d.parent_id) {
                    const parent = filtered.find(p => p.id === d.parent_id);
                    if (parent) {
                        const parentName = parent.order != null ? `${parent.order}. ${parent.name}` : parent.name;
                        label = `${parentName} › ${d.name}`;
                    }
                }
                return { value: d.id, label };
            });
    }, [divisions]);

    const systemDivisionOptions = useMemo(() => {
        const filtered = divisions.filter(d => d.is_system);
        
        return filtered
            .sort((a, b) => {
                const getSortKey = (d: TaskDivision) => {
                    if (!d.parent_id) return `${String(d.order ?? 999).padStart(3, '0')}-${d.name}`;
                    const parent = filtered.find(p => p.id === d.parent_id);
                    const parentKey = parent ? `${String(parent.order ?? 999).padStart(3, '0')}-${parent.name}` : '999-Z';
                    return `${parentKey}-${String(d.order ?? 999).padStart(3, '0')}-${d.name}`;
                };
                return getSortKey(a).localeCompare(getSortKey(b));
            })
            .map(d => {
                let label = d.order != null ? `${d.order}. ${d.name}` : d.name;
                if (d.parent_id) {
                    const parent = filtered.find(p => p.id === d.parent_id);
                    if (parent) {
                        const parentName = parent.order != null ? `${parent.order}. ${parent.name}` : parent.name;
                        label = `${parentName} › ${d.name}`;
                    }
                }
                return { value: d.id, label };
            });
    }, [divisions]);

    const unitOptions = useMemo(() => {
        return units
            .filter(u => u.applicable_to?.includes("task"))
            .map(u => ({
                value: u.id,
                label: u.name,
                symbol: u.symbol || undefined,
            }));
    }, [units]);

    // ── Reset for "create another" ────────────────────────────────────────
    const resetForm = () => {
        setName("");
        setCode("");
        // Keep unitId, divisionId, and status — user likely creating similar tasks
    };

    // ── Submit ──────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // ── Client-side validation (panel stays open if fails) ──────────
        const validationError = validateRequired([
            { value: name, label: "El nombre" },
            { value: unitId, label: "La unidad" },
        ]);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        const formData = new FormData(e.currentTarget);

        formData.set("name", name.trim());
        formData.set("code", code.trim());
        formData.set("status", status);
        if (unitId) formData.set("unit_id", unitId);
        if (divisionId) formData.set("task_division_id", divisionId);
        if (systemDivisionId) formData.set("system_division_id", systemDivisionId);

        if (mode === "edit" && initialData?.id) {
            formData.append("id", initialData.id);
        }

        // ✅ OPTIMISTIC: Show success immediately
        onSuccess?.();
        toast.success(mode === "create" ? "¡Tarea creada!" : "¡Cambios guardados!");

        // Panel lifecycle: edit → close, create → completePanel (respects "Crear otro")
        if (mode === "edit") {
            closePanel();
        } else {
            completePanel(resetForm);
        }

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

    // ── Render ──────────────────────────────────────────────────────────

    return (
        <form id={formId} onSubmit={handleSubmit}>
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

            {/* Chips arriba */}
            <ChipRow>
                {ownDivisionOptions.length > 0 && (
                    <SelectChip
                        value={divisionId}
                        onChange={setDivisionId}
                        options={ownDivisionOptions}
                        icon={<FolderTree className="h-3.5 w-3.5 text-muted-foreground" />}
                        emptyLabel="Mi Rubro"
                        searchPlaceholder="Buscar rubro propio..."
                        emptySearchText="No se encontraron rubros propios"
                    />
                )}
                <SelectChip
                    value={systemDivisionId}
                    onChange={setSystemDivisionId}
                    options={systemDivisionOptions}
                    icon={<FolderTree className="h-3.5 w-3.5 text-muted-foreground" />}
                    emptyLabel="Rubro Estándar"
                    searchPlaceholder="Buscar rubro estándar..."
                    emptySearchText="No se encontraron rubros del sistema"
                />
                <UnitChip
                    value={unitId}
                    onChange={setUnitId}
                    options={unitOptions}
                    emptyLabel="Unidad"
                />
                {mode === "edit" && (
                    <StatusChip
                        value={status}
                        onChange={(v) => setStatus(v as TaskCatalogStatus)}
                        options={TASK_STATUS_OPTIONS}
                    />
                )}
            </ChipRow>

            {/* Divisor */}
            <div className="my-1" />

            {/* Nombre — campo hero */}
            <FormTextField
                variant="hero"
                value={name}
                onChange={setName}
                placeholder="Nombre de la tarea..."
                autoFocus
            />

            {/* Código — campo secundario */}
            <div className="mt-4">
                <FormTextField
                    variant="body"
                    value={code}
                    onChange={setCode}
                    placeholder="Código (ej: ALB-001)"
                    rows={1}
                />
            </div>
        </form>
    );
}

// ============================================================================
// TypeToggle — Admin-only compact type selector
// ============================================================================

interface TypeToggleProps {
    selectedType: TaskCreationType;
    onTypeChange: (type: TaskCreationType) => void;
}

function TypeToggle({ selectedType, onTypeChange }: TypeToggleProps) {
    return (
        <div className="flex items-center gap-1 p-0.5 bg-muted/50 rounded-lg w-fit mb-4">
            <button
                type="button"
                onClick={() => onTypeChange("own")}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    selectedType === "own"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Home className="h-3 w-3" />
                Propia
            </button>
            <button
                type="button"
                onClick={() => onTypeChange("parametric")}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    selectedType === "parametric"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Globe className="h-3 w-3" />
                Paramétrica
            </button>
        </div>
    );
}
