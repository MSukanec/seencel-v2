"use client";

import { useState, useTransition } from "react";
import { Users, Wrench, UserPlus, UserCheck } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { SettingsSection } from "@/components/shared/settings-section";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { ContentLayout } from "@/components/layout";
import { useModal } from "@/stores/modal-store";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { ClientForm } from "@/features/clients/forms/clients-form";
import { ContactForm } from "@/features/contact/forms/contact-form";
import { CollaboratorForm } from "@/features/external-actors/forms/collaborator-form";
import { deleteClientAction } from "@/features/clients/actions";
import { unlinkCollaboratorFromProjectAction } from "@/features/external-actors/project-access-actions";
import { EXTERNAL_ACTOR_TYPE_LABELS } from "@/features/team/types";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
    ParticipantListItem,
    type ParticipantItemData,
} from "@/components/shared/list-item/items/participant-list-item";
import type { ClientRole, ProjectClientView } from "@/features/clients/types";
import type { ProjectAccessView } from "@/features/external-actors/project-access-queries";

// ============================================================================
// Types
// ============================================================================

interface ProjectParticipantsViewProps {
    projectId: string;
    organizationId: string;
    clientRoles: ClientRole[];
    projectClients: ProjectClientView[];
    projectCollaborators: ProjectAccessView[];
}

// ============================================================================
// Component
// ============================================================================

