"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle } from "lucide-react";
import { TaskKind, TaskElement, TaskDivision, Unit, TaskParameter, TaskParameterOption } from "../../types";
import { createTask } from "../../actions";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ParametricTaskFormProps {
    divisions: TaskDivision[];
    units: Unit[];
    kinds: TaskKind[];
    onCancel?: () => void;
    onSuccess?: () => void;
    onBack?: () => void;
}

// Parameter with nested options
interface ParameterWithOptions extends TaskParameter {
    options: TaskParameterOption[];
}

type Step = "division" | "kind" | "element" | "parameters" | "confirm";

// ============================================================================
// Component
// ============================================================================

export function ParametricTaskForm({
    divisions,
    units,
    kinds,
    onCancel,
    onSuccess,
    onBack,
}: ParametricTaskFormProps) {
    // State
    const [step, setStep] = useState<Step>("division");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingElements, setIsLoadingElements] = useState(false);
    const [isLoadingParameters, setIsLoadingParameters] = useState(false);

    // Selections
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>("");
    const [selectedKindId, setSelectedKindId] = useState<string>("");
    const [selectedElementId, setSelectedElementId] = useState<string>("");

    // Parameter values: { parameter_slug: option_id }
    const [parameterValues, setParameterValues] = useState<Record<string, string>>({});

    // Dynamic data
    const [compatibleKinds, setCompatibleKinds] = useState<TaskKind[]>([]);
    const [isLoadingKinds, setIsLoadingKinds] = useState(false);
    const [compatibleElements, setCompatibleElements] = useState<TaskElement[]>([]);
    const [elementParameters, setElementParameters] = useState<ParameterWithOptions[]>([]);
    const [duplicateTask, setDuplicateTask] = useState<any>(null);

    // Derived data
    const selectedKind = useMemo(() =>
        compatibleKinds.find(k => k.id === selectedKindId) || kinds.find(k => k.id === selectedKindId),
        [compatibleKinds, kinds, selectedKindId]
    );

    const selectedElement = useMemo(() =>
        compatibleElements.find(e => e.id === selectedElementId),
        [compatibleElements, selectedElementId]
    );

    const selectedDivision = useMemo(() =>
        divisions.find(d => d.id === selectedDivisionId),
        [divisions, selectedDivisionId]
    );

    // Get selected option objects for each parameter
    const selectedOptions = useMemo(() => {
        const result: Record<string, TaskParameterOption | undefined> = {};
        elementParameters.forEach(param => {
            const selectedOptionId = parameterValues[param.slug];
            if (selectedOptionId) {
                result[param.slug] = param.options.find(o => o.id === selectedOptionId);
            }
        });
        return result;
    }, [elementParameters, parameterValues]);

    // Check if all required parameters are filled
    const allRequiredParametersFilled = useMemo(() => {
        return elementParameters
            .filter(p => p.is_required)
            .every(p => parameterValues[p.slug]);
    }, [elementParameters, parameterValues]);

    // Generated name with parameters
    const generatedName = useMemo(() => {
        if (!selectedKind || !selectedElement) return "";

        let name = `${selectedKind.name} de ${selectedElement.name.toLowerCase()}`;

        // Add parameter labels to name
        const paramParts: string[] = [];
        elementParameters.forEach(param => {
            const option = selectedOptions[param.slug];
            if (option) {
                paramParts.push(option.label.toLowerCase());
            }
        });

        if (paramParts.length > 0) {
            name += ` de ${paramParts.join(" de ")}`;
        }

        return name;
    }, [selectedKind, selectedElement, elementParameters, selectedOptions]);

    // Generated code with parameters
    const generatedCode = useMemo(() => {
        if (!selectedKind || !selectedDivision) return "";

        const kindCode = selectedKind.short_code || selectedKind.code?.substring(0, 3).toUpperCase() || "???";
        const divCode = (selectedDivision as any).code || selectedDivision.name.substring(0, 3).toUpperCase();
        const elemCode = selectedElement?.code || selectedElement?.name.substring(0, 3).toUpperCase() || "";

        let code = elemCode ? `${kindCode}-${divCode}-${elemCode}` : `${kindCode}-${divCode}`;

        // Add parameter codes
        const paramCodes: string[] = [];
        elementParameters.forEach(param => {
            const option = selectedOptions[param.slug];
            if (option?.short_code) {
                paramCodes.push(option.short_code);
            }
        });

        if (paramCodes.length > 0) {
            code += `-${paramCodes.join("-")}`;
        }

        return code;
    }, [selectedKind, selectedDivision, selectedElement, elementParameters, selectedOptions]);

    // ========================================================================
    // Effects
    // ========================================================================

    // Load compatible kinds when division changes
    useEffect(() => {
        if (!selectedDivisionId) {
            setCompatibleKinds([]);
            return;
        }

        const loadKinds = async () => {
            setIsLoadingKinds(true);
            const supabase = createClient();

            const { data: kindLinks } = await supabase
                .from('task_division_kinds')
                .select('kind_id')
                .eq('division_id', selectedDivisionId);

            if (kindLinks && kindLinks.length > 0) {
                const kindIds = kindLinks.map(l => l.kind_id);
                const filteredKinds = kinds.filter(k => kindIds.includes(k.id));
                setCompatibleKinds(filteredKinds.length > 0 ? filteredKinds : kinds);
            } else {
                setCompatibleKinds(kinds);
            }

            setIsLoadingKinds(false);
        };

        loadKinds();
        setSelectedKindId("");
        setSelectedElementId("");
        setParameterValues({});
    }, [selectedDivisionId, kinds]);

    // Load compatible elements when kind changes
    useEffect(() => {
        if (!selectedKindId || !selectedDivisionId) {
            setCompatibleElements([]);
            return;
        }

        const loadElements = async () => {
            setIsLoadingElements(true);
            const supabase = createClient();

            // Get elements compatible with selected kind
            const { data: kindLinks } = await supabase
                .from('task_kind_elements')
                .select('element_id')
                .eq('kind_id', selectedKindId);

            // Get elements compatible with selected division
            const { data: divLinks } = await supabase
                .from('task_division_elements')
                .select('element_id')
                .eq('division_id', selectedDivisionId);

            // Intersect both sets
            let elementIds: string[] = [];
            if (kindLinks && divLinks) {
                const kindElementIds = new Set(kindLinks.map(l => l.element_id));
                const divElementIds = new Set(divLinks.map(l => l.element_id));
                elementIds = [...kindElementIds].filter(id => divElementIds.has(id));
            } else if (kindLinks) {
                elementIds = kindLinks.map(l => l.element_id);
            }

            if (elementIds.length > 0) {
                const { data: elements } = await supabase
                    .from('task_elements')
                    .select('*')
                    .in('id', elementIds)
                    .eq('is_deleted', false)
                    .order('order', { ascending: true });

                setCompatibleElements(elements || []);
            } else {
                setCompatibleElements([]);
            }

            setIsLoadingElements(false);
        };

        loadElements();
        setSelectedElementId("");
        setParameterValues({});
    }, [selectedKindId, selectedDivisionId]);

    // Load parameters when element changes
    useEffect(() => {
        if (!selectedElementId) {
            setElementParameters([]);
            return;
        }

        const loadParameters = async () => {
            setIsLoadingParameters(true);
            const supabase = createClient();

            // Get parameter links for this element
            const { data: links } = await supabase
                .from('task_element_parameters')
                .select('parameter_id, order, is_required')
                .eq('element_id', selectedElementId)
                .order('order', { ascending: true });

            if (!links || links.length === 0) {
                setElementParameters([]);
                setIsLoadingParameters(false);
                return;
            }

            // Get parameters
            const paramIds = links.map(l => l.parameter_id);
            const { data: params } = await supabase
                .from('task_parameters')
                .select('*')
                .in('id', paramIds)
                .eq('is_deleted', false);

            // Get options for all parameters
            const { data: options } = await supabase
                .from('task_parameter_options')
                .select('*')
                .in('parameter_id', paramIds)
                .eq('is_deleted', false)
                .order('order', { ascending: true });

            // Build result
            const result: ParameterWithOptions[] = (params || []).map(param => {
                const link = links.find(l => l.parameter_id === param.id);
                const paramOptions = (options || []).filter(o => o.parameter_id === param.id);
                return {
                    ...param,
                    order: link?.order ?? param.order,
                    is_required: link?.is_required ?? param.is_required,
                    options: paramOptions
                };
            }).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

            setElementParameters(result);
            setIsLoadingParameters(false);
        };

        loadParameters();
        setParameterValues({});
    }, [selectedElementId]);

    // Check for duplicates - only after parameters are filled (or if element has no parameters)
    useEffect(() => {
        // Don't check until we have the basic selection
        if (!selectedKindId || !selectedElementId || !selectedDivisionId) {
            setDuplicateTask(null);
            return;
        }

        // If element has parameters, wait until all required ones are filled
        if (elementParameters.length > 0 && !allRequiredParametersFilled) {
            setDuplicateTask(null);
            return;
        }

        const checkDuplicate = async () => {
            const supabase = createClient();

            // Check by generated code - this includes all parameter codes
            // so "EJE-MAP-MUR-LH-15" won't match "EJE-MAP-MUR-LC-20"
            if (!generatedCode) {
                setDuplicateTask(null);
                return;
            }

            const { data } = await supabase
                .from('tasks')
                .select('id, name, code')
                .eq('code', generatedCode)
                .eq('is_deleted', false)
                .limit(1);

            setDuplicateTask(data && data.length > 0 ? data[0] : null);
        };

        checkDuplicate();
    }, [selectedKindId, selectedElementId, selectedDivisionId, generatedCode, elementParameters.length, allRequiredParametersFilled]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleNext = () => {
        const steps: Step[] = elementParameters.length > 0
            ? ["division", "kind", "element", "parameters", "confirm"]
            : ["division", "kind", "element", "confirm"];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        const steps: Step[] = elementParameters.length > 0
            ? ["division", "kind", "element", "parameters", "confirm"]
            : ["division", "kind", "element", "confirm"];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        } else if (onBack) {
            onBack();
        }
    };

    const canProceed = () => {
        switch (step) {
            case "division": return !!selectedDivisionId;
            case "kind": return !!selectedKindId;
            case "element": return !!selectedElementId; // No duplicate check here - wait for parameters
            case "parameters": return allRequiredParametersFilled && !duplicateTask;
            case "confirm": return !duplicateTask;
            default: return false;
        }
    };

    const handleSubmit = async () => {
        if (duplicateTask) {
            toast.error("Esta tarea ya existe en el sistema");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Creando tarea paramétrica...");

        try {
            // Get element's default unit
            const unitId = (selectedElement as any)?.default_unit_id;
            if (!unitId) {
                toast.error("El elemento no tiene unidad definida", { id: toastId });
                setIsLoading(false);
                return;
            }

            // Build parameter_values for storage
            const savedParamValues: Record<string, string> = {};
            elementParameters.forEach(param => {
                const optionId = parameterValues[param.slug];
                if (optionId) {
                    const option = param.options.find(o => o.id === optionId);
                    savedParamValues[param.slug] = option?.name || optionId;
                }
            });

            const formData = new FormData();
            formData.set("name", generatedName);
            formData.set("is_system", "true");
            formData.set("is_parametric", "true");
            formData.set("task_kind_id", selectedKindId);
            formData.set("task_element_id", selectedElementId);
            formData.set("task_division_id", selectedDivisionId);
            formData.set("unit_id", unitId);
            formData.set("code", generatedCode);
            formData.set("parameter_values", JSON.stringify(savedParamValues));
            formData.set("is_published", "true");

            const result = await createTask(formData);

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success("¡Tarea paramétrica creada!", { id: toastId });
                onSuccess?.();
            }
        } catch (error: any) {
            console.error("Error creating parametric task:", error);
            toast.error("Error inesperado: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render Steps
    // ========================================================================

    const renderDivisionStep = () => (
        <div className="space-y-3">
            {divisions.map((division) => (
                <Card
                    key={division.id}
                    className={cn(
                        "p-4 cursor-pointer transition-all hover:border-primary",
                        selectedDivisionId === division.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedDivisionId(division.id)}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                            selectedDivisionId === division.id ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                            {division.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="font-medium">{division.name}</div>
                            {division.description && (
                                <div className="text-sm text-muted-foreground">{division.description}</div>
                            )}
                        </div>
                        {selectedDivisionId === division.id && (
                            <Check className="h-5 w-5 text-primary" />
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );

    const renderKindStep = () => {
        const kindsToShow = compatibleKinds.length > 0 ? compatibleKinds : kinds;

        if (isLoadingKinds) {
            return (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {kindsToShow.map((kind) => (
                    <Card
                        key={kind.id}
                        className={cn(
                            "p-4 cursor-pointer transition-all hover:border-primary",
                            selectedKindId === kind.id && "border-primary bg-primary/5"
                        )}
                        onClick={() => setSelectedKindId(kind.id)}
                    >
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">{kind.short_code || kind.code}</Badge>
                            <div className="flex-1">
                                <div className="font-medium">{kind.name}</div>
                            </div>
                            {selectedKindId === kind.id && (
                                <Check className="h-5 w-5 text-primary" />
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    const renderElementStep = () => {
        if (isLoadingElements) {
            return (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            );
        }

        if (compatibleElements.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    No hay elementos disponibles para esta combinación
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {compatibleElements.map((element) => (
                    <Card
                        key={element.id}
                        className={cn(
                            "p-4 cursor-pointer transition-all hover:border-primary",
                            selectedElementId === element.id && "border-primary bg-primary/5"
                        )}
                        onClick={() => setSelectedElementId(element.id)}
                    >
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">{element.code || "---"}</Badge>
                            <div className="flex-1">
                                <div className="font-medium">{element.name}</div>
                            </div>
                            {selectedElementId === element.id && (
                                <Check className="h-5 w-5 text-primary" />
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    const renderParametersStep = () => {
        if (isLoadingParameters) {
            return (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            );
        }

        if (elementParameters.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    Este elemento no tiene parámetros configurados
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {elementParameters.map((param) => (
                    <FormGroup
                        key={param.id}
                        label={param.label}
                        required={param.is_required}
                        helpText={param.description || undefined}
                    >
                        <Select
                            value={parameterValues[param.slug] || ""}
                            onValueChange={(value) => setParameterValues(prev => ({
                                ...prev,
                                [param.slug]: value
                            }))}
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

                {/* Duplicate warning - only shows after all parameters are filled */}
                {duplicateTask && allRequiredParametersFilled && (
                    <Card className="p-4 border-amber-500 bg-amber-500/10 mt-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium text-amber-600">Esta combinación ya existe</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Ya existe la tarea "{duplicateTask.name}" con código {duplicateTask.code}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        );
    };

    const renderConfirmStep = () => {
        const elementUnitId = (selectedElement as any)?.default_unit_id;
        const unitName = units.find(u => u.id === elementUnitId)?.name || "Sin unidad";

        return (
            <div className="space-y-4">
                <Card className="p-4 bg-muted/50">
                    <h3 className="font-semibold mb-3">Resumen de la tarea</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nombre:</span>
                            <span className="font-medium text-right max-w-[60%]">{generatedName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Código:</span>
                            <Badge variant="outline" className="font-mono">{generatedCode}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Rubro:</span>
                            <span>{selectedDivision?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span>{selectedKind?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Elemento:</span>
                            <span>{selectedElement?.name}</span>
                        </div>
                        {elementParameters.length > 0 && (
                            <>
                                <hr className="my-2" />
                                {elementParameters.map(param => {
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

                <p className="text-sm text-muted-foreground text-center">
                    Esta tarea se creará como <strong>tarea de sistema</strong> y estará disponible para todas las organizaciones.
                </p>
            </div>
        );
    };

    // ========================================================================
    // Main Render
    // ========================================================================

    // Dynamic steps based on whether element has parameters
    const hasParameters = elementParameters.length > 0;
    const steps: { key: Step; label: string }[] = hasParameters
        ? [
            { key: "division", label: "Rubro" },
            { key: "kind", label: "Tipo" },
            { key: "element", label: "Elemento" },
            { key: "parameters", label: "Parámetros" },
            { key: "confirm", label: "Confirmar" },
        ]
        : [
            { key: "division", label: "Rubro" },
            { key: "kind", label: "Tipo" },
            { key: "element", label: "Elemento" },
            { key: "confirm", label: "Confirmar" },
        ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="flex flex-col h-full max-h-[70vh]">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1 mb-6">
                {steps.map((s, index) => (
                    <div key={s.key} className="flex items-center">
                        <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                            index < currentStepIndex && "bg-primary text-primary-foreground",
                            index === currentStepIndex && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                            index > currentStepIndex && "bg-muted text-muted-foreground"
                        )}>
                            {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        {index < steps.length - 1 && (
                            <div className={cn(
                                "w-8 h-0.5 mx-1",
                                index < currentStepIndex ? "bg-primary" : "bg-muted"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {step === "division" && renderDivisionStep()}
                {step === "kind" && renderKindStep()}
                {step === "element" && renderElementStep()}
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
                    {step === "division" ? "Volver" : "Anterior"}
                </Button>

                {step === "confirm" ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !canProceed()}
                    >
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
                    <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceed()}
                    >
                        Siguiente
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
