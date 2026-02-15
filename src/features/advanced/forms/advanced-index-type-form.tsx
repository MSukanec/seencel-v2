"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { createIndexTypeAction, updateIndexTypeAction } from "@/features/advanced/actions";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { TextField, SelectField, NotesField } from "@/components/shared/forms/fields";
import { FormGroup } from "@/components/ui/form-group";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { EconomicIndexType, Periodicity } from "@/features/advanced/types";
import { PERIODICITY_LABELS, DEFAULT_ICC_COMPONENTS } from "@/features/advanced/types";

interface AdvancedIndexTypeFormProps {
    organizationId: string;
    initialData?: EconomicIndexType | null;
}

interface ComponentInput {
    id: string;
    key: string;
    name: string;
    is_main: boolean;
}

const PERIODICITY_OPTIONS = Object.entries(PERIODICITY_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export function AdvancedIndexTypeForm({
    organizationId,
    initialData,
}: AdvancedIndexTypeFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Callbacks internos (semi-autónomo)
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

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

            if (field === 'is_main' && value === true) {
                return { ...c, is_main: true };
            }

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
            if (field === 'is_main' && value === true && c.id !== id) {
                return { ...c, is_main: false };
            }
            return c;
        }));
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
            handleSuccess();
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
                <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <TextField
                            label="Nombre del Índice"
                            value={name}
                            onChange={setName}
                            placeholder="Ej: ICC, CAC, IPC..."
                            required
                            autoFocus
                        />

                        <TextField
                            label="Fuente"
                            value={source}
                            onChange={setSource}
                            placeholder="Ej: INDEC, CAC, Manual..."
                            required={false}
                        />
                    </div>

                    <NotesField
                        label="Descripción"
                        value={description}
                        onChange={setDescription}
                        placeholder="Descripción opcional del índice"
                        rows={2}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Periodicidad"
                            value={periodicity}
                            onChange={(v) => setPeriodicity(v as Periodicity)}
                            options={PERIODICITY_OPTIONS}
                            required
                        />

                        <FormGroup
                            label="Año Base"
                            required={false}
                            tooltip="Año de referencia del índice. Se usa para calcular variaciones desde el valor base original. Ej: El ICC usa base 2016 = 100."
                        >
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
                            <FormGroup
                                label="Componentes"
                                required={false}
                                tooltip="Los componentes representan las subdivisiones del índice. Cada componente tendrá su propio valor numérico por período. Ejemplo: el ICC tiene Nivel General, Materiales, Mano de Obra y Gastos Generales. El componente marcado como 'Principal' es el que se usa como referencia al ajustar presupuestos."
                            >
                                <div />
                            </FormGroup>

                            <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                                {components.map((comp) => (
                                    <div key={comp.id} className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
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
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 mt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleAddComponent}
                                        className="flex-1"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar componente
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setComponents(DEFAULT_ICC_COMPONENTS.map(c => ({
                                                id: crypto.randomUUID(),
                                                ...c,
                                            })));
                                        }}
                                    >
                                        Usar Plantilla
                                    </Button>
                                </div>
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
                onCancel={handleCancel}
            />
        </form>
    );
}
