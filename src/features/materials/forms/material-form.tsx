"use client";

import { useState, useMemo, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createMaterial, updateMaterial, upsertMaterialPrice } from "@/features/materials/actions";
import { usePanel } from "@/stores/panel-store";
import { Package } from "lucide-react";
import { useFormData } from "@/stores/organization-store";
import {
    TextField,
    NotesField,
    SelectField,
    CurrencyField,
    AmountField,
    ContactField,
    type SelectOption,
} from "@/components/shared/forms/fields";

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
    formId?: string;
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
    formId
}: MaterialFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const isEditing = mode === "edit";

    // Self-describe: the form defines its own title, description, footer
    useEffect(() => {
        setPanelMeta({
            icon: Package,
            title: isEditing
                ? "Editar Material"
                : isAdminMode ? "Nuevo Material de Sistema" : "Nuevo Material",
            description: isEditing
                ? "Modifica los datos de este material"
                : isAdminMode
                    ? "Crear un material disponible para todas las organizaciones"
                    : "Agregar un material personalizado al catálogo de tu organización",
            size: "md",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Material"
            }
        });
    }, [isEditing, isAdminMode, setPanelMeta]);

    // Filter units for material dropdowns (only those applicable to materials)
    const materialUnitOptions = useMemo<SelectOption[]>(() =>
        units.filter(u => u.applicable_to?.includes('material'))
            .map(u => ({ value: u.id, label: `${u.name}${u.symbol ? ` (${u.symbol})` : ''}` })),
        [units]
    );

    // Category options
    const categoryOptions = useMemo<SelectOption[]>(() =>
        categories.map(c => ({ value: c.id, label: c.name })),
        [categories]
    );

    // Material type options
    const materialTypeOptions: SelectOption[] = [
        { value: "material", label: "Material" },
        { value: "consumable", label: "Consumible / Insumo" },
    ];

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

    // Core field state
    const [materialName, setMaterialName] = useState(initialData?.name || "");
    const [code, setCode] = useState(initialData?.code || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [materialType, setMaterialType] = useState(initialData?.material_type || "material");
    const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
    const [unitId, setUnitId] = useState(initialData?.unit_id || "");

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

        // Build FormData from controlled state (shared fields don't have native name attrs)
        const formData = new FormData();
        formData.set("name", materialName.trim());
        formData.set("code", code.trim());
        formData.set("description", description.trim());
        formData.set("material_type", materialType);
        if (categoryId) formData.set("category_id", categoryId);
        if (unitId) formData.set("unit_id", unitId);

        // Build optimistic data object
        const optimisticData: Partial<Material> = {
            id: isEditing && initialData?.id ? initialData.id : `temp-${Date.now()}`,
            name: materialName.trim(),
            code: code.trim() || null,
            description: description.trim() || null,
            material_type: materialType,
            category_id: categoryId || null,
            unit_id: unitId || null,
            default_provider_id: providerId || null,
            default_sale_unit_id: saleUnitId || null,
            default_sale_unit_quantity: saleUnitQuantity ? parseFloat(saleUnitQuantity) : null,
            organization_id: isAdminMode ? null : organizationId,
            is_system: isAdminMode,
            // Include display fields for immediate UI update
            unit_name: units.find(u => u.id === unitId)?.name || null,
            category_name: categories.find(c => c.id === categoryId)?.name || null,
            org_unit_price: unitPrice ? parseFloat(unitPrice) : null,
            org_price_currency_id: currencyId || null,
        } as Material;

        // ✅ OPTIMISTIC: Close modal and show success immediately
        onSuccess?.(optimisticData as Material);
        closePanel();
        toast.success(isEditing ? "¡Material actualizado!" : "¡Material creado!");

        // 🔄 BACKGROUND: Submit to server
        try {
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
                // ❌ ERROR: Notify user (view will rollback via router.refresh)
                toast.error(result.error);
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
                }
            }
        } catch (error: any) {
            console.error("Material form error:", error);
            toast.error("Error al guardar: " + error.message);
        }
    };


    const showPriceSection = !isAdminMode;

    return (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Row 1: Tipo + Código */}
                    <SelectField
                        label="Tipo"
                        value={materialType}
                        onChange={setMaterialType}
                        options={materialTypeOptions}
                        required
                    />

                    <TextField
                        label="Código"
                        value={code}
                        onChange={setCode}
                        placeholder="Ej: MAT-001"
                    />

                    {/* Row 2: Nombre (full width) */}
                    <div className="md:col-span-2">
                        <TextField
                            label="Nombre del Material"
                            value={materialName}
                            onChange={setMaterialName}
                            placeholder="Ej: Cemento Portland"
                            required
                        />
                    </div>

                    {/* Row 3: Categoría + Unidad */}
                    <SelectField
                        label="Categoría"
                        value={categoryId}
                        onChange={setCategoryId}
                        options={categoryOptions}
                        placeholder="Sin categoría"
                        clearable
                    />

                    <SelectField
                        label="Unidad de Medida"
                        value={unitId}
                        onChange={setUnitId}
                        options={materialUnitOptions}
                        placeholder="Seleccionar unidad..."
                    />

                    {/* Row 4: Descripción (full width) */}
                    <div className="md:col-span-2">
                        <NotesField
                            label="Descripción"
                            value={description}
                            onChange={setDescription}
                            placeholder="Descripción detallada del material (opcional)"
                        />
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
                                    tooltip="Proveedor habitual de este material."
                                    placeholder="Seleccionar proveedor (opcional)"
                                    noneLabel="Sin proveedor asignado"
                                    searchPlaceholder="Buscar proveedor..."
                                    emptyMessage="No se encontraron proveedores."
                                />
                            </div>

                            {/* Row 6: Unidad de Venta + Cantidad por Unidad */}
                            <SelectField
                                label="Unidad de Venta"
                                value={saleUnitId}
                                onChange={setSaleUnitId}
                                options={materialUnitOptions}
                                placeholder="Ej: Bolsa, Camión..."
                                clearable
                            />

                            <AmountField
                                value={saleUnitQuantity}
                                onChange={setSaleUnitQuantity}
                                label="Cantidad por Unidad"
                                placeholder="Ej: 25"
                            />


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
        </form>
    );
}
