
"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { ContactField, type Contact } from "@/components/shared/forms/fields/contact-field";
import { SelectField } from "@/components/shared/forms/fields/select-field";
import { NotesField } from "@/components/shared/forms/fields/notes-field";
import { ProjectField, type Project } from "@/components/shared/forms/fields/project-field";
import { createClientAction, updateClientAction } from "@/features/clients/actions";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type { ClientRole, ProjectClientView } from "../types";

// ============================================================================
// Types
// ============================================================================

interface ClientFormProps {
    orgId: string;
    roles: ClientRole[];
    /** When provided, project field is hidden (implicit) */
    projectId?: string;
    /** If provided, form is in EDIT mode */
    initialData?: ProjectClientView;
    /** Custom submit button label */
    submitLabel?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ClientForm({
    orgId,
    roles,
    projectId,
    initialData,
    submitLabel,
}: ClientFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isPending, startTransition] = useTransition();
    const isEditing = !!initialData;

    // ── Form State ──────────────────────────────────────────────────────
    const [selectedProjectId, setSelectedProjectId] = useState(initialData?.project_id || projectId || "");
    const [contactId, setContactId] = useState(initialData?.contact_id || "");
    const [clientRoleId, setClientRoleId] = useState(initialData?.client_role_id || "");
    const [notes, setNotes] = useState(initialData?.notes || "");

    // ── Fetched Data ────────────────────────────────────────────────────
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createSupabaseClient();

            const { data: contactsData } = await supabase
                .schema('projects').from("contacts_view")
                .select("id, full_name, company_name, email, resolved_avatar_url")
                .eq("organization_id", orgId)
                .eq("is_deleted", false)
                .order("full_name");

            if (contactsData) {
                setContacts(
                    contactsData.map((c) => ({
                        id: c.id,
                        name: c.full_name || c.email || "Sin nombre",
                        company_name: c.company_name,
                        avatar_url: c.resolved_avatar_url,
                    }))
                );
            }

            if (!projectId) {
                const { data: projectsData } = await supabase
                    .schema('projects').from("projects")
                    .select("id, name")
                    .eq("organization_id", orgId)
                    .eq("is_active", true)
                    .order("name");

                if (projectsData) setProjects(projectsData);
            }
        };

        fetchData();
    }, [orgId, projectId]);

    // ── Validation ──────────────────────────────────────────────────────
    const effectiveProjectId = projectId || selectedProjectId;
    const isValid = effectiveProjectId && (isEditing || contactId);

    // ── Submit ───────────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        const values = {
            organization_id: orgId,
            project_id: effectiveProjectId,
            contact_id: contactId,
            client_role_id: clientRoleId || undefined,
            notes: notes || undefined,
            is_primary: true,
        };

        // Optimistic: close and show success immediately
        closeModal();
        toast.success(isEditing ? "Cliente actualizado correctamente" : "Cliente vinculado al proyecto");

        startTransition(async () => {
            try {
                if (isEditing && initialData) {
                    await updateClientAction({ ...values, id: initialData.id });
                } else {
                    await createClientAction(values);
                }
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Error al guardar el cliente");
            }
        });
    };

    // ── Rol options ─────────────────────────────────────────────────────
    const roleOptions = roles.map((r) => ({
        value: r.id,
        label: r.name,
    }));

    const defaultLabel = isEditing ? "Guardar Cambios" : "Vincular Cliente";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 p-1 px-2">

                {/* Project — only shown when projectId is NOT provided */}
                {!projectId && (
                    <ProjectField
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        projects={projects}
                        required
                    />
                )}

                {/* Contact Selector — only in create mode */}
                {!isEditing && (
                    <ContactField
                        value={contactId}
                        onChange={setContactId}
                        contacts={contacts}
                        required
                        allowNone={false}
                        placeholder="Buscar contacto..."
                        searchPlaceholder="Escribí para buscar..."
                        emptyMessage="No se encontraron contactos."
                    />
                )}

                {/* Edit mode: contact is LOCKED */}
                {isEditing && (
                    <FormGroup label="Contacto">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30 text-sm text-foreground cursor-not-allowed select-none">
                            {initialData?.contact_avatar_url && (
                                <img
                                    src={initialData.contact_avatar_url}
                                    alt={initialData.contact_full_name || ""}
                                    className="h-6 w-6 rounded-full object-cover shrink-0"
                                />
                            )}
                            <span className="truncate">
                                {initialData?.contact_full_name || initialData?.contact_email || "Contacto"}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">No editable</span>
                        </div>
                    </FormGroup>
                )}

                {/* Role */}
                <SelectField
                    value={clientRoleId}
                    onChange={setClientRoleId}
                    options={roleOptions}
                    label="Rol"
                    placeholder="Seleccionar rol..."
                    required={false}
                    clearable
                />

                {/* Notes */}
                <NotesField
                    value={notes}
                    onChange={setNotes}
                    placeholder="Notas adicionales sobre el cliente..."
                />

            </div>

            <FormFooter
                onCancel={closeModal}
                isLoading={isPending}
                submitLabel={submitLabel || defaultLabel}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
