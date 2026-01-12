
"use client";

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
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClientAction } from "@/features/clients/actions";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { ClientRole } from "../types";

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
}

export function ClientForm({ onSuccess, orgId, roles, projectId }: ClientFormProps) {
    const [isPending, startTransition] = useTransition();
    const [contacts, setContacts] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            organization_id: orgId,
            project_id: projectId || "",
            contact_id: "",
            client_role_id: "",
            is_primary: true,
            notes: "",
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
                await createClientAction(values);
                toast.success("Cliente agregado correctamente");
                onSuccess();
            } catch (error: any) {
                toast.error(error.message || "Error al agregar el cliente");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Project Selection - Conditional */}
                {!projectId && (
                    <FormField
                        control={form.control}
                        name="project_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proyecto</FormLabel>
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {/* Hidden input if projectId is fixed */}
                {projectId && <input type="hidden" {...form.register("project_id")} />}

                {/* Contact Selection */}
                <FormField
                    control={form.control}
                    name="contact_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contacto</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar contacto..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {contacts.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.full_name} {c.company_name ? `(${c.company_name})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Role Selection */}
                <FormField
                    control={form.control}
                    name="client_role_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rol del Cliente</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar rol (opcional)..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Notas adicionales sobre el cliente..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Agregando..." : "Agregar Cliente"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
