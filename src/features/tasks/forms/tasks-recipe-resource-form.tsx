"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { SelectField, type SelectOption } from "@/components/shared/forms/fields/select-field";
import {
    AmountField,
    CurrencyField,
    NotesField,
    ContactField,
    SwitchField,
} from "@/components/shared/forms/fields";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import {
    addRecipeMaterial,
    addRecipeLabor,
    addRecipeExternalService,
    updateRecipeMaterial,
    updateRecipeLabor,
    updateRecipeExternalService,
    removeAllRecipeMaterials,
    removeAllRecipeLabor,
} from "@/features/tasks/actions";

// ============================================================================
// Types
// ============================================================================

type ResourceType = "material" | "labor" | "external_service";

interface CatalogMaterialOption {
    id: string;
    name: string;
    code?: string | null;
    unit_id?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
}

interface LaborTypeOption {
    id: string;
    name: string;
    unit_id?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
    category_name?: string | null;
    level_name?: string | null;
    role_name?: string | null;
}

interface CurrencyOption {
    id: string;
    code: string;
    symbol: string;
    name: string;
}

interface ContactOption {
    id: string;
    full_name: string;
    company_name?: string | null;
}

/** Data for editing an existing resource */
export interface EditResourceData {
    /** The recipe resource row ID (task_recipe_materials.id, task_recipe_labor.id, etc.) */
    itemId: string;
    /** Type of resource being edited */
    resourceType: ResourceType;
    /** The selected concept ID (material_id, labor_type_id) — not applicable for external_service */
    selectedId?: string;
    /** Current quantity */
    quantity: number;
    /** Current notes */
    notes?: string | null;
    /** Waste percentage (materials only) */
    wastePercentage?: number | null;
    /** External service specific */
    serviceName?: string;
    unitPrice?: number;
    currencyId?: string;
    contactId?: string | null;
    includesMaterials?: boolean;
}

interface TasksRecipeResourceFormProps {
    recipeId: string;
    /** Catalog materials for combobox */
    materials: CatalogMaterialOption[];
    /** Catalog labor types for combobox */
    laborTypes: LaborTypeOption[];
    /** Available currencies for external services */
    currencies?: CurrencyOption[];
    /** Available contacts for external services */
    contacts?: ContactOption[];
    /** Pre-selected resource type (optional) */
    defaultResourceType?: ResourceType;
    /** Number of existing labor items in this recipe (for conflict detection) */
    existingLaborCount?: number;
    /** Number of existing material items in this recipe (for conflict detection) */
    existingMaterialsCount?: number;
    /** Edit mode: pre-filled data with concept locked */
    editData?: EditResourceData;
}

// ============================================================================
// Resource Type Options
// ============================================================================

const RESOURCE_TYPE_OPTIONS: SelectOption[] = [
    { value: "material", label: "Material" },
    { value: "labor", label: "Mano de Obra" },
    { value: "external_service", label: "Servicio Subcontratado" },
];

const RESOURCE_TYPE_DESCRIPTIONS: Record<string, string> = {
    material: "Productos físicos e insumos del catálogo",
    labor: "Trabajo humano por oficio o especialidad",
    external_service: "Trabajo tercerizado con precio propio",
};

// ============================================================================
// Conflict types
// ============================================================================

