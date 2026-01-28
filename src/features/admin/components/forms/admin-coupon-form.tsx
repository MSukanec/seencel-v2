"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createCoupon, updateCoupon, type Coupon, type CreateCouponInput } from "@/features/admin/coupon-actions";

interface AdminCouponFormProps {
    initialData?: Coupon | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function AdminCouponForm({ initialData, onSuccess, onCancel }: AdminCouponFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    // Form state
    const [code, setCode] = useState(initialData?.code || "");
    const [type, setType] = useState<"percent" | "fixed">(initialData?.type || "percent");
    const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
    const [currency, setCurrency] = useState(initialData?.currency || "USD");
    const [appliesTo, setAppliesTo] = useState<"courses" | "subscriptions" | "all">(initialData?.applies_to || "courses");
    const [appliesToAll, setAppliesToAll] = useState(initialData?.applies_to_all ?? true);
    const [maxRedemptions, setMaxRedemptions] = useState(initialData?.max_redemptions?.toString() || "");
    const [perUserLimit, setPerUserLimit] = useState(initialData?.per_user_limit?.toString() || "1");
    const [startsAt, setStartsAt] = useState<Date | undefined>(initialData?.starts_at ? new Date(initialData.starts_at) : undefined);
    const [expiresAt, setExpiresAt] = useState<Date | undefined>(initialData?.expires_at ? new Date(initialData.expires_at) : undefined);
    const [minOrderTotal, setMinOrderTotal] = useState(initialData?.min_order_total?.toString() || "");
    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            toast.error("El código es requerido");
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("El monto debe ser mayor a 0");
            return;
        }

        setIsLoading(true);

        const data: CreateCouponInput = {
            code: code.trim(),
            type,
            amount: parseFloat(amount),
            currency: type === "fixed" ? currency : null,
            applies_to: appliesTo,
            applies_to_all: appliesToAll,
            max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
            per_user_limit: perUserLimit ? parseInt(perUserLimit) : 1,
            starts_at: startsAt?.toISOString() || null,
            expires_at: expiresAt?.toISOString() || null,
            min_order_total: minOrderTotal ? parseFloat(minOrderTotal) : null,
            is_active: isActive,
        };

        try {
            if (isEditing && initialData) {
                const result = await updateCoupon(initialData.id, data);
                if (result.success) {
                    toast.success("Cupón actualizado");
                    onSuccess?.();
                } else {
                    toast.error(result.error || "Error al actualizar");
                }
            } else {
                const result = await createCoupon(data);
                if (result.success) {
                    toast.success("Cupón creado");
                    onSuccess?.();
                } else {
                    toast.error(result.error || "Error al crear");
                }
            }
        } catch {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Código */}
                    <FormGroup label="Código" required>
                        <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="DESCUENTO20"
                            className="uppercase"
                        />
                    </FormGroup>

                    {/* Tipo */}
                    <FormGroup label="Tipo" required>
                        <Select value={type} onValueChange={(v) => setType(v as "percent" | "fixed")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percent">Porcentaje (%)</SelectItem>
                                <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Monto */}
                    <FormGroup label={type === "percent" ? "Porcentaje" : "Monto"} required>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={type === "percent" ? "20" : "50"}
                            min="0"
                            max={type === "percent" ? "100" : undefined}
                            step={type === "percent" ? "1" : "0.01"}
                        />
                    </FormGroup>

                    {/* Moneda (solo para fixed) */}
                    {type === "fixed" && (
                        <FormGroup label="Moneda">
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="ARS">ARS</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormGroup>
                    )}

                    {/* Aplica a */}
                    <FormGroup label="Aplica a">
                        <Select value={appliesTo} onValueChange={(v) => setAppliesTo(v as typeof appliesTo)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="courses">Solo Cursos</SelectItem>
                                <SelectItem value="subscriptions">Solo Suscripciones</SelectItem>
                                <SelectItem value="all">Ambos</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Límite total */}
                    <FormGroup label="Límite Total de Usos">
                        <Input
                            type="number"
                            value={maxRedemptions}
                            onChange={(e) => setMaxRedemptions(e.target.value)}
                            placeholder="100"
                            min="0"
                        />
                    </FormGroup>

                    {/* Límite por usuario */}
                    <FormGroup label="Usos por Usuario">
                        <Input
                            type="number"
                            value={perUserLimit}
                            onChange={(e) => setPerUserLimit(e.target.value)}
                            placeholder="1"
                            min="1"
                        />
                    </FormGroup>

                    {/* Mínimo de compra */}
                    <FormGroup label="Mínimo de Compra (USD)">
                        <Input
                            type="number"
                            value={minOrderTotal}
                            onChange={(e) => setMinOrderTotal(e.target.value)}
                            placeholder="50"
                            min="0"
                            step="0.01"
                        />
                    </FormGroup>

                    {/* Fecha inicio */}
                    <FormGroup label="Válido Desde">
                        <DatePicker
                            value={startsAt}
                            onChange={setStartsAt}
                        />
                    </FormGroup>

                    {/* Fecha expiración */}
                    <FormGroup label="Expira">
                        <DatePicker
                            value={expiresAt}
                            onChange={setExpiresAt}
                        />
                    </FormGroup>
                </div>

                {/* Switches */}
                <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Aplicar a todos los productos</p>
                            <p className="text-sm text-muted-foreground">
                                Si está desactivado, deberás asignar cursos/planes específicos
                            </p>
                        </div>
                        <Switch checked={appliesToAll} onCheckedChange={setAppliesToAll} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Cupón Activo</p>
                            <p className="text-sm text-muted-foreground">
                                Los cupones inactivos no pueden ser utilizados
                            </p>
                        </div>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                </div>
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Crear Cupón"}
                onCancel={onCancel}
            />
        </form>
    );
}
