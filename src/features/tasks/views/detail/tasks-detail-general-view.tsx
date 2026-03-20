"use client";

// ============================================================================
// TASK DETAIL — GENERAL VIEW (Properties-Style Layout)
// ============================================================================
// Vista de detalle general con layout tipo Linear/Notion.
// Cada propiedad se muestra en una fila: ícono + label | valor editable.
// Chips para División y Unidad, inputs inline para texto.
// Auto-save con debounce para texto, save inmediato para selects.
// ============================================================================

import { useCallback, useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { ContentCard } from "@/components/cards";
import { SelectChip, UnitChip, StatusChip } from "@/components/shared/chips";
import type { StatusVariant } from "@/components/shared/chips";
import { Combobox } from "@/components/ui/combobox";
import { Settings, FileText, Hash, FolderTree, Ruler, AlignLeft, Type, CircleDot } from "lucide-react";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/use-auto-save";
import { updateTask, updateTaskOrganization } from "@/features/tasks/actions";
import type { TaskView, TaskDivision, Unit } from "@/features/tasks/types";

// ============================================================================
// PropertyRow — single row in the properties list
// ============================================================================

function PropertyRow({
    icon: Icon,
    label,
    children,
    alignTop = false,
}: {
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
    alignTop?: boolean;
}) {
    return (
        <div className={`flex gap-3 py-2.5 border-b border-border/30 last:border-b-0 ${alignTop ? "items-start" : "items-center"}`}>
            <div className="flex items-center gap-2 w-[140px] shrink-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
}

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

interface TaskTextFields {
    name: string;
    code: string;
    description: string;
    unit_id: string;
    task_division_id: string;
    system_division_id: string;
    status: string;
}

type TaskCatalogStatus = "active" | "archived";

const TASK_STATUS_OPTIONS: { value: string; label: string; variant: StatusVariant }[] = [
    { value: "active", label: "Activa", variant: "positive" },
    { value: "archived", label: "Archivada", variant: "negative" },
];

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
    const [systemDivisionId, setSystemDivisionId] = useState(task.system_division_id || "");
    const [status, setStatus] = useState<TaskCatalogStatus>(
        (task as any)?.status || "active"
    );

    // Admin mode
    const [selectedOrgId, setSelectedOrgId] = useState(task.organization_id || "");

    // ========================================================================
    // Auto-save para campos de texto
    // ========================================================================

    const { triggerAutoSave } = useAutoSave<TaskTextFields>({
        saveFn: async (fields) => {
            const formData = new FormData();
            formData.set("id", task.id);
            formData.set("name", fields.name);
            formData.set("code", fields.code);
            formData.set("description", fields.description);
            formData.set("unit_id", fields.unit_id);
            formData.set("task_division_id", fields.task_division_id);
            formData.set("system_division_id", fields.system_division_id);
            formData.set("status", fields.status);
            formData.set("is_published", String(task.is_published ?? false));
            if (isAdminMode) formData.set("is_admin_mode", "true");
            const result = await updateTask(formData);
            if (result.error) {
                throw new Error(result.error);
            }
        },
        validate: (fields) => !!fields.name.trim(),
    });

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
            formData.set("system_division_id", fieldName === "system_division_id" ? value : systemDivisionId);
            formData.set("status", fieldName === "status" ? value : status);
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
    }, [task.id, task.is_published, isAdminMode, name, code, description, unitId, divisionId, systemDivisionId, status]);

    // ========================================================================
    // Field change handlers
    // ========================================================================

    const handleNameChange = (value: string) => {
        setName(value);
        triggerAutoSave({ name: value, code, description, unit_id: unitId, task_division_id: divisionId, system_division_id: systemDivisionId, status });
    };

    const handleCodeChange = (value: string) => {
        setCode(value);
        triggerAutoSave({ name, code: value, description, unit_id: unitId, task_division_id: divisionId, system_division_id: systemDivisionId, status });
    };

    const handleDescriptionChange = (value: string) => {
        setDescription(value);
        triggerAutoSave({ name, code, description: value, unit_id: unitId, task_division_id: divisionId, system_division_id: systemDivisionId, status });
    };

    const handleUnitChange = (value: string) => {
        setUnitId(value);
        saveField("unit_id", value);
    };

    const handleDivisionChange = (value: string) => {
        setDivisionId(value);
        saveField("task_division_id", value);
    };

    const handleStatusChange = (value: string) => {
        setStatus(value as TaskCatalogStatus);
        saveField("status", value);
    };

    const handleSystemDivisionChange = (value: string) => {
        setSystemDivisionId(value);
        saveField("system_division_id", value);
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
    // Derived data — Chip options
    // ========================================================================

    const buildDivisionOptions = (source: TaskDivision[]) => {
        return source
            .sort((a, b) => {
                const getSortKey = (d: TaskDivision) => {
                    if (!d.parent_id) return `${String(d.order ?? 999).padStart(3, '0')}-${d.name}`;
                    const parent = source.find(p => p.id === d.parent_id);
                    const parentKey = parent ? `${String(parent.order ?? 999).padStart(3, '0')}-${parent.name}` : '999-Z';
                    return `${parentKey}-${String(d.order ?? 999).padStart(3, '0')}-${d.name}`;
                };
                return getSortKey(a).localeCompare(getSortKey(b));
            })
            .map(d => {
                let label = d.order != null ? `${d.order}. ${d.name}` : d.name;
                if (d.parent_id) {
                    const parent = source.find(p => p.id === d.parent_id);
                    if (parent) {
                        const parentName = parent.order != null ? `${parent.order}. ${parent.name}` : parent.name;
                        label = `${parentName} › ${d.name}`;
                    }
                }
                return { value: d.id, label };
            });
    };

    const systemDivisionOptions = useMemo(
        () => buildDivisionOptions(divisions.filter(d => d.is_system)),
        [divisions]
    );

    const ownDivisionOptions = useMemo(
        () => buildDivisionOptions(divisions.filter(d => !d.is_system)),
        [divisions]
    );

    const unitOptions = useMemo(() => {
        return units
            .filter(u => u.applicable_to?.includes("task"))
            .map(u => ({
                value: u.id,
                label: u.name,
                symbol: u.symbol || undefined,
            }));
    }, [units]);

    // Admin: org options
    const orgOptions = [
        { value: "", label: "Sistema (sin organización)" },
        ...organizations.map(org => ({
            value: org.id,
            label: org.name,
        }))
    ];

    return (
        <div className="space-y-6">

            {/* ── Propiedades de la Tarea ── */}
            <ContentCard
                icon={<FileText className="h-4 w-4" />}
                title="Propiedades"
                description="Información general de la tarea."
                compact
            >
                <div className="px-1">
                    {/* Nombre */}
                    <PropertyRow icon={Type} label="Nombre">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Nombre de la tarea..."
                            disabled={!canEdit}
                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border-none disabled:opacity-50"
                        />
                    </PropertyRow>

                    {/* Código */}
                    <PropertyRow icon={Hash} label="Código">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            placeholder="Ej: ALB010-0001"
                            disabled={!canEdit}
                            className="w-full bg-transparent text-sm text-foreground font-mono placeholder:text-muted-foreground/40 outline-none border-none disabled:opacity-50"
                        />
                    </PropertyRow>

                    {/* Estado */}
                    <PropertyRow icon={CircleDot} label="Estado">
                        <StatusChip
                            value={status}
                            onChange={handleStatusChange}
                            options={TASK_STATUS_OPTIONS}
                        />
                    </PropertyRow>

                    {/* Rubro de Sistema */}
                    <PropertyRow icon={FolderTree} label="Rubro de Sistema">
                        <SelectChip
                            value={systemDivisionId}
                            onChange={handleSystemDivisionChange}
                            options={systemDivisionOptions}
                            icon={<FolderTree className="h-3.5 w-3.5 text-muted-foreground" />}
                            emptyLabel="Rubro de Sistema"
                            searchPlaceholder="Buscar rubro de sistema..."
                            emptySearchText="No se encontraron rubros del sistema"
                            manageLabel="Gestionar rubros..."
                            manageRoute={{ pathname: isAdminMode ? "/admin/catalog/tasks/divisions" : "/organization/catalog/tasks/divisions" }}
                        />
                    </PropertyRow>

                    {/* Rubro Propio */}
                    <PropertyRow icon={FolderTree} label="Rubro Propio">
                        <SelectChip
                            value={divisionId}
                            onChange={handleDivisionChange}
                            options={ownDivisionOptions}
                            icon={<FolderTree className="h-3.5 w-3.5 text-muted-foreground" />}
                            emptyLabel="Rubro Propio"
                            searchPlaceholder="Buscar rubro propio..."
                            emptySearchText="No se encontraron rubros propios"
                            manageLabel="Gestionar rubros..."
                            manageRoute={{ pathname: isAdminMode ? "/admin/catalog/tasks/divisions" : "/organization/catalog/tasks/divisions" }}
                        />
                    </PropertyRow>

                    {/* Unidad de Medida */}
                    <PropertyRow icon={Ruler} label="Unidad">
                        <UnitChip
                            value={unitId}
                            onChange={handleUnitChange}
                            options={unitOptions}
                            emptyLabel="Seleccionar unidad"
                        />
                    </PropertyRow>

                    {/* Descripción */}
                    <PropertyRow icon={AlignLeft} label="Descripción" alignTop>
                        <textarea
                            value={description}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            placeholder="Descripción, especificaciones, alcance..."
                            disabled={!canEdit}
                            rows={3}
                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border-none resize-none leading-relaxed disabled:opacity-50"
                        />
                    </PropertyRow>
                </div>
            </ContentCard>

            {/* ── Admin Settings ── */}
            {isAdminMode && (
                <ContentCard
                    icon={<Settings className="h-4 w-4" />}
                    title="Configuración Admin"
                    description="Cambiar la propiedad de la tarea."
                    compact
                >
                    <div className="px-1">
                        <PropertyRow icon={Settings} label="Organización">
                            <Combobox
                                options={orgOptions}
                                value={selectedOrgId}
                                onValueChange={handleOrgChange}
                                placeholder="Seleccionar organización..."
                                searchPlaceholder="Buscar organización..."
                                emptyMessage="No se encontraron organizaciones"
                            />
                        </PropertyRow>
                    </div>
                </ContentCard>
            )}

        </div>
    );
}
