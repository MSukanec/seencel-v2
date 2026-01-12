
"use client";

import { DataTable } from "@/components/ui/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ClientCommitment, ProjectClientView } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCommitmentAction } from "@/features/clients/actions";

// ------------------------------------------------------------------------
// COMMITMENT FORM
// ------------------------------------------------------------------------

const commitmentFormSchema = z.object({
    project_id: z.string().min(1),
    client_id: z.string().min(1),
    organization_id: z.string().min(1),
    amount: z.coerce.number().positive(),
    currency_id: z.string().min(1),
});

interface CommitmentFormProps {
    clients: ProjectClientView[];
    onSuccess: () => void;
    projectId?: string;
    orgId?: string;
}

function CommitmentForm({ clients, onSuccess, projectId, orgId }: CommitmentFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof commitmentFormSchema>>({
        resolver: zodResolver(commitmentFormSchema) as any,
        defaultValues: {
            amount: 0,
            project_id: projectId || "",
            organization_id: orgId || "",
            client_id: "",
            currency_id: "",
        },
        mode: "onChange"
    });

    const onSubmit = (values: z.infer<typeof commitmentFormSchema>) => {
        startTransition(async () => {
            try {
                // Placeholder currency until we have selector
                await createCommitmentAction({
                    ...values,
                    currency_id: "00000000-0000-0000-0000-000000000000",
                    exchange_rate: 1
                });
                toast.success("Compromiso creado");
                onSuccess();
            } catch (e) {
                toast.error("Error al crear (currency placeholder)");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                const client = clients.find(c => c.id === val);
                                if (client) {
                                    // If we didn't have projectId passed, we trust client data
                                    if (!projectId) form.setValue("project_id", client.project_id);
                                    if (!orgId) form.setValue("organization_id", client.organization_id);
                                }
                            }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cliente..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.contact_full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Monto Total</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="text-xs text-muted-foreground bg-yellow-100 p-2 rounded text-yellow-800">
                    Nota: La selección de moneda está pendiente de integración.
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
                    <Button type="submit" disabled={isPending}>Guardar</Button>
                </div>
            </form>
        </Form>
    )
}

// ------------------------------------------------------------------------
// TABLE
// ------------------------------------------------------------------------

interface ClientCommitmentsTableProps {
    data: any[];
    clients: ProjectClientView[];
    projectId?: string;
    orgId?: string;
}

export function ClientCommitmentsTable({ data, clients, projectId, orgId }: ClientCommitmentsTableProps) {
    const { openModal, closeModal } = useModal();

    const handleCreate = () => {
        openModal(
            <CommitmentForm clients={clients} onSuccess={closeModal} projectId={projectId} orgId={orgId} />,
            { title: "Nuevo Compromiso" }
        );
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "client.contact.full_name",
            header: "Cliente",
            cell: ({ row }) => row.original.client?.contact?.full_name || "N/A"
        },
        {
            accessorKey: "project.name", // Still useful if we view cross-project (but we are filtering now)
            header: "Proyecto",
            cell: ({ row }) => row.original.project?.name || "N/A"
        },
        {
            accessorKey: "amount",
            header: "Monto",
            cell: ({ row }) => {
                const amount = Number(row.original.amount);
                const currency = row.original.currency?.symbol || "$";
                return <span className="font-mono font-medium">{currency} {amount.toLocaleString()}</span>
            }
        },
        {
            accessorKey: "created_at",
            header: "Fecha",
            cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Compromiso</Button>
            </div>
            <DataTable columns={columns} data={data} searchKey="project.name" />
        </div>
    );
}
