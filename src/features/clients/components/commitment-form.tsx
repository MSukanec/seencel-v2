"use client";

import { useState, useTransition } from "react";
import { useModal } from "@/providers/modal-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FormFooter } from "@/components/shared/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCommitmentAction } from "@/features/clients/actions";
import { ProjectClientView } from "../types";

const commitmentFormSchema = z.object({
    project_id: z.string().min(1),
    client_id: z.string().min(1, "El cliente es requerido"),
    organization_id: z.string().min(1),
    amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
    currency_id: z.string().min(1, "La moneda es requerida"),
    exchange_rate: z.coerce.number().optional(),
    commitment_method: z.enum(["fixed"]).default("fixed"),
    unit_name: z.string().optional(),
    unit_description: z.string().optional(),
});

interface CommitmentFormProps {
    clients: ProjectClientView[];
    financialData: any;
    onSuccess: () => void;
    projectId?: string;
    orgId?: string;
}

export function CommitmentForm({ clients, financialData, onSuccess, projectId, orgId }: CommitmentFormProps) {
    const { closeModal } = useModal();
    const [isPending, startTransition] = useTransition();

    const { currencies, defaultCurrencyId } = financialData;

    const form = useForm<z.infer<typeof commitmentFormSchema>>({
        resolver: zodResolver(commitmentFormSchema),
        defaultValues: {
            amount: 0,
            project_id: projectId || "",
            organization_id: orgId || "",
            client_id: "",
            currency_id: defaultCurrencyId || "",
            // exchange_rate default removed to show placeholder
            commitment_method: "fixed",
            unit_name: "",
            unit_description: "",
        },
    });

    const onSubmit = (values: z.infer<typeof commitmentFormSchema>) => {
        // If exchange_rate is not provided (empty/undefined), default to 1 on submission
        if (!values.exchange_rate) {
            values.exchange_rate = 1;
        }

        startTransition(async () => {
            try {
                await createCommitmentAction(values);
                toast.success("Compromiso creado correctamente");
                onSuccess();
                closeModal();
            } catch (error: any) {
                console.error("Error creating commitment:", error);
                toast.error(error.message || "Error al crear compromiso");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-4 p-1 px-2">
                    {/* 1. Cliente */}
                    <FormField
                        control={form.control}
                        name="client_id"
                        render={({ field }) => (
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
                                    defaultValue={field.value}
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
                        )}
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

                    {/* 3. Monto Comprometido */}
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormGroup label="Monto Comprometido" required>
                                <Input type="number" step="0.01" {...field} />
                            </FormGroup>
                        )}
                    />

                    {/* 4. Moneda / Tipo de Cambio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="currency_id"
                            render={({ field }) => (
                                <FormGroup label="Moneda" required>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                    {/* 5. Método de Compromiso */}
                    <FormField
                        control={form.control}
                        name="commitment_method"
                        render={({ field }) => (
                            <FormGroup label="Método de Compromiso">
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                    {/* 6. Descripción */}
                    <FormField
                        control={form.control}
                        name="unit_description"
                        render={({ field }) => (
                            <FormGroup label="Descripción">
                                <Textarea
                                    {...field}
                                    placeholder="Detalles adicionales..."
                                    className="min-h-[80px]"
                                />
                            </FormGroup>
                        )}
                    />
                </div>

                <FormFooter
                    onCancel={closeModal}
                    isLoading={isPending}
                    submitLabel="Guardar Compromiso"
                    className="-mx-4 -mb-4 mt-6"
                />
            </form>
        </Form>
    );
}
