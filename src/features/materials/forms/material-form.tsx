"use client";

import { useState, useMemo } from "react";
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
    symbol?: string | null;
    applicable_to?: string[];
}

export interface Provider {
    id: string;
    name: string;
    avatar_url?: string | null;
}


export interface Material {
    id: string;
    name: string;
    code?: string | null;
    description?: string | null;
    default_provider_id?: string | null;
    default_sale_unit_id?: string | null;
    default_sale_unit_quantity?: number | null;
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
    isAdminMode = false,
    initialData,
    onSuccess,
    onCancel
}: MaterialFormProps) {
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = mode === "edit";

    // Filter units for material dropdowns (only those applicable to materials)
    const materialUnits = useMemo(() =>
        units.filter(u => u.applicable_to?.includes('material')),
        [units]
    );

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

    // Sale unit state
    const [saleUnitId, setSaleUnitId] = useState<string>(
        initialData?.default_sale_unit_id || ""
    );
    const [saleUnitQuantity, setSaleUnitQuantity] = useState<string>(
        initialData?.default_sale_unit_quantity?.toString() || ""
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

            // Add sale unit info
            if (saleUnitId) {
                formData.append("default_sale_unit_id", saleUnitId);
            }
            if (saleUnitQuantity) {
                formData.append("default_sale_unit_quantity", saleUnitQuantity);
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

                    <FormGroup
                        label="Unidad de Medida"
                        htmlFor="unit_id"
                        tooltip={
                            <span>
                                Unidad base para medir este material (ej: kg, m³, litro).{" "}
                                <a href="?tab=units">Gestionar unidades</a>
                            </span>
                        }
                    >
                        <Select name="unit_id" defaultValue={initialData?.unit_id || undefined}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar unidad..." />
                            </SelectTrigger>
                            <SelectContent>
                                {materialUnits.map((unit) => (
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
                                    tooltip={
                                        <span>
                                            Proveedor habitual de este material. Los proveedores se crean desde la sección de Contactos.{" "}
                                            <a href="../contacts" target="_blank">Gestionar contactos</a>
                                        </span>
                                    }
                                    placeholder="Seleccionar proveedor (opcional)"
                                    noneLabel="Sin proveedor asignado"
                                    searchPlaceholder="Buscar proveedor..."
                                    emptyMessage="No se encontraron proveedores."
                                />
                            </div>

                            {/* Row 6: Unidad de Venta + Cantidad por Unidad */}
                            <FormGroup
                                label="Unidad de Venta"
                                htmlFor="sale_unit_id"
                                tooltip={
                                    <span>
                                        Formato de empaque o presentación comercial (ej: bolsa, bidón, camión).{" "}
                                        <a href="?tab=units">Gestionar unidades</a>
                                    </span>
                                }
                            >
                                <Select value={saleUnitId} onValueChange={setSaleUnitId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ej: Bolsa, Camión..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {materialUnits.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.name} {unit.symbol ? `(${unit.symbol})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormGroup>

                            <FormGroup
                                label="Cantidad por Unidad"
                                htmlFor="sale_unit_quantity"
                                tooltip="Cantidad de la unidad de medida que contiene cada unidad de venta. Ej: si el material es en kg y se vende en bolsas de 25kg, poné 25."
                            >
                                <Input
                                    id="sale_unit_quantity"
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={saleUnitQuantity}
                                    onChange={(e) => setSaleUnitQuantity(e.target.value)}
                                    placeholder="Ej: 25"
                                />
                            </FormGroup>


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
