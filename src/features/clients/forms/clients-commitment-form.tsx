"use client";

import { useTransition, useState, useEffect } from "react";
import { useModal } from "@/stores/modal-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCommitmentAction, updateCommitmentAction } from "@/features/clients/actions";
import { ProjectClientView, OrganizationFinancialData } from "../types";

const commitmentFormSchema = z.object({
    amount: z.coerce.number().positive("El monto debe ser positivo"),
    project_id: z.string().min(1, "El proyecto es requerido"),
    organization_id: z.string().min(1, "La organización es requerida"),
    client_id: z.string().min(1, "El cliente es requerido"),
    currency_id: z.string().min(1, "La moneda es requerida"),
    exchange_rate: z.coerce.number().positive("El tipo de cambio debe ser positivo"),
    commitment_method: z.enum(["fixed"]).default("fixed"),
    unit_name: z.string().optional(),
    concept: z.string().optional(), // Was unit_description
    description: z.string().optional(),
});

interface CommitmentFormProps {
    clients: ProjectClientView[];
    financialData: OrganizationFinancialData;
    onSuccess: () => void;
    projectId?: string;
    orgId?: string;
    initialData?: any;
}

export function CommitmentForm({ clients, financialData, onSuccess, projectId, orgId, initialData }: CommitmentFormProps) {
    const { closeModal } = useModal();
    const [isPending, startTransition] = useTransition();

    const { currencies, defaultCurrencyId } = financialData;

    const form = useForm<z.infer<typeof commitmentFormSchema>>({
        resolver: zodResolver(commitmentFormSchema) as any,
        defaultValues: {
            amount: initialData ? Number(initialData.amount) : 0,
            project_id: initialData?.project_id || projectId || "",
            organization_id: initialData?.organization_id || orgId || "",
            client_id: initialData?.client_id || initialData?.client?.id || "",
            currency_id: initialData?.currency_id || initialData?.currency?.id || defaultCurrencyId || "",
            exchange_rate: initialData ? Number(initialData.exchange_rate) : 1,
            commitment_method: initialData?.commitment_method || "fixed",
            unit_name: initialData?.unit_name || "",
            concept: initialData?.concept || initialData?.unit_description || "",
            description: initialData?.description || "",
        },
    });

    // Reset form when initialData changes to ensure fields are populated
    useEffect(() => {
        if (initialData) {
            form.reset({
                project_id: initialData.project_id,
                client_id: initialData.client_id || initialData.client?.id,
                organization_id: initialData.organization_id,
                amount: Number(initialData.amount),
                currency_id: initialData.currency_id || initialData.currency?.id,
                exchange_rate: Number(initialData.exchange_rate),
                commitment_method: initialData.commitment_method,
                unit_name: initialData.unit_name || "",
                concept: initialData.concept || initialData.unit_description || "",
                description: initialData.description || "",
            });
        }
    }, [initialData, form]);

    const onSubmit = (values: z.infer<typeof commitmentFormSchema>) => {
        // If exchange_rate is not provided (empty/undefined), default to 1 on submission
        if (!values.exchange_rate) {
            values.exchange_rate = 1;
        }

        // ✅ OPTIMISTIC: Close and show success immediately
        onSuccess();
        closeModal();
        toast.success(initialData?.id ? "Compromiso actualizado correctamente" : "Compromiso creado correctamente");

        // 🔄 BACKGROUND: Submit to server
        startTransition(async () => {
            try {
                // Manually construct FormData to inject currency_code and handle ID
                const formData = new FormData();
                Object.entries(values).forEach(([key, val]) => {
                    if (val !== undefined && val !== null) {
                        formData.append(key, String(val));
                    }
                });

                // Inject currency_code for robust backend validation
                const selectedCurrency = currencies.find((c: any) => c.id === values.currency_id);
                if (selectedCurrency?.code) {
                    formData.append('currency_code', selectedCurrency.code);
                }

                if (initialData?.id) {
                    formData.append('id', initialData.id);
                    await updateCommitmentAction(formData as any);
                } else {
                    await createCommitmentAction(formData as any);
                }
            } catch (error: any) {
                console.error("Error saving commitment:", error);
                toast.error(error.message || "Error al guardar compromiso");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 p-1 px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Cliente */}
                        <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => {
                                // Always show Select to allow reassignment
                                return (
                                    <FormItem>
                                        <FormLabel>Cliente <span className="text-red-500">*</span></FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                const client = clients.find(c => c.id === val);
                                                if (client) {
                                                    if (!projectId) form.setValue("project_id", client.project_id);
                                                    if (!orgId) form.setValue("organization_id", client.organization_id);
                                                }
                                            }}
                                            value={field.value || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar cliente..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {clients
                                                    .sort((a, b) => (a.contact_full_name || "").localeCompare(b.contact_full_name || ""))
                                                    .map(c => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.contact_full_name}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />

                        {/* 2. Unidad Funcional (Opcional) */}
                        <FormField
                            control={form.control}
                            name="unit_name"
                            render={({ field }) => (
                                <FormGroup label="Unidad Funcional (Opcional)">
                                    <Input {...field} placeholder="Ej. Depto 4B" />
                                </FormGroup>
                            )}
                        />
                    </div>

                    {/* 3. Concepto */}
                    <FormField
                        control={form.control}
                        name="concept"
                        render={({ field }) => (
                            <FormGroup label="Concepto (Opcional)">
                                <Input {...field} placeholder="Ej. Adelanto, Cuota 1, Cancelación..." />
                            </FormGroup>
                        )}
                    />

                    {/* 4. Descripción */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormGroup label="Descripción (Opcional)">
                                <Textarea {...field} placeholder="Detalles adicionales..." />
                            </FormGroup>
                        )}
                    />

                    {/* 5. Monto Comprometido */}
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormGroup label="Monto Comprometido" required>
                                <Input type="number" step="0.01" {...field} />
                            </FormGroup>
                        )}
                    />

                    {/* 6. Moneda / Tipo de Cambio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="currency_id"
                            render={({ field }) => (
                                <FormGroup label="Moneda" required>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar moneda" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {currencies.map((curr: any) => (
                                                <SelectItem key={curr.id} value={curr.id}>
                                                    {curr.name} ({curr.symbol})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormGroup>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="exchange_rate"
                            render={({ field }) => (
                                <FormGroup label="Tipo de Cambio (Opcional)">
                                    <Input type="number" step="0.0001" placeholder="1.0000" {...field} />
                                </FormGroup>
                            )}
                        />
                    </div>

                    {/* 7. Método de Compromiso */}
                    <FormField
                        control={form.control}
                        name="commitment_method"
                        render={({ field }) => (
                            <FormGroup label="Método de Compromiso">
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="fixed">Fijo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormGroup>
                        )}
                    />
                </div>

                <FormFooter
                    onCancel={closeModal}
                    isLoading={isPending}
                    submitLabel={initialData ? "Actualizar Compromiso" : "Guardar Compromiso"}
                    className="-mx-4 -mb-4 mt-6"
                />
            </form>
        </Form>
    );
}