export function ProjectParticipantsView({
    projectId,
    organizationId,
    clientRoles,
    projectClients,
    projectCollaborators,
}: ProjectParticipantsViewProps) {
    const { openModal } = useModal();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // ── Unlink Dialog State ─────────────────────────────────────────────
    const [unlinkTarget, setUnlinkTarget] = useState<{
        data: ParticipantItemData;
        type: "client" | "collaborator";
    } | null>(null);

    // ── Handlers: Vincular Cliente ──────────────────────────────────────

    const handleLinkClient = () => {
        openModal(
            <ClientForm
                orgId={organizationId}
                roles={clientRoles}
                projectId={projectId}
                submitLabel="Vincular Cliente"
            />,
            {
                title: "Vincular Cliente",
                description: "Vinculá un contacto como cliente de este proyecto.",
                size: "md",
            }
        );
    };

    // ── Handlers: Editar vinculación (cambiar rol, etc.) ────────────────

    const handleEditClient = (participant: ParticipantItemData) => {
        const clientData = projectClients.find((c) => c.id === participant.id);
        if (!clientData) return;

        openModal(
            <ClientForm
                orgId={organizationId}
                roles={clientRoles}
                projectId={projectId}
                initialData={clientData}
                submitLabel="Guardar Cambios"
            />,
            {
                title: "Editar Vinculación",
                description: "Modificá el rol u otros datos del cliente en este proyecto.",
                size: "md",
            }
        );
    };

    // ── Handlers: Editar Contacto (AUTÓNOMO — form fetchea sus datos) ───

    const handleEditContact = async (participant: ParticipantItemData) => {
        if (!participant.contact_id) return;

        // Fetch the full contact data for the form's initialData
        const supabase = createSupabaseClient();
        const { data: contact, error } = await supabase
            .from("contacts")
            .select("*, contact_categories(id, name)")
            .eq("id", participant.contact_id)
            .single();

        if (error || !contact) {
            toast.error("No se pudo cargar los datos del contacto");
            return;
        }

        // Open ContactForm in autonomous mode — no need to pass categories or companies
        openModal(
            <ContactForm
                organizationId={organizationId}
                initialData={contact}
            />,
            {
                title: "Editar Contacto",
                description: `Modificando a ${contact.full_name || "contacto"}`,
                size: "lg",
            }
        );
    };

    // ── Handlers: Desvincular Cliente ──────────────────────────────────

    const handleUnlinkClient = (participant: ParticipantItemData) => {
        setUnlinkTarget({ data: participant, type: "client" });
    };

    // ── Handlers: Vincular Colaborador ──────────────────────────────────

    const handleLinkCollaborator = () => {
        openModal(
            <CollaboratorForm
                orgId={organizationId}
                projectId={projectId}
            />,
            {
                title: "Vincular Colaborador",
                description: "Vinculá un colaborador externo de tu organización a este proyecto.",
                size: "md",
            }
        );
    };

    // ── Handlers: Desvincular Colaborador ───────────────────────────────

    const handleUnlinkCollaborator = (participant: ParticipantItemData) => {
        setUnlinkTarget({ data: participant, type: "collaborator" });
    };

    // ── Confirm Unlink (unified) ────────────────────────────────────────

    const handleConfirmUnlink = () => {
        if (!unlinkTarget) return;
        const displayName = unlinkTarget.data.contact_full_name || "este participante";
        const isClient = unlinkTarget.type === "client";

        setUnlinkTarget(null);
        toast.success(`${displayName} desvinculado del proyecto`);

        startTransition(async () => {
            try {
                if (isClient) {
                    await deleteClientAction(unlinkTarget.data.id);
                } else {
                    await unlinkCollaboratorFromProjectAction(unlinkTarget.data.id);
                }
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Error al desvincular");
                router.refresh();
            }
        });
    };

    // ── Derived state ───────────────────────────────────────────────────

    const hasClients = projectClients.length > 0;
    const hasCollaborators = projectCollaborators.length > 0;

    // Map collaborators to ParticipantItemData
    const collaboratorParticipants: ParticipantItemData[] = projectCollaborators.map((col) => ({
        id: col.id,
        contact_full_name: col.contact_full_name || col.user_full_name,
        contact_email: col.contact_email || col.user_email,
        contact_phone: col.contact_phone,
        contact_company_name: col.contact_company_name,
        contact_avatar_url: col.resolved_avatar_url,
        role_name: col.access_type
            ? EXTERNAL_ACTOR_TYPE_LABELS[col.access_type]?.label || col.access_type
            : null,
        contact_id: col.contact_id,
        notes: null,
    }));

    return (
        <ContentLayout variant="wide">
            <div className="space-y-12 pb-12">

                {/* ===== CLIENTES SECTION ===== */}
                <SettingsSection
                    icon={Users}
                    title="Clientes"
                    description="Clientes vinculados a este proyecto. Pueden seguir el avance de la obra, ver documentos y consultar estados de cuenta desde su portal."
                    actions={[
                        {
                            label: "Vincular Cliente",
                            icon: UserPlus,
                            onClick: handleLinkClient,
                        },
                    ]}
                >
                    {hasClients ? (
                        <div className="space-y-2">
                            {projectClients.map((client) => (
                                <ParticipantListItem
                                    key={client.id}
                                    participant={client}
                                    onEdit={handleEditClient}
                                    onEditContact={handleEditContact}
                                    onUnlink={handleUnlinkClient}
                                />
                            ))}
                        </div>
                    ) : (
                        <ViewEmptyState
                            mode="empty"
                            icon={Users}
                            viewName="Clientes del Proyecto"
                            featureDescription="Vinculá contactos como clientes de este proyecto para que puedan seguir el avance, ver documentos y consultar estados de cuenta."
                            actionLabel="Vincular Cliente"
                            onAction={handleLinkClient}
                        />
                    )}
                </SettingsSection>

                {/* ===== COLABORADORES SECTION ===== */}
                <SettingsSection
                    icon={Wrench}
                    title="Colaboradores"
                    description="Profesionales que participan en este proyecto: contadores, directores de obra, subcontratistas, etc."
                    actions={[
                        {
                            label: "Vincular Colaborador",
                            icon: UserCheck,
                            onClick: handleLinkCollaborator,
                        },
                    ]}
                >
                    {hasCollaborators ? (
                        <div className="space-y-2">
                            {collaboratorParticipants.map((collaborator) => (
                                <ParticipantListItem
                                    key={collaborator.id}
                                    participant={collaborator}
                                    onUnlink={handleUnlinkCollaborator}
                                />
                            ))}
                        </div>
                    ) : (
                        <ViewEmptyState
                            mode="empty"
                            icon={Wrench}
                            viewName="Colaboradores del Proyecto"
                            featureDescription="Vinculá colaboradores externos de tu organización a este proyecto: contadores, directores de obra, subcontratistas y otros profesionales involucrados."
                            actionLabel="Vincular Colaborador"
                            onAction={handleLinkCollaborator}
                        />
                    )}
                </SettingsSection>

            </div>

            {/* ===== UNLINK CONFIRMATION DIALOG ===== */}
            <DeleteConfirmationDialog
                open={!!unlinkTarget}
                onOpenChange={(open) => { if (!open) setUnlinkTarget(null); }}
                onConfirm={handleConfirmUnlink}
                title={unlinkTarget?.type === "client" ? "Desvincular cliente" : "Desvincular colaborador"}
                description={
                    <>
                        ¿Estás seguro de que querés desvincular a{" "}
                        <strong>{unlinkTarget?.data.contact_full_name || "este participante"}</strong>{" "}
                        de este proyecto? {unlinkTarget?.type === "client"
                            ? "Esta acción no elimina el contacto."
                            : "El colaborador seguirá siendo parte de la organización."}
                    </>
                }
                confirmLabel="Desvincular"
                isDeleting={isPending}
                deletingLabel="Desvinculando..."
            />
        </ContentLayout>
    );
}
