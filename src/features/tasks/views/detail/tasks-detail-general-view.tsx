"use client";

// ============================================================================
// TASK DETAIL — GENERAL VIEW
// ============================================================================
// Vista de detalle general de una tarea usando SettingsSection layout.
// Campos editables inline con guardado automático (debounce).
// Si la tarea es de sistema y no estamos en admin mode, los campos son read-only.
//
// Secciones:
//   1. Identificación (código, nombre, descripción, origen)
//   2. Clasificación (unidad, división, elemento, acción, tipo)
//   3. Admin (selector de organización — solo admin mode)
// ============================================================================

import { useRef, useCallback, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { Badge } from "@/components/ui/badge";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { TextField, NotesField, SelectField } from "@/components/shared/forms/fields";
import { Combobox } from "@/components/ui/combobox";
import { Monitor, Building2, Settings, FileText, Ruler, Boxes, Zap, Layers, Tag } from "lucide-react";
import { toast } from "sonner";
import { updateTask, updateTaskOrganization } from "@/features/tasks/actions";
import type { TaskView, TaskDivision, Unit } from "@/features/tasks/types";

// ============================================================================
// Types
// ============================================================================

interface Organization {
    id: string;
    name: string;
}

interface TasksDetailGeneralViewProps {
    task: TaskView;
    divisions: TaskDivision[];
    units: Unit[];
    organizationId: string;
    isAdminMode?: boolean;
    organizations?: Organization[];
}

// ============================================================================
// Component
// ============================================================================

export function TasksDetailGeneralView({
    task,
    divisions,
    units,
    organizationId,
    isAdminMode = false,
    organizations = [],
}: TasksDetailGeneralViewProps) {
    const router = useRouter();

    // Only allow editing non-system tasks (org tasks), or admin mode
    const canEdit = !task.is_system || isAdminMode;

    // ========================================================================
    // Form State
    // ========================================================================

    const [name, setName] = useState(task.name || task.custom_name || "");
    const [code, setCode] = useState(task.code || "");
    const [description, setDescription] = useState(task.description || "");
    const [unitId, setUnitId] = useState(task.unit_id || "");
    const [divisionId, setDivisionId] = useState(task.task_division_id || "");

    // Admin mode
    const [selectedOrgId, setSelectedOrgId] = useState(task.organization_id || "");

    // ========================================================================
    // Debounced auto-save (1000ms) for text fields
    // ========================================================================

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const triggerAutoSave = useCallback((fields: {
        name: string;
        code: string;
        description: string;
        unit_id: string;
        task_division_id: string;
    }) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            if (!fields.name.trim()) return; // name is required

            try {
                const formData = new FormData();
                formData.set("id", task.id);
                formData.set("name", fields.name);
                formData.set("code", fields.code);
                formData.set("description", fields.description);
                formData.set("unit_id", fields.unit_id);
                formData.set("task_division_id", fields.task_division_id);
                formData.set("is_published", String(task.is_published ?? false));
                if (isAdminMode) formData.set("is_admin_mode", "true");
                const result = await updateTask(formData);
                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success("¡Cambios guardados!");
                }
            } catch {
                toast.error("Error al guardar los cambios.");
            }
        }, 1000);
    }, [task.id, task.is_published, isAdminMode]);

    // ========================================================================
    // Immediate save for selects (no debounce needed)
    // ========================================================================

    const saveField = useCallback(async (fieldName: string, value: string) => {
        try {
            const formData = new FormData();
            formData.set("id", task.id);
            formData.set("name", name);
            formData.set("code", code);
            formData.set("description", description);
            formData.set("unit_id", fieldName === "unit_id" ? value : unitId);
            formData.set("task_division_id", fieldName === "task_division_id" ? value : divisionId);
            formData.set("is_published", String(task.is_published ?? false));
            if (isAdminMode) formData.set("is_admin_mode", "true");
            const result = await updateTask(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("¡Cambios guardados!");
            }
        } catch {
            toast.error("Error al guardar los cambios.");
        }
    }, [task.id, task.is_published, isAdminMode, name, code, description, unitId, divisionId]);

    // ========================================================================
    // Field change handlers
    // ========================================================================

    const handleNameChange = (value: string) => {
        setName(value);
        triggerAutoSave({ name: value, code, description, unit_id: unitId, task_division_id: divisionId });
    };

    const handleCodeChange = (value: string) => {
        setCode(value);
        triggerAutoSave({ name, code: value, description, unit_id: unitId, task_division_id: divisionId });
    };

    const handleDescriptionChange = (value: string) => {
        setDescription(value);
        triggerAutoSave({ name, code, description: value, unit_id: unitId, task_division_id: divisionId });
    };

    const handleUnitChange = (value: string) => {
        setUnitId(value);
        saveField("unit_id", value);
    };

    const handleDivisionChange = (value: string) => {
        const newValue = value === "__none__" ? "" : value;
        setDivisionId(newValue);
        saveField("task_division_id", newValue);
    };

    // Admin: org change
    const handleOrgChange = async (newOrgId: string) => {
        setSelectedOrgId(newOrgId);

        const result = await updateTaskOrganization(
            task.id,
            newOrgId || null
        );

        if (result.error) {
            toast.error(result.error);
            setSelectedOrgId(task.organization_id || "");
        } else {
            toast.success("Organización actualizada");
            router.refresh();
        }
    };

    // ========================================================================
    // Derived data
    // ========================================================================

    // Unit options
    const unitOptions = units.map(u => ({
        value: u.id,
        label: `${u.name} (${u.symbol})`,
    }));

    // Division options
    const divisionOptions = [
        { value: "__none__", label: "Sin división" },
        ...divisions.map(d => ({
            value: d.id,
            label: d.name,
        })),
    ];

    // Admin: org options
    const orgOptions = [
        { value: "", label: "Sistema (sin organización)" },
        ...organizations.map(org => ({
            value: org.id,
            label: org.name,
        }))
    ];

    return (
        <ContentLayout variant="settings">
            <SettingsSectionContainer>

                {/* ── Información General ── */}
                <SettingsSection
                    icon={FileText}
                    title="Información General"
                    description="Datos generales de la tarea."
                >
                    <div className="space-y-4">
                        {/* Nombre */}
                        <TextField
                            label="Nombre"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="Nombre de la tarea"
                            required
                            disabled={!canEdit}
                        />

                        {/* Código / División */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <TextField
                                label="Código"
                                value={code}
                                onChange={handleCodeChange}
                                placeholder="Ej: ALB010-0001"
                                disabled={!canEdit}
                            />
                            <SelectField
                                label="División (Rubro)"
                                value={divisionId || "__none__"}
                                onChange={handleDivisionChange}
                                options={divisionOptions}
                                placeholder="Seleccionar división..."
                                disabled={!canEdit}
                            />
                        </div>

                        {/* Unidad de Medida */}
                        <SelectField
                            label="Unidad de Medida"
                            value={unitId}
                            onChange={handleUnitChange}
                            options={unitOptions}
                            placeholder="Seleccionar unidad..."
                            disabled={!canEdit}
                            required
                        />

                        {/* Descripción */}
                        <NotesField
                            label="Descripción"
                            value={description}
                            onChange={handleDescriptionChange}
                            placeholder="Descripción de la tarea, especificaciones, alcance..."
                            rows={3}
                            disabled={!canEdit}
                        />
                    </div>
                </SettingsSection>

                {/* ── Admin Settings ── */}
                {isAdminMode && (
                    <SettingsSection
                        icon={Settings}
                        title="Configuración Admin"
                        description="Cambiar la propiedad de la tarea."
                    >
                        <div className="max-w-sm">
                            <Combobox
                                options={orgOptions}
                                value={selectedOrgId}
                                onValueChange={handleOrgChange}
                                placeholder="Seleccionar organización..."
                                searchPlaceholder="Buscar organización..."
                                emptyMessage="No se encontraron organizaciones"
                            />
                        </div>
                    </SettingsSection>
                )}

            </SettingsSectionContainer>
        </ContentLayout>
    );
}
