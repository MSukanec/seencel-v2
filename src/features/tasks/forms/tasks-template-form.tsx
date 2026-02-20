"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, Check, Loader2, Wrench, Tag, Layers, Settings2 } from "lucide-react";
import { TaskTemplate } from "../types";
import { createTaskTemplate, updateTaskTemplate } from "../actions";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface TasksTemplateFormProps {
    initialData?: TaskTemplate | null;
}

interface ActionOption { id: string; name: string; short_code: string | null; }
interface ElementOption { id: string; name: string; code: string | null; expression_template: string | null; }
interface SystemOption { id: string; name: string; code: string | null; expression_template: string | null; }
interface DivisionOption { id: string; name: string; }
interface UnitOption { id: string; name: string; symbol: string; }

type Step = "action" | "element" | "system" | "config";
const STEPS: Step[] = ["action", "element", "system", "config"];

const STEP_META: Record<Step, { label: string; icon: React.ElementType }> = {
    action: { label: "Acción", icon: Tag },
    element: { label: "Elemento", icon: Layers },
    system: { label: "Sistema", icon: Wrench },
    config: { label: "Configuración", icon: Settings2 },
};

// ============================================================================
// Component
// ============================================================================

/**
 * Admin form para crear/editar plantillas de tareas.
 * Wizard: Acción → Elemento → Sistema → Configuración.
 * El nombre se genera automáticamente, no es editable por el admin.
 * Patrón: semi-autónomo (callbacks internos), sticky footer con FormFooter.
 */
