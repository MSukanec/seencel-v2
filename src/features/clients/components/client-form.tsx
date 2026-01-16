
"use client";

import { Link } from '@/i18n/routing';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { createClientAction, updateClientAction } from "@/features/clients/actions";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { ClientRole, ProjectClientView } from "../types";
import { useModal } from "@/providers/modal-store";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/form-footer";

const formSchema = z.object({
    project_id: z.string().min(1, "El proyecto es requerido"),
    contact_id: z.string().min(1, "El contacto es requerido"),
    organization_id: z.string().min(1),
    client_role_id: z.string().optional(),
    notes: z.string().optional(),
    is_primary: z.boolean().optional(),
});

type ClientFormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
    onSuccess: () => void;
    orgId: string;
    roles: ClientRole[];
    projectId?: string;
    /** If provided, form is in EDIT mode */
    initialData?: ProjectClientView;
}

export function ClientForm({ onSuccess, orgId, roles, projectId, initialData }: ClientFormProps) {
    const isEditMode = !!initialData;
    const { closeModal } = useModal();
    const [isPending, startTransition] = useTransition();
    const [contacts, setContacts] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            organization_id: orgId,
            project_id: initialData?.project_id || projectId || "",
            contact_id: initialData?.contact_id || "",
            client_role_id: initialData?.client_role_id || "",
            is_primary: true, // Always true, hidden from UI
            notes: initialData?.notes || "",
        },
    });

    // Fetch Contacts and Projects on mount
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createSupabaseClient();

            // Fetch Contacts (that are not deleted)
            const { data: contactsData } = await supabase
                .from('contacts')
                .select('id, full_name, company_name, email')
                .eq('organization_id', orgId)
                .eq('is_deleted', false)
                .order('full_name');

            if (contactsData) setContacts(contactsData);

            // Fetch Projects (active) - ONLY if projectId is NOT provided
            if (!projectId) {
                const { data: projectsData } = await supabase
                    .from('projects')
                    .select('id, name')
                    .eq('organization_id', orgId)
                    .eq('is_active', true)
                    .order('name');

                if (projectsData) setProjects(projectsData);
            }
        };

        fetchData();
    }, [orgId, projectId]);

    const onSubmit = (values: ClientFormValues) => {
        startTransition(async () => {
            try {
                if (isEditMode && initialData) {
                    await updateClientAction({ ...values, id: initialData.id });
                    toast.success("Cliente actualizado correctamente");
                } else {
                    await createClientAction(values);
                    toast.success("Cliente agregado correctamente");
                }
                if (onSuccess) onSuccess();
                closeModal();
            } catch (error: any) {
                toast.error(error.message || "Error al guardar el cliente");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-4 p-1 px-2">

                    {/* Project Selection - Conditional */}
                    {!projectId && (
                        <FormField
                            control={form.control}
                            name="project_id"
                            render={({ field }) => (
                                <FormGroup label="Proyecto" required>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar proyecto..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {projects.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormGroup>
                            )}
                        />
                    )}
                    {/* Hidden input if projectId is fixed */}
                    {projectId && <input type="hidden" {...form.register("project_id")} />}

                    {/* 1. Contacto - Using Combobox for searchable selection */}
                    <FormField
                        control={form.control}
                        name="contact_id"
                        render={({ field }) => (
                            <FormGroup label="Contacto" required>
                                <Combobox
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    options={contacts.map((c) => ({
                                        value: c.id,
                                        label: c.full_name + (c.company_name ? ` (${c.company_name})` : ''),
                                        searchTerms: c.email || ''
                                    }))}
                                    placeholder="Buscar contacto..."
                                    searchPlaceholder="Escribí para buscar..."
                                    emptyMessage="No se encontraron contactos."
                                />
                            </FormGroup>
                        )}
                    />

                    {/* 2. Rol */}
                    <FormField
                        control={form.control}
                        name="client_role_id"
                        render={({ field }) => (
                            <FormGroup label="Rol (Opcional)">
                                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar rol..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {roles.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormGroup>
                        )}
                    />

                    {/* 3. Notas */}
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormGroup label="Notas">
                                <Textarea placeholder="Notas adicionales sobre el cliente..." {...field} />
                            </FormGroup>
                        )}
                    />

                </div>

                <FormFooter
                    onCancel={closeModal}
                    isLoading={isPending}
                    submitLabel={isEditMode ? "Guardar Cambios" : "Agregar Cliente"}
                    className="-mx-4 -mb-4 mt-6"
                />
            </form>
        </Form>
    );
}
