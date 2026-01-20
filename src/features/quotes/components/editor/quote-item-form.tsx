"use client";

import { useState } from "react";
import { TaskView } from "@/features/tasks/types";
import { TaskCatalogCombobox } from "@/features/tasks/components/catalog/task-catalog-combobox";
import { FormFooter } from "@/components/shared/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createQuoteItem } from "../../actions";

interface QuoteItemFormProps {
    mode: "create" | "edit";
    quoteId: string;
    organizationId: string;
    projectId: string | null;
    currencyId: string;
    tasks: TaskView[];
    initialData?: any;
    onCancel?: () => void;
    onSuccess?: () => void;
}

export function QuoteItemForm({
    mode,
    quoteId,
    organizationId,
    projectId,
    currencyId,
    tasks,
    initialData,
    onCancel,
    onSuccess
}: QuoteItemFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string>(initialData?.task_id || "");

    // Find selected task to get default unit price if available
    const selectedTask = tasks.find(t => t.id === selectedTaskId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading("Agregando ítem...");

        try {
            const formData = new FormData(e.currentTarget);
            formData.append("quote_id", quoteId);
            formData.append("organization_id", organizationId);
            if (projectId) {
                formData.append("project_id", projectId);
            }
            formData.append("currency_id", currencyId);

            const result = await createQuoteItem(formData);

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success("¡Ítem agregado!", { id: toastId });
                onSuccess?.();
            }
        } catch (error: any) {
            console.error("Quote item form error:", error);
            toast.error("Error inesperado: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                    {/* Tarea: 12 cols - Combobox con búsqueda */}
                    <div className="md:col-span-12">
                        <FormGroup
                            label="Tarea del Catálogo"
                            htmlFor="task_id"
                            required
                            tooltip="Busca por nombre, código o rubro. Escribe para filtrar entre miles de tareas."
                        >
                            <TaskCatalogCombobox
                                name="task_id"
                                value={selectedTaskId}
                                onValueChange={(id) => setSelectedTaskId(id)}
                                tasks={tasks}
                                placeholder="Buscar tarea por nombre, código o rubro..."
                            />
                        </FormGroup>
                    </div>

                    {/* Descripción adicional: 12 cols */}
                    <div className="md:col-span-12">
                        <FormGroup label="Descripción adicional" htmlFor="description">
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Notas o especificaciones adicionales..."
                                defaultValue={initialData?.description || ""}
                                rows={2}
                            />
                        </FormGroup>
                    </div>

                    {/* Cantidad: 4 cols */}
                    <div className="md:col-span-4">
                        <FormGroup label="Cantidad" htmlFor="quantity" required>
                            <Input
                                id="quantity"
                                name="quantity"
                                type="number"
                                step="0.001"
                                min="0"
                                defaultValue={initialData?.quantity || 1}
                                required
                            />
                        </FormGroup>
                    </div>

                    {/* Precio unitario: 4 cols */}
                    <div className="md:col-span-4">
                        <FormGroup label="Precio Unitario" htmlFor="unit_price" required>
                            <Input
                                id="unit_price"
                                name="unit_price"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={initialData?.unit_price || 0}
                                required
                            />
                        </FormGroup>
                    </div>

                    {/* Markup: 4 cols */}
                    <div className="md:col-span-4">
                        <FormGroup label="Markup %" htmlFor="markup_pct">
                            <Input
                                id="markup_pct"
                                name="markup_pct"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                defaultValue={initialData?.markup_pct || 0}
                            />
                        </FormGroup>
                    </div>

                    {/* Cost Scope: 6 cols */}
                    <div className="md:col-span-6">
                        <FormGroup label="Alcance de Costo" htmlFor="cost_scope">
                            <Select name="cost_scope" defaultValue={initialData?.cost_scope || "materials_and_labor"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="materials_and_labor">Materiales + Mano de obra</SelectItem>
                                    <SelectItem value="materials_only">Sólo materiales</SelectItem>
                                    <SelectItem value="labor_only">Sólo mano de obra</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    </div>

                    {/* Impuesto del ítem: 6 cols */}
                    <div className="md:col-span-6">
                        <FormGroup label="Impuesto del ítem %" htmlFor="tax_pct">
                            <Input
                                id="tax_pct"
                                name="tax_pct"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                defaultValue={initialData?.tax_pct || 0}
                            />
                        </FormGroup>
                    </div>

                </div>
            </div>

            <FormFooter
                onCancel={onCancel}
                cancelLabel="Cancelar"
                submitLabel={isLoading ? "Agregando..." : "Agregar Ítem"}
                isLoading={isLoading}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
