"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle, Search, LayoutTemplate } from "lucide-react";
import { Unit, TaskParameter, TaskParameterOption } from "../types";
import { createTask } from "../actions";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface TasksParametricFormProps {
    units: Unit[];
    onCancel?: () => void;
    onSuccess?: () => void;
    onBack?: () => void;
    isAdminMode?: boolean;
}

interface TemplateOption {
    id: string;
    name: string;
    description: string | null;
    action_id: string;
    action_name: string | null;
    action_short_code: string | null;
    element_id: string;
    element_name: string | null;
    element_code: string | null;
    system_id: string | null;
    system_name: string | null;
    system_code: string | null; // Fix 1: agregar system_code a TemplateOption
    division_id: string | null;
    unit_id: string | null;
    status: string;
}

interface ParameterWithOptions extends TaskParameter {
    options: TaskParameterOption[];
}

type Step = "template" | "parameters" | "confirm";

// ============================================================================
// Component
// ============================================================================

export function TasksParametricForm({
    units,
    onCancel,
    onSuccess,
    onBack,
    isAdminMode = false,
}: TasksParametricFormProps) {
    // Wizard state
    const [step, setStep] = useState<Step>("template");
    const [isLoading, setIsLoading] = useState(false);

    // Template loading
    const [isFetchingTemplates, setIsFetchingTemplates] = useState(true);
    const [templates, setTemplates] = useState<TemplateOption[]>([]);
    const [templateSearch, setTemplateSearch] = useState("");

    // Selections
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

    // Parameter loading
    const [isFetchingParameters, setIsFetchingParameters] = useState(false);
    const [templateParameters, setTemplateParameters] = useState<ParameterWithOptions[]>([]);

    // Parameter values: { parameter_slug: option_id }
    const [parameterValues, setParameterValues] = useState<Record<string, string>>({});

    // Duplicate check
    const [duplicateTask, setDuplicateTask] = useState<{ id: string; name: string; code: string } | null>(null);

    // Derived
    const selectedTemplate = useMemo(
        () => templates.find((t) => t.id === selectedTemplateId),
        [templates, selectedTemplateId]
    );

    const selectedOptions = useMemo(() => {
        const result: Record<string, TaskParameterOption | undefined> = {};
        templateParameters.forEach((param) => {
            const optId = parameterValues[param.slug];
            if (optId) result[param.slug] = param.options.find((o) => o.id === optId);
        });
        return result;
    }, [templateParameters, parameterValues]);

    const allRequiredFilled = useMemo(
        () => templateParameters.filter((p) => p.is_required).every((p) => parameterValues[p.slug]),
        [templateParameters, parameterValues]
    );

    // Generated name + code from template + selected options
    const generatedName = useMemo(() => {
        if (!selectedTemplate) return "";
        const actionName = selectedTemplate.action_name ?? "Trabajo";
        const elementName = selectedTemplate.element_name ?? "Elemento";
        const systemName = selectedTemplate.system_name;
        // Base: "Acción de elemento"
        let name = `${actionName} de ${elementName.toLowerCase()}`;
        // Add system if present: "Acción de elemento de sistema"
        if (systemName) name += ` de ${systemName.toLowerCase()}`;
        // Append each selected parameter option using its expression_template.
        // If a parameter has expression_template = "de {value}", apply it.
        // Fallback: "de {value}" when no template is defined.
        const parts = templateParameters
            .map((p) => {
                const optLabel = selectedOptions[p.slug]?.label;
                if (!optLabel) return null;
                const tmpl = p.expression_template?.trim();
                if (tmpl) return tmpl.replace("{value}", optLabel.toLowerCase());
                return `de ${optLabel.toLowerCase()}`;
            })
            .filter(Boolean) as string[];
        if (parts.length > 0) name += ` ${parts.join(" ")}`;
        return name;
    }, [selectedTemplate, templateParameters, selectedOptions]);

    const generatedCode = useMemo(() => {
        if (!selectedTemplate) return "";
        const actionCode =
            selectedTemplate.action_short_code ||
            (selectedTemplate.action_name ?? "ACT").substring(0, 3).toUpperCase();
        const elemCode =
            selectedTemplate.element_code ||
            (selectedTemplate.element_name ?? "ELM").substring(0, 3).toUpperCase();
        const sysCode =
            selectedTemplate.system_code ||
            (selectedTemplate.system_name ? selectedTemplate.system_name.substring(0, 3).toUpperCase() : null);
        let code = sysCode ? `${actionCode}-${elemCode}-${sysCode}` : `${actionCode}-${elemCode}`;
        const paramCodes = templateParameters
            .map((p) => selectedOptions[p.slug]?.short_code)
            .filter(Boolean) as string[];
        if (paramCodes.length > 0) code += `-${paramCodes.join("-")}`;
        return code;
    }, [selectedTemplate, templateParameters, selectedOptions]);

    // ========================================================================
    // Effects
    // ========================================================================

    // Load active templates on mount
    useEffect(() => {
        const load = async () => {
            setIsFetchingTemplates(true);
            const supabase = createClient();
            const { data } = await supabase
                .schema("catalog")
                .from("task_templates")
                .select(`
                    id, name, description, status,
                    task_action_id, action:task_actions(name, short_code),
                    task_element_id, element:task_elements(name, code),
                    task_construction_system_id, system:task_construction_systems(name, code),
                    task_division_id, unit_id
                `)
                .eq("is_deleted", false)
                // Admins can see all templates (draft + active)
                // Regular users only see active templates
                .in("status", isAdminMode ? ["active", "draft"] : ["active"])
                .order("name", { ascending: true });

            if (data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setTemplates(data.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    action_id: t.task_action_id,
                    action_name: t.action?.name ?? null,
                    action_short_code: t.action?.short_code ?? null,
                    element_id: t.task_element_id,
                    element_name: t.element?.name ?? null,
                    element_code: t.element?.code ?? null,
                    system_id: t.task_construction_system_id,
                    system_name: t.system?.name ?? null,
                    system_code: t.system?.code ?? null,
                    division_id: t.task_division_id,
                    unit_id: t.unit_id,
                    status: t.status,
                })));
            }
            setIsFetchingTemplates(false);
        };
        load();
    }, []);

    // Load parameters for the selected template
    useEffect(() => {
        if (!selectedTemplateId) {
            setTemplateParameters([]);
            setParameterValues({});
            return;
        }

        const load = async () => {
            setIsFetchingParameters(true);
            const supabase = createClient();

            // Get parameter links WITH their template-specific order
            const { data: links } = await supabase
                .schema("catalog")
                .from("task_template_parameters")
                .select('"parameter_id", "order", "is_required"')
                .eq("template_id", selectedTemplateId)
                .order("order", { ascending: true, nullsFirst: false });

            if (!links || links.length === 0) {
                setTemplateParameters([]);
                setParameterValues({});
                setIsFetchingParameters(false);
                return;
            }

            const paramIds = links.map((l: { parameter_id: string }) => l.parameter_id);
            // Build order map: parameterId → position defined in the template
            const orderMap: Record<string, number> = {};
            links.forEach((l: { parameter_id: string; order: number }, idx: number) => {
                orderMap[l.parameter_id] = l.order ?? idx;
            });

            const { data: params } = await supabase
                .schema("catalog")
                .from("task_parameters")
                .select("*, options:task_parameter_options(*)")
                .in("id", paramIds)
                .eq("is_deleted", false);

            // Sort by template-defined order (not task_parameters.order)
            const sorted = (params || []).sort(
                (a, b) => (orderMap[a.id] ?? 999) - (orderMap[b.id] ?? 999)
            );

            setTemplateParameters((sorted as ParameterWithOptions[]) || []);
            setParameterValues({});
            setIsFetchingParameters(false);
        };

        load();
    }, [selectedTemplateId]);

    // Duplicate check
    useEffect(() => {
        if (!generatedCode) {
            setDuplicateTask(null);
            return;
        }

        const check = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .schema("catalog")
                .from("tasks")
                .select("id, name, code")
                .eq("code", generatedCode)
                .eq("is_deleted", false)
                .limit(1);
            setDuplicateTask(data && data.length > 0 ? (data[0] as { id: string; name: string; code: string }) : null);
        };

        check();
    }, [generatedCode]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const stepsWithParams: Step[] = ["template", "parameters", "confirm"];
    const stepsNoParams: Step[] = ["template", "confirm"];

    const steps: Step[] = templateParameters.length > 0 ? stepsWithParams : stepsNoParams;

    const handleNext = () => {
        const idx = steps.indexOf(step);
        if (idx < steps.length - 1) setStep(steps[idx + 1]);
    };

    const handlePrev = () => {
        const idx = steps.indexOf(step);
        if (idx > 0) {
            setStep(steps[idx - 1]);
        } else if (onBack) {
            onBack();
        }
    };

    const canProceed = () => {
        switch (step) {
            case "template": return !!selectedTemplateId;
            case "parameters": return allRequiredFilled && !duplicateTask;
            case "confirm": return !duplicateTask;
            default: return false;
        }
    };

    const handleSubmit = async () => {
        if (!selectedTemplate) return;
        if (duplicateTask) {
            toast.error("Esta tarea ya existe en el sistema");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Creando tarea paramétrica...");

        try {
            // Resolve unit from template
            const unitId = selectedTemplate.unit_id;
            if (!unitId) {
                toast.error("La plantilla no tiene unidad definida", { id: toastId });
                setIsLoading(false);
                return;
            }

            // Build parameter_values snapshot
            const savedParamValues: Record<string, string> = {};
            templateParameters.forEach((param) => {
                const optionId = parameterValues[param.slug];
                if (optionId) {
                    const option = param.options.find((o) => o.id === optionId);
                    savedParamValues[param.slug] = option?.name || optionId;
                }
            });

            const formData = new FormData();
            formData.set("name", generatedName);
            formData.set("is_system", "true");
            formData.set("is_parametric", "true");
            formData.set("task_action_id", selectedTemplate.action_id);
            formData.set("task_element_id", selectedTemplate.element_id);
            formData.set("unit_id", unitId);
            formData.set("code", generatedCode);
            formData.set("parameter_values", JSON.stringify(savedParamValues));
            formData.set("is_published", "true");
            formData.set("status", "published");
            formData.set("template_id", selectedTemplateId);
            if (selectedTemplate.system_id) {
                formData.set("task_construction_system_id", selectedTemplate.system_id);
            }
            if (selectedTemplate.division_id) {
                formData.set("task_division_id", selectedTemplate.division_id);
            }

            const result = await createTask(formData);

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success("¡Tarea paramétrica creada!", { id: toastId });
                onSuccess?.();
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error desconocido";
            toast.error("Error inesperado: " + msg, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render Steps
    // ========================================================================

    const renderTemplateStep = () => {
        if (isFetchingTemplates) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            );
        }

        if (templates.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <LayoutTemplate className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="font-medium">No hay plantillas disponibles</p>
                    <p className="text-sm mt-1">Pedile a un administrador que cree plantillas de tareas.</p>
                </div>
            );
        }

        const filtered = templates.filter(
            (t) =>
                !templateSearch ||
                t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                (t.action_name ?? "").toLowerCase().includes(templateSearch.toLowerCase()) ||
                (t.element_name ?? "").toLowerCase().includes(templateSearch.toLowerCase())
        );

        return (
            <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar plantilla..."
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No hay plantillas que coincidan con &quot;{templateSearch}&quot;
                    </div>
                ) : (
                    filtered.map((template) => (
                        <Card
                            key={template.id}
                            className={cn(
                                "p-4 cursor-pointer transition-all hover:border-primary",
                                selectedTemplateId === template.id && "border-primary bg-primary/5"
                            )}
                            onClick={() => setSelectedTemplateId(template.id)}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "p-2 rounded-md shrink-0",
                                        selectedTemplateId === template.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}
                                >
                                    <LayoutTemplate className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">{template.name}</span>
                                        {template.action_name && (
                                            <Badge variant="outline" className="text-xs">
                                                {template.action_short_code || template.action_name}
                                            </Badge>
                                        )}
                                        {template.element_name && (
                                            <Badge variant="secondary" className="text-xs">
                                                {template.element_name}
                                            </Badge>
                                        )}
                                        {template.system_name && (
                                            <span className="text-xs text-muted-foreground">· {template.system_name}</span>
                                        )}
                                    </div>
                                    {template.description && (
                                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                            {template.description}
                                        </p>
                                    )}
                                </div>
                                {selectedTemplateId === template.id && (
                                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        );
    };

    const renderParametersStep = () => {
        if (isFetchingParameters) {
            return (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            );
        }

        if (templateParameters.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    Esta plantilla no requiere parámetros adicionales
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {templateParameters.map((param) => (
                    <FormGroup
                        key={param.id}
                        label={param.label}
                        required={param.is_required}
                        helpText={param.description || undefined}
                    >
                        <Select
                            value={parameterValues[param.slug] || ""}
                            onValueChange={(value) =>
                                setParameterValues((prev) => ({ ...prev, [param.slug]: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={`Seleccionar ${param.label.toLowerCase()}...`} />
                            </SelectTrigger>
                            <SelectContent>
                                {param.options.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        <div className="flex items-center gap-2">
                                            {option.short_code && (
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {option.short_code}
                                                </Badge>
                                            )}
                                            {option.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>
                ))}

                {/* Preview */}
                {generatedName && (
                    <Card className="p-3 bg-muted/50 mt-4">
                        <div className="text-xs text-muted-foreground mb-1">Vista previa</div>
                        <div className="font-medium">{generatedName}</div>
                        <Badge variant="outline" className="font-mono mt-1">{generatedCode}</Badge>
                    </Card>
                )}

                {/* Duplicate warning */}
                {duplicateTask && allRequiredFilled && (
                    <Card className="p-4 border-amber-500 bg-amber-500/10 mt-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium text-amber-600">Esta combinación ya existe</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Ya existe la tarea &quot;{duplicateTask.name}&quot; con código {duplicateTask.code}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        );
    };

    const renderConfirmStep = () => {
        const unitId = selectedTemplate?.unit_id;
        const unitName = units.find((u) => u.id === unitId)?.name || "Sin unidad";

        return (
            <div className="space-y-4">
                <Card className="p-4 bg-muted/50">
                    <h3 className="font-semibold mb-3">Resumen de la tarea</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Plantilla:</span>
                            <span className="font-medium text-right max-w-[60%]">{selectedTemplate?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nombre generado:</span>
                            <span className="font-medium text-right max-w-[60%]">{generatedName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Código:</span>
                            <Badge variant="outline" className="font-mono">{generatedCode}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Acción:</span>
                            <span>{selectedTemplate?.action_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Elemento:</span>
                            <span>{selectedTemplate?.element_name}</span>
                        </div>
                        {selectedTemplate?.system_name && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sistema:</span>
                                <span>{selectedTemplate.system_name}</span>
                            </div>
                        )}
                        {templateParameters.length > 0 && (
                            <>
                                <hr className="my-2" />
                                {templateParameters.map((param) => {
                                    const option = selectedOptions[param.slug];
                                    return option ? (
                                        <div key={param.slug} className="flex justify-between">
                                            <span className="text-muted-foreground">{param.label}:</span>
                                            <span>{option.label}</span>
                                        </div>
                                    ) : null;
                                })}
                            </>
                        )}
                        <hr className="my-2" />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Unidad:</span>
                            <span>{unitName}</span>
                        </div>
                    </div>
                </Card>

                {duplicateTask && (
                    <Card className="p-4 border-amber-500 bg-amber-500/10">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium text-amber-600">Esta combinación ya existe</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Ya existe la tarea &quot;{duplicateTask.name}&quot; con código {duplicateTask.code}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <p className="text-sm text-muted-foreground text-center">
                    Esta tarea se creará como <strong>tarea de sistema</strong> disponible para todas las organizaciones.
                </p>
            </div>
        );
    };

    // ========================================================================
    // Main Render
    // ========================================================================

    const stepMeta: { key: Step; label: string }[] = steps.map((s) => ({
        key: s,
        label: s === "template" ? "Plantilla" : s === "parameters" ? "Parámetros" : "Confirmar",
    }));
    const currentStepIndex = steps.indexOf(step);

    return (
        <div className="flex flex-col h-full max-h-[70vh]">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1 mb-6">
                {stepMeta.map((s, index) => (
                    <div key={s.key} className="flex items-center">
                        <div
                            className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                                index < currentStepIndex && "bg-primary text-primary-foreground",
                                index === currentStepIndex && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                                index > currentStepIndex && "bg-muted text-muted-foreground"
                            )}
                        >
                            {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        {index < stepMeta.length - 1 && (
                            <div
                                className={cn(
                                    "w-8 h-0.5 mx-1",
                                    index < currentStepIndex ? "bg-primary" : "bg-muted"
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step label */}
            <div className="text-center mb-4">
                <h3 className="font-medium text-lg">
                    {step === "template" && "Elegí una plantilla de tarea"}
                    {step === "parameters" && "Definí los parámetros"}
                    {step === "confirm" && "Confirmá la tarea"}
                </h3>
                {step === "template" && selectedTemplate && (
                    <p className="text-sm text-muted-foreground mt-1">
                        Seleccionado: <strong>{selectedTemplate.name}</strong>
                    </p>
                )}
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {step === "template" && renderTemplateStep()}
                {step === "parameters" && renderParametersStep()}
                {step === "confirm" && renderConfirmStep()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={isLoading}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {step === "template" ? "Volver" : "Anterior"}
                </Button>

                {step === "confirm" ? (
                    <Button onClick={handleSubmit} disabled={isLoading || !canProceed()}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Crear Tarea
                            </>
                        )}
                    </Button>
                ) : (
                    <Button type="button" onClick={handleNext} disabled={!canProceed()}>
                        Siguiente
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
