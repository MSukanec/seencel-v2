"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { createPayment, updatePayment } from "../actions";
import type { AdminPayment } from "../queries";
import { useModal } from "@/providers/modal-store";

const formSchema = z.object({
    provider: z.string().min(1, "Proveedor requerido"),
    provider_payment_id: z.string().optional(),
    user_id: z.string().min(1, "Usuario requerido"),
    amount: z.number().min(0, "Monto debe ser positivo"),
    currency: z.string().min(1, "Moneda requerida"),
    status: z.enum(["pending", "completed", "rejected", "refunded"]),
    gateway: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentFormProps {
    initialData?: AdminPayment;
    users?: { id: string; email: string; full_name: string | null }[];
    onSuccess?: () => void;
}

/**
 * Payment Form for Create/Edit operations
 * Follows Seencel Forms & Modals Standard
 */
export function PaymentForm({ initialData, users = [], onSuccess }: PaymentFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: initialData?.provider || "manual",
            provider_payment_id: initialData?.provider_payment_id || "",
            user_id: initialData?.user_id || "",
            amount: initialData?.amount || 0,
            currency: initialData?.currency || "USD",
            status: (initialData?.status as FormValues["status"]) || "completed",
            gateway: initialData?.gateway || "",
        },
    });

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
                    gateway: values.gateway,
                });
                toast.success("Pago actualizado");
            } else {
                await createPayment({
                    provider: values.provider,
                    provider_payment_id: values.provider_payment_id,
                    user_id: values.user_id,
                    amount: values.amount,
                    currency: values.currency,
                    status: values.status,
                    gateway: values.gateway,
                });
                toast.success("Pago creado");
            }
            router.refresh();
            closeModal();
            onSuccess?.();
        } catch (error) {
            toast.error(isEditing ? "Error al actualizar pago" : "Error al crear pago");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 p-1">
                    {/* Provider */}
                    <FormField
                        control={form.control}
                        name="provider"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proveedor</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar proveedor" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual</SelectItem>
                                        <SelectItem value="paypal">PayPal</SelectItem>
                                        <SelectItem value="stripe">Stripe</SelectItem>
                                        <SelectItem value="mercadopago">MercadoPago</SelectItem>
                                        <SelectItem value="transfer">Transferencia</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* User Selection (only for create) */}
                    {!isEditing && (
                        <FormField
                            control={form.control}
                            name="user_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Usuario</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar usuario" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.full_name || user.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* Amount & Currency */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Moneda</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="MXN">MXN</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Status */}
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="completed">Completado</SelectItem>
                                        <SelectItem value="rejected">Rechazado</SelectItem>
                                        <SelectItem value="refunded">Reembolsado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Gateway (optional) */}
                    <FormField
                        control={form.control}
                        name="gateway"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gateway (opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="ej: stripe, paypal" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Provider Payment ID (optional) */}
                    {!isEditing && (
                        <FormField
                            control={form.control}
                            name="provider_payment_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ID Proveedor (opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ej: pi_123abc..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
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
