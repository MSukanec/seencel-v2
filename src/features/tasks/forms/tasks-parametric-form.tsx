"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TaskAction, TaskElement, Unit, TaskParameter, TaskParameterOption } from "../types";
import { createTask } from "../actions";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface TasksParametricFormProps {
    elements: TaskElement[];
    units: Unit[];
    onCancel?: () => void;
    onSuccess?: () => void;
    onBack?: () => void;
}

// Parameter with nested options
interface ParameterWithOptions extends TaskParameter {
    options: TaskParameterOption[];
}

type Step = "element" | "action" | "parameters" | "confirm";

// ============================================================================
// Component
// ============================================================================

export function TasksParametricForm({
    elements,
    units,
    onCancel,
    onSuccess,
    onBack,
}: TasksParametricFormProps) {
    // State
    const [step, setStep] = useState<Step>("element");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingActions, setIsLoadingActions] = useState(false);
    const [isLoadingParameters, setIsLoadingParameters] = useState(false);

    // Selections
    const [selectedElementId, setSelectedElementId] = useState<string>("");
    const [selectedActionId, setSelectedActionId] = useState<string>("");
    const [elementSearch, setElementSearch] = useState("");

    // Parameter values: { parameter_slug: option_id }
    const [parameterValues, setParameterValues] = useState<Record<string, string>>({});

    // Dynamic data
    const [compatibleActions, setCompatibleActions] = useState<TaskAction[]>([]);
    const [elementParameters, setElementParameters] = useState<ParameterWithOptions[]>([]);
    const [duplicateTask, setDuplicateTask] = useState<any>(null);

    // Derived data
    const selectedElement = useMemo(() =>
        elements.find(e => e.id === selectedElementId),
        [elements, selectedElementId]
    );

    const selectedAction = useMemo(() =>
        compatibleActions.find(k => k.id === selectedActionId),
        [compatibleActions, selectedActionId]
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

    // Generated name: "Ejecución de Cielorraso de Durlock..."
    const generatedName = useMemo(() => {
        if (!selectedAction || !selectedElement) return "";

        let name = `${selectedAction.name} de ${selectedElement.name.toLowerCase()}`;

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
    }, [selectedAction, selectedElement, elementParameters, selectedOptions]);

    // Generated code: "EJE-MUR-LH-15"
    const generatedCode = useMemo(() => {
        if (!selectedAction || !selectedElement) return "";

        const actionCode = selectedAction.short_code || selectedAction.name?.substring(0, 3).toUpperCase() || "???";
        const elemCode = selectedElement.code || selectedElement.name.substring(0, 3).toUpperCase();

        let code = `${actionCode}-${elemCode}`;

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
    }, [selectedAction, selectedElement, elementParameters, selectedOptions]);

    // ========================================================================
    // Effects
    // ========================================================================

    // Load compatible actions when element changes
    useEffect(() => {
        if (!selectedElementId) {
            setCompatibleActions([]);
            return;
        }

        const loadActions = async () => {
            setIsLoadingActions(true);
            const supabase = createClient();

            const { data: actionLinks } = await supabase
                .schema('catalog').from('task_element_actions')
                .select('action_id')
                .eq('element_id', selectedElementId);

            if (actionLinks && actionLinks.length > 0) {
                const actionIds = actionLinks.map(l => l.action_id);
                const { data: actionsData } = await supabase
                    .schema('catalog').from('task_actions')
                    .select('*')
                    .in('id', actionIds)
                    .order('name', { ascending: true });

                setCompatibleActions(actionsData || []);
            } else {
                // If no links, show all actions
                const { data: allActions } = await supabase
                    .schema('catalog').from('task_actions')
                    .select('*')
                    .order('name', { ascending: true });

                setCompatibleActions(allActions || []);
            }

            setIsLoadingActions(false);
        };

        loadActions();
        setSelectedActionId("");
        setParameterValues({});
    }, [selectedElementId]);

    // Load parameters when element changes
    // NOTE: task_element_parameters was removed. Parameters now belong to
    // construction systems. For now, no params are loaded at element selection.
    // This will be updated when the parametric form is refactored to select
    // element → action → system → parameters.
    useEffect(() => {
        setElementParameters([]);
        setParameterValues({});
    }, [selectedElementId]);

    // Check for duplicates
    useEffect(() => {
        if (!selectedActionId || !selectedElementId) {
            setDuplicateTask(null);
            return;
        }

        if (elementParameters.length > 0 && !allRequiredParametersFilled) {
            setDuplicateTask(null);
            return;
        }

        const checkDuplicate = async () => {
            const supabase = createClient();

            if (!generatedCode) {
                setDuplicateTask(null);
                return;
            }

            const { data } = await supabase
                .schema('catalog').from('tasks')
                .select('id, name, code')
                .eq('code', generatedCode)
                .eq('is_deleted', false)
                .limit(1);

            setDuplicateTask(data && data.length > 0 ? data[0] : null);
        };

        checkDuplicate();
    }, [selectedActionId, selectedElementId, generatedCode, elementParameters.length, allRequiredParametersFilled]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleNext = () => {
        const stepsList: Step[] = elementParameters.length > 0
            ? ["element", "action", "parameters", "confirm"]
            : ["element", "action", "confirm"];
        const currentIndex = stepsList.indexOf(step);
        if (currentIndex < stepsList.length - 1) {
            setStep(stepsList[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        const stepsList: Step[] = elementParameters.length > 0
            ? ["element", "action", "parameters", "confirm"]
            : ["element", "action", "confirm"];
        const currentIndex = stepsList.indexOf(step);
        if (currentIndex > 0) {
            setStep(stepsList[currentIndex - 1]);
        } else if (onBack) {
            onBack();
        }
    };

    const canProceed = () => {
        switch (step) {
            case "element": return !!selectedElementId;
            case "action": return !!selectedActionId;
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
            formData.set("task_action_id", selectedActionId);
            formData.set("task_element_id", selectedElementId);
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

    const renderElementStep = () => {
        if (elements.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    No hay elementos disponibles
                </div>
            );
        }

        // Filter and sort alphabetically
        const filteredElements = elements
            .filter(e =>
                !elementSearch ||
                e.name.toLowerCase().includes(elementSearch.toLowerCase()) ||
                e.code?.toLowerCase().includes(elementSearch.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));

        return (
            <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar elemento..."
                        value={elementSearch}
                        onChange={(e) => setElementSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {filteredElements.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No se encontraron elementos con &quot;{elementSearch}&quot;
                    </div>
                ) : (
                    filteredElements.map((element) => (
                        <Card
                            key={element.id}
                            className={cn(
                                "p-4 cursor-pointer transition-all hover:border-primary",
                                selectedElementId === element.id && "border-primary bg-primary/5"
                            )}
                            onClick={() => setSelectedElementId(element.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                                    selectedElementId === element.id ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    {element.code || element.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{element.name}</div>
                                    {element.description && (
                                        <div className="text-sm text-muted-foreground">{element.description}</div>
                                    )}
                                </div>
                                {element.code && (
                                    <Badge variant="outline" className="font-mono text-xs">{element.code}</Badge>
                                )}
                                {selectedElementId === element.id && (
                                    <Check className="h-5 w-5 text-primary" />
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        );
    };

    const renderActionStep = () => {
        if (isLoadingActions) {
            return (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            );
        }

        if (compatibleActions.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    No hay acciones disponibles para este elemento
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {compatibleActions.map((action) => (
                    <Card
                        key={action.id}
                        className={cn(
                            "p-4 cursor-pointer transition-all hover:border-primary",
                            selectedActionId === action.id && "border-primary bg-primary/5"
                        )}
                        onClick={() => setSelectedActionId(action.id)}
                    >
                        <div className="flex items-center gap-3">
                            {action.short_code && (
                                <Badge variant="outline" className="font-mono">{action.short_code}</Badge>
                            )}
                            <div className="flex-1">
                                <div className="font-medium">{action.name}</div>
                                {action.description && (
                                    <div className="text-sm text-muted-foreground">{action.description}</div>
                                )}
                            </div>
                            {selectedActionId === action.id && (
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

                {/* Duplicate warning */}
                {duplicateTask && allRequiredParametersFilled && (
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
                            <span className="text-muted-foreground">Elemento:</span>
                            <span>{selectedElement?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Acción:</span>
                            <span>{selectedAction?.name}</span>
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

                {/* Duplicate warning in confirm */}
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
                    Esta tarea se creará como <strong>tarea de sistema</strong> y estará disponible para todas las organizaciones.
                </p>
            </div>
        );
    };

    // ========================================================================
    // Main Render
    // ========================================================================

    const hasParameters = elementParameters.length > 0;
    const steps: { key: Step; label: string }[] = hasParameters
        ? [
            { key: "element", label: "Elemento" },
            { key: "action", label: "Acción" },
            { key: "parameters", label: "Parámetros" },
            { key: "confirm", label: "Confirmar" },
        ]
        : [
            { key: "element", label: "Elemento" },
            { key: "action", label: "Acción" },
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

            {/* Step label */}
            <div className="text-center mb-4">
                <h3 className="font-medium text-lg">
                    {step === "element" && "¿Sobre qué elemento vas a trabajar?"}
                    {step === "action" && "¿Qué acción vas a realizar?"}
                    {step === "parameters" && "Definí los parámetros"}
                    {step === "confirm" && "Confirmá la tarea"}
                </h3>
                {step === "element" && selectedElement && (
                    <p className="text-sm text-muted-foreground mt-1">
                        Seleccionado: <strong>{selectedElement.name}</strong>
                    </p>
                )}
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {step === "element" && renderElementStep()}
                {step === "action" && renderActionStep()}
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
                    {step === "element" ? "Volver" : "Anterior"}
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
