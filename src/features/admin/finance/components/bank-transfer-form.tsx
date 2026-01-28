"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormFooter } from "@/components/shared/forms/form-footer";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateBankTransfer } from "@/features/admin/finance/actions";
import type { AdminBankTransfer } from "@/features/admin/finance/queries";

// ============================================================================
// SCHEMA
// ============================================================================

const bankTransferFormSchema = z.object({
    status: z.enum(["pending", "approved", "rejected"]),
    review_reason: z.string().optional().nullable(),
    payer_name: z.string().optional().nullable(),
    payer_note: z.string().optional().nullable(),
    discount_percent: z.number().min(0).max(100).optional(),
    discount_amount: z.number().min(0).optional(),
});

type BankTransferFormValues = z.infer<typeof bankTransferFormSchema>;

// ============================================================================
// PROPS
// ============================================================================

interface BankTransferFormProps {
    transfer: AdminBankTransfer;
    onSuccess?: () => void;
    onCancel?: () => void;
    readOnly?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BankTransferForm({ transfer, onSuccess, onCancel, readOnly = false }: BankTransferFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<BankTransferFormValues>({
        resolver: zodResolver(bankTransferFormSchema),
        defaultValues: {
            status: transfer.status,
            review_reason: transfer.review_reason || "",
            payer_name: transfer.payer_name || "",
            payer_note: transfer.payer_note || "",
            discount_percent: transfer.discount_percent ?? 0,
            discount_amount: transfer.discount_amount ?? 0,
        },
    });

    const onSubmit = async (values: BankTransferFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await updateBankTransfer({
                id: transfer.id,
                status: values.status,
                review_reason: values.review_reason || null,
                payer_name: values.payer_name || null,
                payer_note: values.payer_note || null,
                discount_percent: values.discount_percent ?? null,
                discount_amount: values.discount_amount ?? null,
            });

            if (result.success) {
                toast.success("Transferencia actualizada");
                onSuccess?.();
            } else {
                toast.error(result.error || "Error al actualizar");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency,
        }).format(amount);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col h-full min-h-0"
            >
                {/* Scrollable Content */}
                <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-4 space-y-6">
                    {/* Transfer Info (Read-only) */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Usuario:</span>
                            <span className="text-sm font-medium">
                                {transfer.user?.full_name || transfer.user?.email || "—"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Curso:</span>
                            <span className="text-sm font-medium">
                                {transfer.course?.title || "—"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Monto:</span>
                            <span className="text-sm font-medium">
                                {formatCurrency(transfer.amount, transfer.currency)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Fecha:</span>
                            <span className="text-sm font-medium">
                                {new Date(transfer.created_at).toLocaleDateString("es-AR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                        {transfer.receipt_url && (
                            <div className="pt-2 border-t">
                                <a
                                    href={transfer.receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Ver comprobante
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Editable Fields */}
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={readOnly}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="approved">Aprobado</SelectItem>
                                        <SelectItem value="rejected">Rechazado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="review_reason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Motivo de revisión</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Ej: Comprobante verificado, rechazado por inconsistencia..."
                                        className="resize-none"
                                        rows={3}
                                        {...field}
                                        value={field.value || ""}
                                        disabled={readOnly}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payer_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del pagador</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Nombre completo"
                                        {...field}
                                        value={field.value || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payer_note"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nota del usuario</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Nota añadida por el usuario..."
                                        className="resize-none bg-muted"
                                        rows={2}
                                        {...field}
                                        value={field.value || ""}
                                        disabled
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Sticky Footer - Uses FormFooter per Forms & Modals Standard */}
                {!readOnly && (
                    <FormFooter
                        className="-mx-4 -mb-4 mt-6"
                        isLoading={isSubmitting}
                        submitLabel="Guardar cambios"
                        onCancel={onCancel}
                    />
                )}
            </form>
        </Form>
    );
}
