"use client";

import { useState } from "react";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createMaterial, updateMaterial, upsertMaterialPrice } from "@/features/materials/actions";
import { useModal } from "@/stores/modal-store";
import { useFormData } from "@/stores/organization-store";
import { CurrencyField, AmountField, ContactField } from "@/components/shared/forms/fields";

// ============================================================================
// Types
// ============================================================================

export interface MaterialCategory {
    id: string;
    name: string;
    parent_id: string | null;
}

export interface Unit {
    id: string;
    name: string;
    abbreviation: string;
}

export interface Provider {
    id: string;
    name: string;
    avatar_url?: string | null;
}

export interface UnitPresentation {
    id: string;
    unit_id: string;
    name: string;
    equivalence: number;
}

export interface Material {
    id: string;
    name: string;
    code?: string | null;
    description?: string | null;
    default_provider_id?: string | null;
    unit_id: string | null;
    category_id: string | null;
    material_type: string;
    is_system: boolean;
    organization_id: string | null;
    // Price from view
    org_unit_price?: number | null;
    org_price_currency_id?: string | null;
    org_price_valid_from?: string | null;
}

// ============================================================================
// Props
// ============================================================================

interface MaterialFormProps {
    mode: "create" | "edit";
    organizationId: string;
    units: Unit[];
    categories: MaterialCategory[];
    providers?: Provider[];
    presentations?: UnitPresentation[];
    isAdminMode?: boolean;
    initialData?: Material | null;
    onSuccess?: (material?: Material) => void;
    onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function MaterialForm({
    mode,
    organizationId,
    units,
    categories,
    providers = [],
    presentations = [],
    isAdminMode = false,
    initialData,
    onSuccess,
    onCancel
}: MaterialFormProps) {
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = mode === "edit";

    // Get currencies from organization store (already hydrated in layout)
    const { currencies, getPrimaryCurrency } = useFormData();
    const defaultCurrencyId = getPrimaryCurrency()?.id || "";

    // Price state
    const [unitPrice, setUnitPrice] = useState<string>(
        initialData?.org_unit_price?.toString() || ""
    );
    const [currencyId, setCurrencyId] = useState<string>(
        initialData?.org_price_currency_id || defaultCurrencyId || ""
    );

    // Provider state
    const [providerId, setProviderId] = useState<string>(
        initialData?.default_provider_id || ""
    );

    // Presentation state
    const [defaultUnitPresentationId, setDefaultUnitPresentationId] = useState<string>(
        (initialData as any)?.default_unit_presentation_id || ""
    );
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading(isEditing ? "Guardando cambios..." : "Creando material...");

        try {
            const formData = new FormData(e.currentTarget);

            // Add organization_id for non-admin mode
            if (!isAdminMode) {
                formData.append("organization_id", organizationId);
            }

            // Add provider
            if (providerId) {
                formData.append("default_provider_id", providerId);
            }

            // Add presentation
            if (defaultUnitPresentationId) {
                formData.append("default_unit_presentation_id", defaultUnitPresentationId);
            }

            if (isEditing && initialData?.id) {
                formData.append("id", initialData.id);
            }

            const result = isEditing
                ? await updateMaterial(formData, isAdminMode)
                : await createMaterial(formData, isAdminMode);

            if (result.error) {
                toast.error(result.error, { id: toastId });
                setIsLoading(false);
                return;
            }

            // Handle price if provided (only for org materials, not admin)
            if (!isAdminMode && unitPrice && currencyId && result.data?.id) {
                try {
                    await upsertMaterialPrice({
                        material_id: result.data.id,
                        organization_id: organizationId,
                        currency_id: currencyId,
                        unit_price: parseFloat(unitPrice),
                    });
                } catch (priceError) {
                    console.error("Error saving price:", priceError);
                    // Don't fail the whole operation for price errors
                }
            }

            toast.success(isEditing ? "¡Material actualizado!" : "¡Material creado!", { id: toastId });
            onSuccess?.(result.data);
        } catch (error: any) {
            console.error("Material form error:", error);
            toast.error("Error inesperado: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        onCancel?.();
        closeModal();
    };

    const showPriceSection = !isAdminMode;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Row 1: Tipo + Código */}
                    <FormGroup label="Tipo" htmlFor="material_type" required>
                        <Select name="material_type" defaultValue={initialData?.material_type || "material"}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="material">Material</SelectItem>
                                <SelectItem value="consumable">Consumible / Insumo</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    <FormGroup label="Código" htmlFor="code">
                        <Input
                            id="code"
                            name="code"
                            placeholder="Ej: MAT-001"
                            defaultValue={initialData?.code || ""}
                        />
                    </FormGroup>

                    {/* Row 2: Nombre (full width) */}
                    <div className="md:col-span-2">
                        <FormGroup label="Nombre del Material" htmlFor="name" required>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ej: Cemento Portland"
                                defaultValue={initialData?.name || ""}
                                required
                            />
                        </FormGroup>
                    </div>

                    {/* Row 3: Categoría + Unidad */}
                    <FormGroup label="Categoría" htmlFor="category_id">
                        <Select name="category_id" defaultValue={initialData?.category_id || undefined}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sin categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    <FormGroup label="Unidad de Medida" htmlFor="unit_id">
                        <Select name="unit_id" defaultValue={initialData?.unit_id || undefined}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar unidad..." />
                            </SelectTrigger>
                            <SelectContent>
                                {units.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                        {unit.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Row 4: Descripción (full width) */}
                    <div className="md:col-span-2">
                        <FormGroup label="Descripción" htmlFor="description">
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Descripción detallada del material (opcional)"
                                defaultValue={initialData?.description || ""}
                                className="min-h-[80px]"
                            />
                        </FormGroup>
                    </div>

                    {/* Supplier & Price Section - Only for org materials */}
                    {showPriceSection && (
                        <>
                            <div className="md:col-span-2 pt-2">
                                <Separator className="mb-4" />
                            </div>

                            {/* Row 5: Proveedor (full width) */}
                            <div className="md:col-span-2">
                                <ContactField
                                    value={providerId}
                                    onChange={setProviderId}
                                    contacts={providers}
                                    label="Proveedor por defecto"
                                    placeholder="Seleccionar proveedor (opcional)"
                                    noneLabel="Sin proveedor asignado"
                                    searchPlaceholder="Buscar proveedor..."
                                    emptyMessage="No se encontraron proveedores."
                                />
                            </div>

                            {/* Row 6: Unidad de Presentación (full width) */}
                            <div className="md:col-span-2">
                                <FormGroup label="Unidad de Presentación" htmlFor="default_unit_presentation_id">
                                    <Select
                                        value={defaultUnitPresentationId || "none"}
                                        onValueChange={(val) => setDefaultUnitPresentationId(val === "none" ? "" : val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar presentación (opcional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin presentación</SelectItem>
                                            {presentations
                                                .filter((p) => !units.find((u) => u.id === p.unit_id) || true)
                                                .map((presentation) => (
                                                    <SelectItem key={presentation.id} value={presentation.id}>
                                                        {presentation.name} ({presentation.equivalence} unidades)
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </FormGroup>
                            </div>

                            {/* Row 7: Moneda + Precio */}
                            <CurrencyField
                                value={currencyId}
                                onChange={setCurrencyId}
                                currencies={currencies}
                                required={false}
                            />

                            <AmountField
                                value={unitPrice}
                                onChange={setUnitPrice}
                                label="Precio Unitario"
                                required={false}
                                placeholder="0.00"
                            />
                        </>
                    )}

                </div>
            </div>

            <FormFooter
                onCancel={handleCancel}
                cancelLabel="Cancelar"
                submitLabel={isLoading
                    ? (isEditing ? "Guardando..." : "Creando...")
                    : (isEditing ? "Guardar Cambios" : "Crear Material")
                }
                isLoading={isLoading}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
