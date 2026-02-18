
"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
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
    /** Custom submit button label (default: "Agregar Cliente") */
    submitLabel?: string;
}

// ============================================================================
// Component (Semi-Autonomous)
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

    // Fetch contacts (and projects if needed) on mount
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createSupabaseClient();

            // Fetch contacts (not deleted)
            const { data: contactsData } = await supabase
                .from("contacts")
                .select("id, full_name, company_name, email, image_url")
                .eq("organization_id", orgId)
                .eq("is_deleted", false)
                .order("full_name");

            if (contactsData) {
                setContacts(
                    contactsData.map((c) => ({
                        id: c.id,
                        name: c.full_name || c.email || "Sin nombre",
                        company_name: c.company_name,
                        avatar_url: c.image_url,
                    }))
                );
            }

            // Fetch projects only if projectId is NOT provided
            if (!projectId) {
                const { data: projectsData } = await supabase
                    .from("projects")
                    .select("id, name")
                    .eq("organization_id", orgId)
                    .eq("is_active", true)
                    .order("name");

                if (projectsData) setProjects(projectsData);
            }
        };

        fetchData();
    }, [orgId, projectId]);

    // ── Callbacks internos ──────────────────────────────────────────────
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    // ── Validation ──────────────────────────────────────────────────────
    const effectiveProjectId = projectId || selectedProjectId;

    const isValid = effectiveProjectId && contactId;

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
        toast.success(isEditing ? "Cliente actualizado correctamente" : "Cliente vinculado correctamente");

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

    // ── Default submit label ────────────────────────────────────────────
    const defaultLabel = isEditing ? "Guardar Cambios" : "Agregar Cliente";

    // ── Rol options for SelectField ─────────────────────────────────────
    const roleOptions = roles.map((r) => ({
        value: r.id,
        label: r.name,
    }));

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

                {/* Contact */}
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

                {/* Role (optional) */}
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
                onCancel={handleCancel}
                isLoading={isPending}
                submitLabel={submitLabel || defaultLabel}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