interface ConflictState {
    hasLaborConflict: boolean;
    hasMaterialsConflict: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function TasksRecipeResourceForm({
    recipeId,
    materials,
    laborTypes,
    currencies = [],
    contacts = [],
    defaultResourceType = "material",
    existingLaborCount = 0,
    existingMaterialsCount = 0,
    editData,
}: TasksRecipeResourceFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = !!editData;

    // State — shared (initialized from editData when editing)
    const [resourceType, setResourceType] = useState<ResourceType>(
        editData?.resourceType || defaultResourceType
    );
    const [selectedId, setSelectedId] = useState(editData?.selectedId || "");
    const [quantity, setQuantity] = useState<string>(
        editData ? String(editData.quantity) : "1"
    );
    const [notes, setNotes] = useState(editData?.notes || "");

    // State — external service specific
    const [serviceName, setServiceName] = useState(editData?.serviceName || "");
    const [unitPrice, setUnitPrice] = useState<string>(
        editData?.unitPrice != null ? String(editData.unitPrice) : ""
    );
    const [currencyId, setCurrencyId] = useState(editData?.currencyId || currencies[0]?.id || "");
    const [contactId, setContactId] = useState(editData?.contactId || "");
    const [includesMaterials, setIncludesMaterials] = useState(editData?.includesMaterials ?? false);

    // State — conflict dialog
    const [conflictOpen, setConflictOpen] = useState(false);
    const [conflict, setConflict] = useState<ConflictState>({
        hasLaborConflict: false,
        hasMaterialsConflict: false,
    });
    const [removeLabor, setRemoveLabor] = useState(true);
    const [removeMaterials, setRemoveMaterials] = useState(true);

    // Reset state when resource type changes (only in create mode)
    const handleResourceTypeChange = (value: ResourceType) => {
        if (isEditMode) return; // Blocked in edit mode
        setResourceType(value);
        setSelectedId("");
        setServiceName("");
        setUnitPrice("");
        setContactId("");
        setIncludesMaterials(false);
    };

    // ========================================================================
    // Derived data
    // ========================================================================

    const selectedMaterial = useMemo(
        () => (resourceType === "material" ? materials.find((m) => m.id === selectedId) : null),
        [materials, selectedId, resourceType]
    );

    const selectedLaborType = useMemo(
        () => (resourceType === "labor" ? laborTypes.find((lt) => lt.id === selectedId) : null),
        [laborTypes, selectedId, resourceType]
    );

    const unitDisplay =
        resourceType === "material"
            ? selectedMaterial?.unit_symbol || selectedMaterial?.unit_name || ""
            : resourceType === "labor"
                ? selectedLaborType?.unit_symbol || selectedLaborType?.unit_name || ""
                : "";

    // Combobox options — memoized per type
    const materialOptions = useMemo(
        () => materials.map((m) => ({
            value: m.id,
            label: m.name,
            searchTerms: [m.code, m.unit_symbol].filter(Boolean).join(" ") || undefined,
            content: (
                <span className="flex items-center gap-1.5">
                    <span>{m.name}</span>
                    {m.unit_symbol && (
                        <span className="text-[11px] text-muted-foreground">{m.unit_symbol}</span>
                    )}
                </span>
            ),
        })),
        [materials]
    );

    const laborOptions = useMemo(
        () => laborTypes.map((lt) => ({
            value: lt.id,
            label: lt.name,
            searchTerms: [lt.category_name, lt.level_name, lt.role_name, lt.unit_symbol]
                .filter(Boolean)
                .join(" "),
            content: (
                <span className="flex items-center gap-1.5">
                    <span>{lt.name}</span>
                    {lt.unit_symbol && (
                        <span className="text-[11px] text-muted-foreground">{lt.unit_symbol}</span>
                    )}
                </span>
            ),
        })),
        [laborTypes]
    );

    // Transform contacts to ContactField format { id, name }
    const contactFieldData = useMemo(
        () => contacts.map((c) => ({
            id: c.id,
            name: c.full_name,
            company_name: c.company_name,
        })),
        [contacts]
    );

    const comboboxOptions = resourceType === "material"
        ? materialOptions
        : laborOptions;

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    /**
     * Core submit logic — adds the external service and optionally removes
     * conflicting resources based on user choices.
     */
    const executeExternalServiceSubmit = useCallback(async (
        shouldRemoveLabor: boolean,
        shouldRemoveMaterials: boolean,
    ) => {
        setIsLoading(true);
        try {
            // 1. Add the external service
            const result = await addRecipeExternalService({
                recipe_id: recipeId,
                name: serviceName.trim(),
                unit_price: parseFloat(unitPrice) || 0,
                currency_id: currencyId,
                contact_id: contactId || null,
                includes_materials: includesMaterials,
                notes: notes.trim() || null,
            });

            if (!result.success) {
                toast.error(result.error || "Error al agregar servicio subcontratado");
                return;
            }

            // 2. Remove conflicting resources if user chose to
            const cleanupPromises: Promise<unknown>[] = [];
            if (shouldRemoveLabor) {
                cleanupPromises.push(removeAllRecipeLabor(recipeId));
            }
            if (shouldRemoveMaterials) {
                cleanupPromises.push(removeAllRecipeMaterials(recipeId));
            }

            if (cleanupPromises.length > 0) {
                await Promise.all(cleanupPromises);
            }

            // 3. Build success message
            const removedParts: string[] = [];
            if (shouldRemoveLabor) removedParts.push("mano de obra");
            if (shouldRemoveMaterials) removedParts.push("materiales");

            if (removedParts.length > 0) {
                toast.success("Servicio subcontratado agregado", {
                    description: `Se eliminaron ${removedParts.join(" y ")} existentes.`,
                });
            } else {
                toast.success("Servicio subcontratado agregado a la receta");
            }

            handleSuccess();
        } catch {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recipeId, serviceName, unitPrice, currencyId, contactId, includesMaterials, notes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedQuantity = parseFloat(quantity);

        // Validación por tipo
        if (resourceType === "material" && !selectedId) {
            toast.error("Seleccioná un material del catálogo");
            return;
        }
        if (resourceType === "labor" && !selectedId) {
            toast.error("Seleccioná un tipo de mano de obra");
            return;
        }
        if (resourceType === "external_service") {
            if (!serviceName.trim()) {
                toast.error("El nombre del servicio es obligatorio");
                return;
            }
            if (!currencyId) {
                toast.error("Seleccioná una moneda");
                return;
            }
        }

        if (resourceType !== "external_service" && (!parsedQuantity || parsedQuantity <= 0)) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        // ── External service: edit mode — direct update ──
        if (resourceType === "external_service" && isEditMode && editData) {
            setIsLoading(true);
            try {
                const result = await updateRecipeExternalService(editData.itemId, {
                    name: serviceName.trim(),
                    unit_price: parseFloat(unitPrice) || 0,
                    currency_id: currencyId,
                    contact_id: contactId || null,
                    includes_materials: includesMaterials,
                    notes: notes.trim() || null,
                });
                if (result.success) {
                    toast.success("Servicio externo actualizado");
                    handleSuccess();
                } else {
                    toast.error(result.error || "Error al actualizar servicio externo");
                }
            } catch {
                toast.error("Error inesperado");
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // ── External service: create mode — check for conflicts ──
        if (resourceType === "external_service") {
            const hasLaborConflict = existingLaborCount > 0;
            const hasMaterialsConflict = includesMaterials && existingMaterialsCount > 0;

            if (hasLaborConflict || hasMaterialsConflict) {
                // Show conflict dialog — user decides what to do
                setConflict({ hasLaborConflict, hasMaterialsConflict });
                setRemoveLabor(hasLaborConflict); // default: replace
                setRemoveMaterials(hasMaterialsConflict); // default: remove duplicates
                setConflictOpen(true);
                return;
            }

            // No conflicts — submit directly
            await executeExternalServiceSubmit(false, false);
            return;
        }

        // ── Material / Labor ──
        setIsLoading(true);
        try {
            if (resourceType === "material") {
                if (isEditMode && editData) {
                    // Edit mode: update only quantity and notes
                    const result = await updateRecipeMaterial(editData.itemId, {
                        quantity: parsedQuantity,
                        notes: notes.trim() || null,
                    });
                    if (result.success) {
                        toast.success("Material actualizado");
                        handleSuccess();
                    } else {
                        toast.error(result.error || "Error al actualizar material");
                    }
                } else {
                    const result = await addRecipeMaterial({
                        recipe_id: recipeId,
                        material_id: selectedId,
                        quantity: parsedQuantity,
                        waste_percentage: 0,
                        unit_id: selectedMaterial?.unit_id || null,
                        notes: notes.trim() || null,
                    });
                    if (result.success) {
                        toast.success("Material agregado a la receta");
                        handleSuccess();
                    } else {
                        toast.error(result.error || "Error al agregar material");
                    }
                }
            } else if (resourceType === "labor") {
                if (isEditMode && editData) {
                    // Edit mode: update only quantity and notes
                    const result = await updateRecipeLabor(editData.itemId, {
                        quantity: parsedQuantity,
                        notes: notes.trim() || null,
                    });
                    if (result.success) {
                        toast.success("Mano de obra actualizada");
                        handleSuccess();
                    } else {
                        toast.error(result.error || "Error al actualizar mano de obra");
                    }
                } else {
                    const result = await addRecipeLabor({
                        recipe_id: recipeId,
                        labor_type_id: selectedId,
                        quantity: parsedQuantity,
                        unit_id: selectedLaborType?.unit_id || null,
                        notes: notes.trim() || null,
                    });
                    if (result.success) {
                        toast.success("Mano de obra agregada a la receta");
                        handleSuccess();
                    } else {
                        toast.error(result.error || "Error al agregar mano de obra");
                    }
                }
            }
        } catch {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Conflict dialog: user confirmed their choices
     */
    const handleConflictConfirm = async () => {
        setConflictOpen(false);
        await executeExternalServiceSubmit(
            conflict.hasLaborConflict && removeLabor,
            conflict.hasMaterialsConflict && removeMaterials,
        );
    };

    // ========================================================================
    // Render
    // ========================================================================

    const labels: Record<ResourceType, { combobox: string; placeholder: string; search: string; empty: string; submit: string; submitEdit: string }> = {
        material: {
            combobox: "Material",
            placeholder: "Seleccionar material...",
            search: "Buscar material...",
            empty: "No se encontraron materiales",
            submit: "Agregar Material",
            submitEdit: "Guardar Cambios",
        },
        labor: {
            combobox: "Tipo de Mano de Obra",
            placeholder: "Seleccionar mano de obra...",
            search: "Buscar tipo...",
            empty: "No se encontraron tipos de mano de obra",
            submit: "Agregar Mano de Obra",
            submitEdit: "Guardar Cambios",
        },
        external_service: {
            combobox: "",
            placeholder: "",
            search: "",
            empty: "",
            submit: "Agregar Servicio",
            submitEdit: "Guardar Cambios",
        },
    };

    const l = labels[resourceType];

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Resource Type Selector */}
                        <SelectField
                            label="Tipo de Recurso"
                            required
                            className="md:col-span-2"
                            value={resourceType}
                            onChange={(v) => handleResourceTypeChange(v as ResourceType)}
                            placeholder="Seleccionar tipo..."
                            options={RESOURCE_TYPE_OPTIONS}
                            disabled={isEditMode}
                            renderOption={(option) => (
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-medium">{option.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {RESOURCE_TYPE_DESCRIPTIONS[option.value]}
                                    </span>
                                </div>
                            )}
                        />

                        {/* ── Material / Labor: Catalog Combobox ── */}
                        {resourceType !== "external_service" && (
                            <FormGroup
                                label={l.combobox}
                                required
                                className="md:col-span-2"
                            >
                                <Combobox
                                    value={selectedId}
                                    onValueChange={isEditMode ? () => { } : setSelectedId}
                                    options={comboboxOptions}
                                    placeholder={l.placeholder}
                                    searchPlaceholder={l.search}
                                    emptyMessage={l.empty}
                                    modal={true}
                                    disabled={isEditMode}
                                />
                            </FormGroup>
                        )}

                        {/* ── Servicio Subcontratado: Inline fields ── */}
                        {resourceType === "external_service" && (
                            <>
                                <FormGroup label="Nombre del Servicio" required className="md:col-span-2">
                                    <Input
                                        value={serviceName}
                                        onChange={(e) => setServiceName(e.target.value)}
                                        placeholder="Ej: Instalación eléctrica, Pintura exterior..."
                                        autoFocus
                                    />
                                </FormGroup>

                                {contacts.length > 0 && (
                                    <ContactField
                                        value={contactId}
                                        onChange={setContactId}
                                        contacts={contactFieldData}
                                        label="Proveedor"
                                        placeholder="Seleccionar proveedor (opcional)"
                                    />
                                )}

                                <SwitchField
                                    label="Incluye materiales"
                                    description="Llave en mano"
                                    value={includesMaterials}
                                    onChange={setIncludesMaterials}
                                />

                                <CurrencyField
                                    value={currencyId}
                                    onChange={setCurrencyId}
                                    currencies={currencies}
                                />

                                <AmountField
                                    value={unitPrice}
                                    onChange={setUnitPrice}
                                    label="Precio Unitario"
                                    required
                                />
                            </>
                        )}

                        {/* ── Shared fields: Quantity + Notes ── */}
                        {resourceType !== "external_service" && (
                            <AmountField
                                value={quantity}
                                onChange={setQuantity}
                                label="Cantidad"
                                required
                                min={0.001}
                                step={0.001}
                                placeholder="1"
                            />
                        )}

                        {/* Unidad auto-completada solo para material/labor */}
                        {resourceType !== "external_service" && (
                            <FormGroup label="Unidad">
                                <Input
                                    value={unitDisplay}
                                    disabled
                                    placeholder="Se auto-completa"
                                />
                            </FormGroup>
                        )}

                        {/* Notas */}
                        <NotesField
                            value={notes}
                            onChange={setNotes}
                            className="md:col-span-2"
                            rows={2}
                            placeholder="Notas opcionales..."
                        />


                    </div>
                </div>

                <FormFooter
                    className="-mx-4 -mb-4 mt-6"
                    isLoading={isLoading}
                    submitLabel={isEditMode ? l.submitEdit : l.submit}
                    onCancel={handleCancel}
                />
            </form>

            {/* ── Conflict Resolution Dialog ── */}
            <AlertDialog open={conflictOpen} onOpenChange={setConflictOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Conflicto en la receta
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 text-sm text-muted-foreground">
                                {/* Labor Conflict */}
                                {conflict.hasLaborConflict && (
                                    <div className="space-y-2">
                                        <p className="text-foreground font-medium">
                                            Esta receta contiene mano de obra propia.
                                        </p>
                                        <p>
                                            El servicio subcontratado normalmente reemplaza la ejecución propia.
                                        </p>
                                        <div className="space-y-1.5 pl-1">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="labor-conflict"
                                                    checked={removeLabor}
                                                    onChange={() => setRemoveLabor(true)}
                                                    className="accent-primary"
                                                />
                                                <span>Reemplazar mano de obra</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="labor-conflict"
                                                    checked={!removeLabor}
                                                    onChange={() => setRemoveLabor(false)}
                                                    className="accent-primary"
                                                />
                                                <span>Mantener ambos (modelo híbrido)</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Separator when both conflicts exist */}
                                {conflict.hasLaborConflict && conflict.hasMaterialsConflict && (
                                    <div className="border-t border-border" />
                                )}

                                {/* Materials Conflict */}
                                {conflict.hasMaterialsConflict && (
                                    <div className="space-y-2">
                                        <p className="text-foreground font-medium">
                                            Este servicio incluye materiales.
                                        </p>
                                        <p>
                                            Los materiales existentes en la receta quedarían duplicados en el costo.
                                        </p>
                                        <div className="space-y-1.5 pl-1">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="materials-conflict"
                                                    checked={removeMaterials}
                                                    onChange={() => setRemoveMaterials(true)}
                                                    className="accent-primary"
                                                />
                                                <span>Eliminar materiales existentes</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="materials-conflict"
                                                    checked={!removeMaterials}
                                                    onChange={() => setRemoveMaterials(false)}
                                                    className="accent-primary"
                                                />
                                                <span>Mantener materiales</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>
                            Cancelar
                        </AlertDialogCancel>
                        <Button
                            onClick={handleConflictConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? "Procesando..." : "Confirmar y agregar"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
