"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ConstructionTaskView, ConstructionTaskStatus, CostScope } from "../types";
import { createConstructionTask, updateConstructionTask } from "../actions";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateField, NotesField } from "@/components/shared/forms/fields";
import { TaskView } from "@/features/tasks/types";
import { Search, X } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface CatalogTask {
    id: string;
    name: string | null;
    custom_name: string | null;
    unit_name?: string;
    division_name?: string;
    code: string | null;
}

interface ConstructionTaskFormProps {
    projectId: string;
    organizationId: string;
    catalogTasks: CatalogTask[];
    initialData?: ConstructionTaskView | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ConstructionTaskForm({
    projectId,
    organizationId,
    catalogTasks,
    initialData,
    onSuccess,
    onCancel,
}: ConstructionTaskFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // --- Task Selection ---
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialData?.task_id || null);
    const [taskSearch, setTaskSearch] = useState("");
    const [isCustomTask, setIsCustomTask] = useState(
        isEditing ? !initialData?.task_id : false
    );

    const selectedCatalogTask = useMemo(() => {
        if (!selectedTaskId) return null;
        return catalogTasks.find(t => t.id === selectedTaskId) || null;
    }, [selectedTaskId, catalogTasks]);

    const filteredCatalogTasks = useMemo(() => {
        if (!taskSearch.trim()) return catalogTasks;
        const q = taskSearch.toLowerCase();
        return catalogTasks.filter(t => {
            const name = (t.name || t.custom_name || "").toLowerCase();
            const code = (t.code || "").toLowerCase();
            const division = (t.division_name || "").toLowerCase();
            return name.includes(q) || code.includes(q) || division.includes(q);
        });
    }, [taskSearch, catalogTasks]);

