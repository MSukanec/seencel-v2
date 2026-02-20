"use client";

// ============================================================
// ADMIN PAYMENT FORM
// ============================================================
// Crea/edita pagos manualmente.
// Usa shared fields y fetchea usuarios internamente.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectField } from "@/components/shared/forms/fields/select-field";
import { AmountField } from "@/components/shared/forms/fields/amount-field";

import { createPayment, updatePayment, getAdminUsers } from "../actions";
import type { AdminPayment } from "../queries";
import { useModal } from "@/stores/modal-store";

// ============================================================
// SCHEMA
// ============================================================

const formSchema = z.object({
    provider: z.string().min(1, "Proveedor requerido"),
    user_id: z.string().min(1, "Usuario requerido"),
    currency: z.string().min(1, "Moneda requerida"),
    amount: z.number().min(0, "Monto debe ser positivo"),
    status: z.enum(["pending", "completed", "rejected", "refunded"]),
});

type FormValues = z.infer<typeof formSchema>;

// ============================================================
// PROPS
// ============================================================

interface PaymentFormProps {
    initialData?: AdminPayment;
    onSuccess?: () => void;
}

// ============================================================
// OPTIONS
// ============================================================

const PROVIDER_OPTIONS = [
    { value: "manual", label: "Manual" },
    { value: "paypal", label: "PayPal" },
    { value: "stripe", label: "Stripe" },
    { value: "mercadopago", label: "MercadoPago" },
    { value: "transfer", label: "Transferencia" },
];

const CURRENCY_OPTIONS = [
    { value: "USD", label: "USD — Dólar" },
    { value: "ARS", label: "ARS — Peso Argentino" },
    { value: "EUR", label: "EUR — Euro" },
    { value: "MXN", label: "MXN — Peso Mexicano" },
];

const STATUS_OPTIONS = [
    { value: "pending", label: "Pendiente" },
    { value: "completed", label: "Completado" },
    { value: "rejected", label: "Rechazado" },
    { value: "refunded", label: "Reembolsado" },
];

// ============================================================
// COMPONENT
// ============================================================

export function PaymentForm({ initialData, onSuccess }: PaymentFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const isEditing = !!initialData;

    // ── Fetch users on mount ──────────────────────────────
    useEffect(() => {
        getAdminUsers().then((data) => {
            setUsers(data);
            setLoadingUsers(false);
        });
    }, []);

    // ── Form ─────────────────────────────────────────────
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: initialData?.provider || "manual",
            user_id: initialData?.user_id || "",
            currency: initialData?.currency || "ARS",
            amount: initialData?.amount || 0,
            status: (initialData?.status as FormValues["status"]) || "completed",
        },
    });

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form;

    // ── Submit ───────────────────────────────────────────
    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            if (isEditing) {
                await updatePayment({
                    id: initialData.id,
                    provider: values.provider,
                    amount: values.amount,
                    currency: values.currency,
                    status: values.status,
                });
                toast.success("Pago actualizado");
            } else {
                await createPayment({
                    provider: values.provider,
                    user_id: values.user_id,
                    amount: values.amount,
                    currency: values.currency,
                    status: values.status,
                });
                toast.success("Pago creado");
            }
            router.refresh();
            closeModal();
            onSuccess?.();
        } catch {
            toast.error(isEditing ? "Error al actualizar pago" : "Error al crear pago");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Build user options ────────────────────────────────
    const userOptions = users.map((u) => ({
        value: u.id,
        label: u.full_name || u.email,
        searchTerms: `${u.email} ${u.full_name ?? ""}`,
    }));

    // ── Render ────────────────────────────────────────────
    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 p-1">

                    {/* Proveedor */}
                    <Controller
                        control={control}
                        name="provider"
                        render={({ field }) => (
                            <SelectField
                                label="Proveedor"
                                options={PROVIDER_OPTIONS}
                                value={field.value}
                                onChange={field.onChange}
                                required
                                error={errors.provider?.message}
                            />
                        )}
                    />

                    {/* Usuario (solo al crear) */}
                    {!isEditing && (
                        <Controller
                            control={control}
                            name="user_id"
                            render={({ field }) => (
                                <SelectField
                                    label="Usuario"
                                    options={userOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    required
                                    searchable
                                    searchPlaceholder="Buscar usuario..."
                                    loading={loadingUsers}
                                    error={errors.user_id?.message}
                                    emptyState={{ message: "No hay usuarios registrados." }}
                                />
                            )}
                        />
                    )}

                    {/* Moneda + Monto (Moneda primero) */}
                    <div className="grid grid-cols-2 gap-4">
                        <Controller
                            control={control}
                            name="currency"
                            render={({ field }) => (
                                <SelectField
                                    label="Moneda"
                                    options={CURRENCY_OPTIONS}
                                    value={field.value}
                                    onChange={field.onChange}
                                    required
                                    error={errors.currency?.message}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="amount"
                            render={({ field }) => (
                                <AmountField
                                    label="Monto"
                                    value={field.value}
                                    onChange={(val) => field.onChange(parseFloat(val) || 0)}
                                    required
                                />
                            )}
                        />
                    </div>

                    {/* Estado */}
                    <Controller
                        control={control}
                        name="status"
                        render={({ field }) => (
                            <SelectField
                                label="Estado"
                                options={STATUS_OPTIONS}
                                value={field.value}
                                onChange={field.onChange}
                                required
                                error={errors.status?.message}
                            />
                        )}
                    />
                </div>

                {/* Sticky Footer */}
                <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Actualizar" : "Crear"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