export function TasksTemplateForm({ initialData }: TasksTemplateFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const isEditing = !!initialData;

    // Wizard step
    const [step, setStep] = useState<Step>(isEditing ? "config" : "action");
    const [isLoading, setIsLoading] = useState(false);

    // Catalog data
    const [isFetching, setIsFetching] = useState(true);
    const [actions, setActions] = useState<ActionOption[]>([]);
    const [elements, setElements] = useState<ElementOption[]>([]);
    const [systems, setSystems] = useState<SystemOption[]>([]);
    const [divisions, setDivisions] = useState<DivisionOption[]>([]);
    const [units, setUnits] = useState<UnitOption[]>([]);

    // Selections
    const [actionId, setActionId] = useState(initialData?.task_action_id ?? "");
    const [elementId, setElementId] = useState(initialData?.task_element_id ?? "");
    const [systemId, setSystemId] = useState(initialData?.task_construction_system_id ?? "");
    const [divisionId, setDivisionId] = useState(initialData?.task_division_id ?? "");
    const [unitId, setUnitId] = useState(initialData?.unit_id ?? "");
    const [status, setStatus] = useState<string>(initialData?.status ?? "draft");
    const [description, setDescription] = useState(initialData?.description ?? "");


    // ========================================================================
    // Load catalog data on mount
    // ========================================================================

    useEffect(() => {
        const load = async () => {
            const supabase = createClient();
            const [actRes, elRes, sysRes, divRes, unitRes] = await Promise.all([
                supabase.schema("catalog").from("task_actions").select("id, name, short_code").order("name"),
                supabase.schema("catalog").from("task_elements").select("id, name, code, expression_template").eq("is_deleted", false).order("name"),
                supabase.schema("catalog").from("task_construction_systems").select("id, name, code, expression_template").eq("is_deleted", false).order("name"),
                supabase.schema("catalog").from("task_divisions").select("id, name").eq("is_deleted", false).order("name"),
                supabase.schema("catalog").from("units").select("id, name, symbol").eq("is_deleted", false).contains("applicable_to", ["task"]).order("name"),
            ]);
            if (actRes.error) console.error("[TasksTemplateForm] task_actions error:", actRes.error);
            if (elRes.error) console.error("[TasksTemplateForm] task_elements error:", elRes.error);
            if (sysRes.error) console.error("[TasksTemplateForm] task_construction_systems error:", sysRes.error);
            if (divRes.error) console.error("[TasksTemplateForm] task_divisions error:", divRes.error);
            if (unitRes.error) console.error("[TasksTemplateForm] units error:", unitRes.error);
            setActions(actRes.data ?? []);
            setElements(elRes.data ?? []);
            setSystems(sysRes.data ?? []);
            setDivisions(divRes.data ?? []);
            setUnits(unitRes.data ?? []);
            setIsFetching(false);
        };
        load();
    }, []);

    // ========================================================================
    // Derived
    // ========================================================================

    const selectedAction = useMemo(() => actions.find(a => a.id === actionId), [actions, actionId]);
    const selectedElement = useMemo(() => elements.find(e => e.id === elementId), [elements, elementId]);
    const selectedSystem = useMemo(() => systems.find(s => s.id === systemId), [systems, systemId]);

    // Code is auto-generated: "{ACTION_CODE}-{ELEMENT_CODE}-{SYSTEM_CODE}"
    // Ej: "EJE-MUR-MAM". El sistema es opcional. El admin puede sobreescribirlo.
    const generatedCode = useMemo(() => {
        const actCode = selectedAction?.short_code ||
            (selectedAction ? selectedAction.name.substring(0, 3).toUpperCase() : "");
        const elCode = selectedElement?.code ||
            (selectedElement ? selectedElement.name.substring(0, 3).toUpperCase() : "");
        if (!actCode || !elCode) return "";
        const sysCode = selectedSystem?.code ||
            (selectedSystem ? selectedSystem.name.substring(0, 3).toUpperCase() : "");
        return sysCode ? `${actCode}-${elCode}-${sysCode}` : `${actCode}-${elCode}`;
    }, [selectedAction, selectedElement, selectedSystem]);

    // Código final = siempre el auto-generado (no editable)

    // Name is auto-generated usando expression_template de cada entidad.
    // Fallback: "de {value}" si el template es NULL (comportamiento anterior).
    // Ej: elemento con template "de {value}" → "de muro"
    //     elemento con template "{value}"    → "obra completa" (sin preposición)
    const generatedName = useMemo(() => {
        const applyTemplate = (template: string | null | undefined, value: string) =>
            (template?.trim() || "de {value}").replace("{value}", value.toLowerCase());

        const parts: string[] = [];
        if (selectedAction) parts.push(selectedAction.name);
        if (selectedElement) parts.push(applyTemplate(selectedElement.expression_template, selectedElement.name));
        if (selectedSystem) parts.push(applyTemplate(selectedSystem.expression_template, selectedSystem.name));
        return parts.join(" ");
    }, [selectedAction, selectedElement, selectedSystem]);

    const stepIndex = STEPS.indexOf(step);
    const isLastStep = stepIndex === STEPS.length - 1;

    const canProceed = useMemo(() => {
        switch (step) {
            case "action": return !!actionId;
            case "element": return !!elementId;
            case "system": return !!systemId;
            case "config": return !!unitId && !!status;
        }
    }, [step, actionId, elementId, systemId, unitId, status]);

    // ========================================================================
    // Navigation
    // ========================================================================

    const handleNext = () => {
        if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1]);
    };

    const handleBack = () => {
        if (isEditing) { closeModal(); return; }
        if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
    };

    // ========================================================================
    // Submit
    // ========================================================================

    const handleSubmit = async () => {
        if (!canProceed) return;

        setIsLoading(true);
        const toastId = toast.loading(isEditing ? "Guardando plantilla..." : "Creando plantilla...");

        const formData = new FormData();
        formData.set("name", generatedName);
        formData.set("code", generatedCode);
        formData.set("description", description.trim());
        formData.set("task_action_id", actionId);
        formData.set("task_element_id", elementId);
        formData.set("task_construction_system_id", systemId);
        formData.set("task_division_id", divisionId || "");
        formData.set("unit_id", unitId);
        formData.set("status", status);

        const result = isEditing
            ? await updateTaskTemplate(initialData!.id, formData)
            : await createTaskTemplate(formData);

        if (result.error) {
            toast.error(result.error, { id: toastId });
            setIsLoading(false);
            return;
        }

        toast.success(isEditing ? "Plantilla actualizada" : "Plantilla creada", { id: toastId });
        closeModal();
        router.refresh();
    };

    // ========================================================================
    // Render — Step content
    // ========================================================================

    const renderStepContent = () => {
        if (isFetching) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            );
        }

        switch (step) {
            case "action":
                return (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-3">
                            La acción define el verbo de la tarea (ej: &quot;Colocación&quot;, &quot;Pintura&quot;, &quot;Demolición&quot;).
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {actions.map((a) => (
                                <Card
                                    key={a.id}
                                    className={cn(
                                        "p-3 cursor-pointer transition-all hover:border-primary",
                                        actionId === a.id && "border-primary bg-primary/5"
                                    )}
                                    onClick={() => setActionId(a.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {actionId === a.id && <Check className="h-4 w-4 text-primary" />}
                                            <span className="font-medium text-sm">{a.name}</span>
                                        </div>
                                        {a.short_code && (
                                            <Badge variant="outline" className="text-xs font-mono">{a.short_code}</Badge>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                );

            case "element":
                return (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-3">
                            El elemento es el objeto sobre el que se realiza la acción (ej: &quot;Muro&quot;, &quot;Cielorraso&quot;, &quot;Piso&quot;).
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {elements.map((el) => (
                                <Card
                                    key={el.id}
                                    className={cn(
                                        "p-3 cursor-pointer transition-all hover:border-primary",
                                        elementId === el.id && "border-primary bg-primary/5"
                                    )}
                                    onClick={() => setElementId(el.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {elementId === el.id && <Check className="h-4 w-4 text-primary" />}
                                            <span className="font-medium text-sm">{el.name}</span>
                                        </div>
                                        {el.code && (
                                            <Badge variant="outline" className="text-xs font-mono">{el.code}</Badge>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                );

            case "system":
                return (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-3">
                            El sistema constructivo agrupa las tareas por tipo de construcción (ej: &quot;Mampostería&quot;, &quot;Hormigón Armado&quot;).
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {systems.map((s) => (
                                <Card
                                    key={s.id}
                                    className={cn(
                                        "p-3 cursor-pointer transition-all hover:border-primary",
                                        systemId === s.id && "border-primary bg-primary/5"
                                    )}
                                    onClick={() => setSystemId(s.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {systemId === s.id && <Check className="h-4 w-4 text-primary" />}
                                            <span className="font-medium text-sm">{s.name}</span>
                                        </div>
                                        {s.code && (
                                            <Badge variant="outline" className="text-xs font-mono">{s.code}</Badge>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                );

            case "config":
                return (
                    <div className="space-y-4">
                        {/* Auto-generated preview */}
                        <div className="rounded-md bg-muted p-3 space-y-2">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Nombre generado automáticamente</p>
                                <p className="font-medium text-sm">{generatedName || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Código base del template</p>
                                <p className="font-mono font-semibold text-sm tracking-widest text-primary">
                                    {generatedCode || "—"}
                                </p>
                            </div>
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            {/* Unidad */}
                            <FormGroup label="Unidad" required>
                                <Select value={unitId} onValueChange={setUnitId} disabled={isLoading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar unidad..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.name} ({u.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormGroup>

                            {/* Estado */}
                            <FormGroup label="Estado" required>
                                <Select value={status} onValueChange={setStatus} disabled={isLoading}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Borrador</SelectItem>
                                        <SelectItem value="active">Activo</SelectItem>
                                        <SelectItem value="archived">Archivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormGroup>
                        </div>

                        {/* División (opcional) */}
                        <FormGroup label="Rubro (opcional)">
                            <Select
                                value={divisionId || "_none"}
                                onValueChange={(v) => setDivisionId(v === "_none" ? "" : v)}
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin rubro" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin rubro</SelectItem>
                                    {divisions.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        {/* Descripción (opcional) */}
                        <FormGroup label="Descripción">
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descripción opcional de la plantilla..."
                                rows={3}
                                disabled={isLoading}
                            />
                        </FormGroup>
                    </div>
                );
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Step indicators */}
            {!isEditing && (
                <div className="flex items-center gap-1 mb-5">
                    {STEPS.map((s, i) => {
                        const Icon = STEP_META[s].icon;
                        const isDone = i < stepIndex;
                        const isCurrent = s === step;
                        return (
                            <div key={s} className="flex items-center gap-1">
                                <div
                                    className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                                        isCurrent && "bg-primary text-primary-foreground",
                                        isDone && "bg-muted text-muted-foreground",
                                        !isCurrent && !isDone && "text-muted-foreground/40"
                                    )}
                                >
                                    {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                                    {STEP_META[s].label}
                                </div>
                                {i < STEPS.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Content — scrolleable */}
            <div className="flex-1 overflow-y-auto">
                {renderStepContent()}
            </div>

            {/* Sticky footer */}
            {isLastStep ? (
                <FormFooter
                    className="-mx-4 -mb-4 mt-6"
                    isLoading={isLoading}
                    isForm={false}
                    submitLabel={isEditing ? "Guardar Cambios" : "Crear Plantilla"}
                    onCancel={handleBack}
                    onSubmit={handleSubmit}
                    submitDisabled={!canProceed}
                />
            ) : (
                <div className="border-t -mx-4 -mb-4 mt-6 px-4 py-3 flex justify-between gap-2 bg-background">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleBack}
                        disabled={isFetching}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        {stepIndex === 0 ? "Cancelar" : "Atrás"}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceed || isFetching}
                    >
                        Siguiente
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}
