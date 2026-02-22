"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { SelectField } from "@/components/shared/forms/fields/select-field";
import { NotesField } from "@/components/shared/forms/fields/notes-field";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
    linkCollaboratorToProjectAction,
    inviteContactToProjectAction,
} from "@/features/external-actors/project-access-actions";

// ============================================================================
// Types
// ============================================================================

interface ContactOption {
    id: string;
    full_name: string | null;
    email: string | null;
    contact_type: string | null;
    linked_user_id: string | null;
}

interface ProjectClient {
    id: string;
    contact: {
        full_name: string | null;
    } | null;
}

interface CollaboratorFormProps {
    orgId: string;
    projectId: string;
}

// ============================================================================
// Component (Semi-Autonomous)
// ============================================================================

export function CollaboratorForm({
    orgId,
    projectId,
}: CollaboratorFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isPending, startTransition] = useTransition();

    // ── Form State ──────────────────────────────────────────────────────
    const [selectedContactId, setSelectedContactId] = useState("");
    const [selectedClientId, setSelectedClientId] = useState("");
    const [notes, setNotes] = useState("");

    // ── Fetched Data ────────────────────────────────────────────────────
    const [contacts, setContacts] = useState<ContactOption[]>([]);
    const [projectClients, setProjectClients] = useState<ProjectClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch available contacts and project clients on mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const supabase = createSupabaseClient();

            // 1. Get contacts of the org (personas with email)
            const { data: orgContacts } = await supabase
                .schema("contacts").from("contacts")
                .select("id, full_name, email, contact_type, linked_user_id")
                .eq("organization_id", orgId)
                .eq("is_deleted", false)
                .eq("contact_type", "person")
                .not("email", "is", null);

            // 2. Get user_ids already linked to this project
            const { data: existingAccess } = await supabase
                .schema('iam').from("project_access")
                .select("user_id")
                .eq("project_id", projectId)
                .eq("is_deleted", false);

            const linkedUserIds = new Set(
                (existingAccess || []).map((a) => a.user_id).filter(Boolean)
            );

            // 3. Filter: only contacts NOT already linked via their user_id
            const available = (orgContacts || []).filter((contact) => {
                if (!contact.linked_user_id) return true; // No user yet → show (will invite)
                return !linkedUserIds.has(contact.linked_user_id); // User not already linked
            });

            // 4. Get project clients for scoping
            const { data: clients } = await supabase
                .schema("projects").from("project_clients")
                .select("id, contact:contacts(full_name)")
                .eq("project_id", projectId)
                .eq("is_deleted", false);

            const mappedClients = (clients || []).map((c: any) => ({
                id: c.id,
                contact: Array.isArray(c.contact) ? c.contact[0] || null : c.contact,
            }));

            setContacts(available);
            setProjectClients(mappedClients);
            setIsLoading(false);
        };

        fetchData();
    }, [orgId, projectId]);

    // ── Derived State ───────────────────────────────────────────────────
    const selectedContact = contacts.find((c) => c.id === selectedContactId);
    const hasLinkedUser = !!selectedContact?.linked_user_id;
    const willInvite = selectedContact && !hasLinkedUser;

    // ── Callbacks ───────────────────────────────────────────────────────
    const handleCancel = () => {
        closeModal();
    };

    const isValid = !!selectedContactId;

    // ── Submit ───────────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || !selectedContact) return;

        closeModal();

        startTransition(async () => {
            try {
                if (hasLinkedUser) {
                    // Direct link: contact has a Seencel account
                    await linkCollaboratorToProjectAction({
                        project_id: projectId,
                        organization_id: orgId,
                        user_id: selectedContact.linked_user_id!,
                        access_type: "external",
                        access_level: "viewer",
                        client_id: selectedClientId || null,
                    });
                    toast.success("Colaborador vinculado al proyecto");
                } else {
                    // Invite: contact doesn't have a Seencel account yet
                    const result = await inviteContactToProjectAction({
                        project_id: projectId,
                        organization_id: orgId,
                        contact_id: selectedContact.id,
                        email: selectedContact.email!,
                        contact_name: selectedContact.full_name || selectedContact.email!,
                        access_type: "external",
                        client_id: selectedClientId || null,
                    });

                    if (result.success) {
                        toast.success("Invitación enviada por email", {
                            description: `Se envió una invitación a ${selectedContact.email}`,
                        });
                    } else {
                        toast.error(result.error || "Error al enviar la invitación");
                    }
                }
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Error al vincular el colaborador");
            }
        });
    };

    // ── Options ─────────────────────────────────────────────────────────
    const contactOptions = contacts.map((c) => {
        const name = c.full_name || c.email || "Sin nombre";
        const status = c.linked_user_id
            ? "✓ Con cuenta Seencel"
            : "✉ Sin cuenta (se enviará invitación)";

        return {
            value: c.id,
            label: `${name} — ${status}`,
        };
    });

    const clientOptions = [
        { value: "", label: "Sin restricción (ve todo el proyecto)" },
        ...projectClients.map((c) => ({
            value: c.id,
            label: c.contact?.full_name || "Cliente sin nombre",
        })),
    ];

    const noContactsAvailable = !isLoading && contacts.length === 0;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 p-1 px-2">

                {/* Contact selector */}
                {noContactsAvailable ? (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">No hay contactos disponibles</p>
                        <p>
                            Todos los contactos con email ya están vinculados a este proyecto,
                            o no hay contactos tipo persona registrados.
                        </p>
                        <p className="mt-2">
                            Podés crear nuevos contactos desde{" "}
                            <strong>Contactos → Nuevo Contacto</strong>.
                        </p>
                    </div>
                ) : (
                    <SelectField
                        value={selectedContactId}
                        onChange={setSelectedContactId}
                        options={contactOptions}
                        label="Contacto"
                        placeholder={isLoading ? "Cargando..." : "Seleccionar contacto..."}
                        required
                    />
                )}

                {/* Invitation notice */}
                {willInvite && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-sm text-muted-foreground">
                        <p>
                            <strong>{selectedContact.full_name || selectedContact.email}</strong> no tiene
                            cuenta en Seencel. Se enviará una invitación por email a{" "}
                            <strong>{selectedContact.email}</strong>.
                        </p>
                        <p className="mt-1 text-xs">
                            El acceso al proyecto se otorgará automáticamente cuando acepte la invitación.
                        </p>
                    </div>
                )}

                {/* Client scope selector */}
                {!noContactsAvailable && projectClients.length > 0 && (
                    <SelectField
                        value={selectedClientId}
                        onChange={setSelectedClientId}
                        options={clientOptions}
                        label="Restringir a cliente"
                        placeholder="Sin restricción"
                    />
                )}

                {/* Notes (optional) */}
                {!noContactsAvailable && (
                    <NotesField
                        value={notes}
                        onChange={setNotes}
                        placeholder="Notas sobre el acceso del colaborador..."
                    />
                )}
            </div>

            <FormFooter
                onCancel={handleCancel}
                isLoading={isPending || noContactsAvailable}
                submitLabel={willInvite ? "Enviar Invitación" : "Vincular Colaborador"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