    // --- Form Fields ---
    const [customName, setCustomName] = useState(initialData?.custom_name || "");
    const [customUnit, setCustomUnit] = useState(initialData?.custom_unit || "");
    const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "1");
    const [plannedStartDate, setPlannedStartDate] = useState<Date | undefined>(
        parseDateFromDB(initialData?.planned_start_date) ?? undefined
    );
    const [plannedEndDate, setPlannedEndDate] = useState<Date | undefined>(
        parseDateFromDB(initialData?.planned_end_date) ?? undefined
    );
    const [status, setStatus] = useState<ConstructionTaskStatus>(initialData?.status || "pending");
    const [progressPercent, setProgressPercent] = useState(initialData?.progress_percent?.toString() || "0");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [costScope, setCostScope] = useState(initialData?.cost_scope || "materials_and_labor");

    // --- Validation ---
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Must either select a catalog task or provide a custom name
        if (!isCustomTask && !selectedTaskId) {
            newErrors.task = "Seleccioná una tarea del catálogo";
        }
        if (isCustomTask && !customName.trim()) {
            newErrors.customName = "El nombre es requerido";
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            newErrors.quantity = "La cantidad debe ser mayor a 0";
        }

        const progress = parseInt(progressPercent);
        if (isNaN(progress) || progress < 0 || progress > 100) {
            newErrors.progressPercent = "El progreso debe ser entre 0 y 100";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Handlers ---

    const handleSelectTask = (task: CatalogTask) => {
        setSelectedTaskId(task.id);
        setTaskSearch("");
        setErrors(prev => ({ ...prev, task: "" }));
    };

    const handleClearTask = () => {
        setSelectedTaskId(null);
        setTaskSearch("");
    };

    const handleToggleCustom = () => {
        setIsCustomTask(!isCustomTask);
        setSelectedTaskId(null);
        setTaskSearch("");
        setCustomName("");
        setCustomUnit("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            const payload = {
                task_id: isCustomTask ? null : selectedTaskId,
                custom_name: isCustomTask ? customName.trim() : null,
                custom_unit: isCustomTask ? (customUnit.trim() || null) : null,
                quantity: parseFloat(quantity),
                planned_start_date: formatDateForDB(plannedStartDate),
                planned_end_date: formatDateForDB(plannedEndDate),
                status: status,
                progress_percent: parseInt(progressPercent),
                notes: notes.trim() || null,
                cost_scope: costScope as "materials_and_labor" | "materials_only" | "labor_only",
            };

            const result = isEditing
                ? await updateConstructionTask(initialData.id, projectId, payload)
                : await createConstructionTask(projectId, organizationId, payload);

            if (result.success) {
                toast.success(isEditing ? "Tarea actualizada" : "Tarea creada");
                onSuccess?.();
            } else {
                toast.error(result.error || "Error al guardar la tarea");
            }
        } catch (error) {
            toast.error("Error inesperado");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render ---

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">

                    {/* =================================== */}
                    {/* SECCIÓN 1: Selección de Tarea       */}
                    {/* =================================== */}

                    {!isCustomTask ? (
                        <FormGroup
                            label="Tarea del Catálogo"
                            htmlFor="task_selector"
                            required
                            error={errors.task}
                        >
                            {selectedCatalogTask ? (
                                /* Tarea seleccionada */
                                <div className="flex items-center gap-2 p-3 rounded-lg border bg-accent/50">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {selectedCatalogTask.name || selectedCatalogTask.custom_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {[
                                                selectedCatalogTask.code,
                                                selectedCatalogTask.unit_name,
                                                selectedCatalogTask.division_name,
                                            ].filter(Boolean).join(" · ")}
                                        </p>
                                    </div>
                                    {!isEditing && (
                                        <button
                                            type="button"
                                            onClick={handleClearTask}
                                            className="p-1 rounded-md hover:bg-muted transition-colors"
                                        >
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                /* Buscador de tareas */
                                <div className="space-y-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="task_selector"
                                            placeholder="Buscar por nombre, código o división..."
                                            value={taskSearch}
                                            onChange={(e) => setTaskSearch(e.target.value)}
                                            className="pl-9"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto border rounded-lg divide-y">
                                        {filteredCatalogTasks.length === 0 ? (
                                            <p className="text-sm text-muted-foreground p-3 text-center">
                                                No se encontraron tareas
                                            </p>
                                        ) : (
                                            filteredCatalogTasks.map((task) => (
                                                <button
                                                    key={task.id}
                                                    type="button"
                                                    onClick={() => handleSelectTask(task)}
                                                    className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors"
                                                >
                                                    <p className="text-sm font-medium truncate">
                                                        {task.name || task.custom_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {[task.code, task.unit_name, task.division_name]
                                                            .filter(Boolean)
                                                            .join(" · ")}
                                                    </p>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Toggle a tarea custom */}
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={handleToggleCustom}
                                    className="text-xs text-primary hover:underline mt-1"
                                >
                                    Crear tarea personalizada (sin catálogo)
                                </button>
                            )}
                        </FormGroup>
                    ) : (
                        /* Tarea Custom */
                        <>
                            <FormGroup
                                label="Nombre de la tarea"
                                htmlFor="custom_name"
                                required
                                error={errors.customName}
                            >
                                <Input
                                    id="custom_name"
                                    placeholder="Ej: Limpieza general de obra"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    autoFocus
                                />
                            </FormGroup>

                            <FormGroup label="Unidad" htmlFor="custom_unit">
                                <Input
                                    id="custom_unit"
                                    placeholder="m², ml, un, gl"
                                    value={customUnit}
                                    onChange={(e) => setCustomUnit(e.target.value)}
                                />
                            </FormGroup>

                            {/* Toggle a catálogo */}
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={handleToggleCustom}
                                    className="text-xs text-primary hover:underline"
                                >
                                    ← Seleccionar del catálogo
                                </button>
                            )}
                        </>
                    )}

                    {/* =================================== */}
                    {/* SECCIÓN 2: Datos de Ejecución       */}
                    {/* =================================== */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                        {/* Cantidad */}
                        <FormGroup
                            label="Cantidad"
                            htmlFor="quantity"
                            required
                            error={errors.quantity}
                        >
                            <Input
                                id="quantity"
                                type="number"
                                step="0.01"
                                placeholder="100"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </FormGroup>

                        {/* Alcance de Costos */}
                        <FormGroup label="Alcance de Costos" htmlFor="cost_scope">
                            <Select value={costScope} onValueChange={(v) => setCostScope(v as CostScope)}>
                                <SelectTrigger id="cost_scope">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="materials_and_labor">Materiales + Mano de Obra</SelectItem>
                                    <SelectItem value="materials_only">Solo Materiales</SelectItem>
                                    <SelectItem value="labor_only">Solo Mano de Obra</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        {/* Fecha inicio planificada */}
                        <DateField
                            value={plannedStartDate}
                            onChange={setPlannedStartDate}
                            label="Inicio planificado"
                            required={false}
                        />

                        {/* Fecha fin planificada */}
                        <DateField
                            value={plannedEndDate}
                            onChange={setPlannedEndDate}
                            label="Fin planificado"
                            required={false}
                        />

                        {/* Estado */}
                        <FormGroup label="Estado" htmlFor="status">
                            <Select
                                value={status}
                                onValueChange={(v) => setStatus(v as ConstructionTaskStatus)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="completed">Completada</SelectItem>
                                    <SelectItem value="paused">Pausada</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        {/* Progreso */}
                        <FormGroup
                            label="Progreso (%)"
                            htmlFor="progress_percent"
                            error={errors.progressPercent}
                        >
                            <Input
                                id="progress_percent"
                                type="number"
                                min={0}
                                max={100}
                                placeholder="0"
                                value={progressPercent}
                                onChange={(e) => setProgressPercent(e.target.value)}
                            />
                        </FormGroup>
                    </div>

                    {/* =================================== */}
                    {/* SECCIÓN 3: Notas                    */}
                    {/* =================================== */}

                    <NotesField
                        value={notes}
                        onChange={setNotes}
                        label="Observaciones"
                        placeholder="Notas adicionales sobre la tarea..."
                    />
                </div>
            </div>

            {/* Footer sticky */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Agregar Tarea"}
                onCancel={onCancel}
            />
        </form>
    );
}
