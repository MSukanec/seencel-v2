"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { toast } from "sonner";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { parseDateFromDB, formatDateForDB } from "@/lib/timezone-data";
import { useFormData } from "@/stores/organization-store";
import { createPurchaseOrder, updatePurchaseOrder } from "@/features/materials/actions";
import { RequirementsSelector } from "./requirements-selector";
import {
    ContactField,
    CurrencyField,
    DateField,
    NotesField,
} from "@/components/shared/forms/fields";
import {
    PurchaseOrderView,
    PurchaseOrderItem,
    PurchaseOrderItemFormData,
    MaterialRequirement
} from "../types";
import { CatalogMaterial, MaterialUnit } from "../queries";

interface PurchaseOrderFormProps {
    projectId?: string;
    organizationId: string;
    providers: { id: string; name: string }[];
    materials?: CatalogMaterial[];
    units?: MaterialUnit[];
    requirements?: MaterialRequirement[];
    initialData?: {
        order: PurchaseOrderView;
        items: PurchaseOrderItem[];
    } | null;
    formId?: string;
}

export function PurchaseOrderForm({
    projectId,
    organizationId,
    providers,
    materials = [],
    units = [],
    requirements = [],
    initialData,
    formId,
}: PurchaseOrderFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta } = usePanel();
    const [isLoading, setIsLoading] = useState(false);
    const [showRequirementsSelector, setShowRequirementsSelector] = useState(false);

    const isEditing = !!initialData?.order;

    // Self-describe
    useEffect(() => {
        setPanelMeta({
            icon: ClipboardList,
            title: isEditing ? "Editar Orden de Compra" : "Nueva Orden de Compra",
            description: isEditing
                ? "Modifica los detalles de la orden."
                : "Creá una orden de compra para solicitar materiales a un proveedor.",
            size: "lg",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Orden"
            }
        });
    }, [isEditing, setPanelMeta]);
    const { currencies, getPrimaryCurrency } = useFormData();
    const defaultCurrencyId = getPrimaryCurrency()?.id || "";

    // ========================================
    // FORM STATE
    // ========================================
    const [orderDate, setOrderDate] = useState<Date | undefined>(
        parseDateFromDB(initialData?.order?.order_date) ?? new Date()
    );
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | undefined>(
        parseDateFromDB(initialData?.order?.expected_delivery_date) ?? undefined
    );
    const [providerId, setProviderId] = useState(initialData?.order?.provider_id || "");
    const [currencyId, setCurrencyId] = useState(initialData?.order?.currency_id || defaultCurrencyId || "");
    const [notes, setNotes] = useState(initialData?.order?.notes || "");

    // Items State
    const [items, setItems] = useState<PurchaseOrderItemFormData[]>(
        initialData?.items?.map(item => ({
            id: item.id,
            material_id: item.material_id,
            description: item.description,
            quantity: item.quantity,
            unit_id: item.unit_id,
            unit_price: item.unit_price,
            notes: item.notes,
        })) || []
    );

    // ========================================
    // CALLBACKS INTERNOS (Semi-autónomo)
    // ========================================
    const handleSuccess = () => {
        closePanel();
        router.refresh();
    };

    // ========================================
    // ITEM HANDLERS
    // ========================================
    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, unit_price: null }]);
    };

    const addFromRequirements = (newItems: PurchaseOrderItemFormData[]) => {
        const existingMaterialIds = new Set(items.filter(i => i.material_id).map(i => i.material_id));
        const uniqueNewItems = newItems.filter(
            newItem => !newItem.material_id || !existingMaterialIds.has(newItem.material_id)
        );
        setItems([...items, ...uniqueNewItems]);
        setShowRequirementsSelector(false);
        toast.success(`${uniqueNewItems.length} item(s) agregados`);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof PurchaseOrderItemFormData, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill description and unit if material is selected
        if (field === 'material_id' && value) {
            const material = materials.find(m => m.id === value);
            if (material) {
                newItems[index].description = material.name;
                if (material.unit_id) {
                    newItems[index].unit_id = material.unit_id;
                }
            }
        }

        setItems(newItems);
    };

    const getUnitName = (unitId: string | null | undefined) => {
        if (!unitId) return null;
        const unit = units.find(u => u.id === unitId);
        return unit?.abbreviation || unit?.name || null;
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
            return sum + itemTotal;
        }, 0);
    };

    // ========================================
    // SUBMIT
    // ========================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const validItems = items.filter(item => item.description?.trim());
            if (validItems.length === 0) {
                toast.error("Agregá al menos un item a la orden");
                setIsLoading(false);
                return;
            }

            const payload = {
                project_id: projectId || "",
                organization_id: organizationId,
                provider_id: providerId || null,
                order_date: formatDateForDB(orderDate) ?? formatDateForDB(new Date()) ?? new Date().toISOString().split('T')[0],
                expected_delivery_date: formatDateForDB(expectedDeliveryDate) ?? null,
                currency_id: currencyId || null,
                notes: notes || null,
                items: validItems.map(item => ({
                    material_id: item.material_id || null,
                    description: item.description,
                    quantity: item.quantity || 1,
                    unit_id: item.unit_id || null,
                    unit_price: item.unit_price || null,
                    notes: item.notes || null,
                })),
            };

            if (isEditing && initialData?.order) {
                const result = await updatePurchaseOrder({
                    id: initialData.order.id,
                    ...payload,
                });
                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success("Orden actualizada correctamente");
                    handleSuccess();
                }
            } else {
                const result = await createPurchaseOrder(payload);
                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success("Orden creada correctamente");
                    handleSuccess();
                }
            }
        } catch (error: any) {
            console.error("Error submitting order:", error);
            toast.error(error.message || "Error al guardar la orden");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedCurrency = currencies.find(c => c.id === currencyId);

    // ========================================
    // REQUIREMENTS SELECTOR VIEW
    // ========================================
    if (showRequirementsSelector) {
        return (
            <div className="flex flex-col h-[500px]">
                <RequirementsSelector
                    requirements={requirements}
                    onSelect={addFromRequirements}
                    onClose={() => setShowRequirementsSelector(false)}
                />
            </div>
        );
    }

    // ========================================
    // MAIN FORM
    // ========================================
    return (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-6">
                {/* Header Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ContactField
                        value={providerId}
                        onChange={setProviderId}
                        contacts={providers}
                        label="Proveedor"
                        placeholder="Seleccionar proveedor"
                        searchPlaceholder="Buscar proveedor..."
                        emptyMessage="No se encontraron proveedores."
                        noneLabel="Sin asignar"
                        tooltip={null}
                    />

                    <CurrencyField
                        value={currencyId}
                        onChange={setCurrencyId}
                        required={false}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DateField
                        value={orderDate}
                        onChange={setOrderDate}
                        label="Fecha de Orden"
                        required
                    />

                    <DateField
                        value={expectedDeliveryDate}
                        onChange={setExpectedDeliveryDate}
                        label="Fecha Esperada de Entrega"
                        required={false}
                        placeholder="Seleccionar fecha (opcional)"
                    />
                </div>

                {/* Notes */}
                <NotesField
                    value={notes}
                    onChange={setNotes}
                    required={false}
                />

                {/* Items Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Items de la Orden</h4>
                        <div className="flex gap-2">
                            {requirements.length > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRequirementsSelector(true)}
                                >
                                    <ClipboardList className="mr-1 h-3 w-3" />
                                    Desde Necesidades
                                </Button>
                            )}
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="mr-1 h-3 w-3" />
                                Agregar Item
                            </Button>
                        </div>
                    </div>

                    {/* Items List */}
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 border rounded-lg border-dashed text-muted-foreground">
                            <ClipboardList className="h-8 w-8 mb-2" />
                            <p className="text-sm mb-3">No hay items en la orden</p>
                            <div className="flex gap-2">
                                {requirements.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowRequirementsSelector(true)}
                                    >
                                        <ClipboardList className="mr-1 h-3 w-3" />
                                        Desde Necesidades
                                    </Button>
                                )}
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="mr-1 h-3 w-3" />
                                    Item Libre
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-12 gap-2 items-center p-3 bg-muted/50 rounded-lg"
                                >
                                    {/* Material/Description */}
                                    <div className="col-span-12 md:col-span-5">
                                        {materials.length > 0 ? (
                                            <Select
                                                value={item.material_id || "custom"}
                                                onValueChange={(val) => {
                                                    if (val === "custom") {
                                                        updateItem(index, 'material_id', null);
                                                    } else {
                                                        updateItem(index, 'material_id', val);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-sm">
                                                    <SelectValue placeholder="Seleccionar material o escribir..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="custom">
                                                        <span className="text-muted-foreground">✏️ Escribir manualmente</span>
                                                    </SelectItem>
                                                    {materials.map((m) => (
                                                        <SelectItem key={m.id} value={m.id}>
                                                            {m.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                placeholder="Descripción del item"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        )}
                                    </div>

                                    {/* Description (if custom) */}
                                    {materials.length > 0 && !item.material_id && (
                                        <div className="col-span-12 md:col-span-3">
                                            <Input
                                                placeholder="Descripción"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    )}

                                    {/* Quantity + Unit */}
                                    <div className={cn(
                                        "flex items-center gap-1",
                                        materials.length > 0 && !item.material_id
                                            ? "col-span-4 md:col-span-2"
                                            : "col-span-5 md:col-span-3"
                                    )}>
                                        <Input
                                            type="number"
                                            placeholder="Cant."
                                            min="0"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="h-9 text-sm"
                                        />
                                        {item.unit_id && (
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {getUnitName(item.unit_id)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Unit Price */}
                                    <div className="col-span-5 md:col-span-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                                {selectedCurrency?.symbol || "$"}
                                            </span>
                                            <Input
                                                type="number"
                                                placeholder="Precio"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price ?? ""}
                                                onChange={(e) => updateItem(index, 'unit_price', e.target.value ? parseFloat(e.target.value) : null)}
                                                className="h-9 text-sm pl-6"
                                            />
                                        </div>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="col-span-1 md:col-span-1 text-right text-sm tabular-nums text-muted-foreground">
                                        {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString("es-AR", {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </div>

                                    {/* Delete Button */}
                                    <div className="col-span-1 md:col-span-1 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(index)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total */}
                    {items.length > 0 && (
                        <div className="flex justify-end pt-2 border-t">
                            <div className="text-sm">
                                <span className="text-muted-foreground mr-2">Total:</span>
                                <span className="font-semibold tabular-nums text-base">
                                    {selectedCurrency?.symbol || "$"}
                                    {calculateTotal().toLocaleString("es-AR", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
