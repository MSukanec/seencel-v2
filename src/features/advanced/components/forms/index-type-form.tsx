"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createIndexTypeAction, updateIndexTypeAction } from "@/features/advanced/actions";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { EconomicIndexType, Periodicity } from "@/features/advanced/types";
import { PERIODICITY_LABELS, DEFAULT_ICC_COMPONENTS } from "@/features/advanced/types";

interface IndexTypeFormProps {
    organizationId: string;
    initialData?: EconomicIndexType | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface ComponentInput {
    id: string;
    key: string;
    name: string;
    is_main: boolean;
}

export function IndexTypeForm({
    organizationId,
    initialData,
    onSuccess,
    onCancel,
}: IndexTypeFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [periodicity, setPeriodicity] = useState<Periodicity>(initialData?.periodicity || "monthly");
    const [source, setSource] = useState(initialData?.source || "");
    const [baseYear, setBaseYear] = useState(initialData?.base_year?.toString() || "");

    // Components state
    const [components, setComponents] = useState<ComponentInput[]>(() => {
        if (initialData?.components && initialData.components.length > 0) {
            return initialData.components.map(c => ({
                id: c.id,
                key: c.key,
                name: c.name,
                is_main: c.is_main,
            }));
        }
        // Default: start with a "General" main component
        return [{ id: crypto.randomUUID(), key: 'general', name: 'Nivel General', is_main: true }];
    });

    const handleAddComponent = () => {
        const newKey = `component_${components.length + 1}`;
        setComponents([...components, {
            id: crypto.randomUUID(),
            key: newKey,
            name: '',
            is_main: false,
        }]);
    };

    const handleRemoveComponent = (id: string) => {
        if (components.length <= 1) {
            toast.error("Debe haber al menos un componente");
            return;
        }
        const comp = components.find(c => c.id === id);
        if (comp?.is_main) {
            toast.error("No se puede eliminar el componente principal");
            return;
        }
        setComponents(components.filter(c => c.id !== id));
    };

    const handleComponentChange = (id: string, field: keyof ComponentInput, value: string | boolean) => {
        setComponents(components.map(c => {
            if (c.id !== id) return c;

            // If setting is_main to true, unset others
            if (field === 'is_main' && value === true) {
                return { ...c, is_main: true };
            }

            // If changing name, also update key
            if (field === 'name') {
                const key = (value as string)
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');
                return { ...c, name: value as string, key: key || c.key };
            }

            return { ...c, [field]: value };
        }).map(c => {
            // Ensure only one is_main
            if (field === 'is_main' && value === true && c.id !== id) {
                return { ...c, is_main: false };
            }
            return c;
        }));
    };

    const handleUseTemplate = (template: 'icc' | 'empty') => {
        if (template === 'icc') {
            setComponents(DEFAULT_ICC_COMPONENTS.map(c => ({
                id: crypto.randomUUID(),
                ...c,
            })));
        } else {
            setComponents([{ id: crypto.randomUUID(), key: 'general', name: 'Nivel General', is_main: true }]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }

        if (components.length === 0) {
            toast.error("Debe haber al menos un componente");
            return;
        }

        if (!components.some(c => c.is_main)) {
            toast.error("Debe haber un componente principal");
            return;
        }

        if (components.some(c => !c.name.trim())) {
            toast.error("Todos los componentes deben tener nombre");
            return;
        }

        setIsLoading(true);
        try {
            if (isEditing && initialData) {
                // For edit, we only update the type metadata (not components)
                await updateIndexTypeAction(initialData.id, {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    periodicity,
                    source: source.trim() || undefined,
                    base_year: baseYear ? parseInt(baseYear) : undefined,
                });
                toast.success("Índice actualizado");
            } else {
                await createIndexTypeAction({
                    organization_id: organizationId,
                    name: name.trim(),
                    description: description.trim() || undefined,
                    periodicity,
                    source: source.trim() || undefined,
                    base_year: baseYear ? parseInt(baseYear) : undefined,
                    components: components.map((c, index) => ({
                        key: c.key,
                        name: c.name,
                        is_main: c.is_main,
                        sort_order: index,
                    })),
                });
                toast.success("Índice creado");
            }
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormGroup label="Nombre del Índice" required>
                            <Input
                                placeholder="Ej: ICC, CAC, IPC..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </FormGroup>

                        <FormGroup label="Fuente">
                            <Input
                                placeholder="Ej: INDEC, CAC, Manual..."
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                            />
                        </FormGroup>
                    </div>

                    <FormGroup label="Descripción">
                        <Input
                            placeholder="Descripción opcional del índice"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </FormGroup>

                    <div className="grid grid-cols-2 gap-4">
                        <FormGroup label="Periodicidad">
                            <Select value={periodicity} onValueChange={(v) => setPeriodicity(v as Periodicity)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PERIODICITY_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormGroup>

                        <FormGroup label="Año Base" helpText="Opcional - año de referencia del índice">
                            <Input
                                type="number"
                                placeholder="Ej: 2016"
                                value={baseYear}
                                onChange={(e) => setBaseYear(e.target.value)}
                            />
                        </FormGroup>
                    </div>

                    {/* Components */}
                    {!isEditing && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium">Componentes</div>
                                    <div className="text-xs text-muted-foreground">Define qué valores medirá este índice</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleUseTemplate('icc')}>
                                        Usar plantilla ICC
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                                {components.map((comp, index) => (
                                    <div key={comp.id} className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Nombre del componente"
                                            value={comp.name}
                                            onChange={(e) => handleComponentChange(comp.id, 'name', e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant={comp.is_main ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleComponentChange(comp.id, 'is_main', true)}
                                            className="whitespace-nowrap"
                                        >
                                            {comp.is_main ? "Principal ✓" : "Hacer principal"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveComponent(comp.id)}
                                            disabled={comp.is_main}
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAddComponent}
                                    className="w-full mt-2"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar componente
                                </Button>
                            </div>
                        </div>
                    )}

                    {isEditing && (
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                Los componentes no se pueden editar una vez creado el índice para mantener la integridad de los datos.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Índice"}
                onCancel={onCancel}
            />
        </form>
    );
}
