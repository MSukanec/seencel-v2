"use client";

import { useState, useTransition } from "react";
import { Users, Wrench, UserPlus, UserCheck, Lock, BookOpen, History } from "lucide-react";
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
import {
    deleteClientAction,
    deactivateClientAction,
    reactivateClientAction,
} from "@/features/clients/actions";
import {
    unlinkCollaboratorFromProjectAction,
    deactivateCollaboratorAccessAction,
    reactivateCollaboratorAccessAction,
} from "@/features/external-actors/project-access-actions";
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

type ConfirmAction = {
    data: ParticipantItemData;
    type: "client" | "collaborator";
    action: "delete" | "deactivate";
};

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

    // ── Confirmation Dialog State ────────────────────────────────────────
    const [confirmTarget, setConfirmTarget] = useState<ConfirmAction | null>(null);

    // ── Derived state: split active vs inactive ─────────────────────────
    const activeClients = projectClients.filter(
        (c) => c.status === "active" && !c.is_deleted
    );
    const inactiveClients = projectClients.filter(
        (c) => c.status === "inactive" && !c.is_deleted
    );

    const activeCollaborators = projectCollaborators.filter((c) => c.is_active);
    const inactiveCollaborators = projectCollaborators.filter((c) => !c.is_active);

    const hasActiveClients = activeClients.length > 0;
    const hasInactiveClients = inactiveClients.length > 0;
    const hasActiveCollaborators = activeCollaborators.length > 0;
    const hasInactiveCollaborators = inactiveCollaborators.length > 0;
    const hasHistory = hasInactiveClients || hasInactiveCollaborators;

    // ── Handlers: Vincular Cliente ──────────────────────────────────────

    const handleLinkClient = () => {
        openModal(
            <ClientForm
                orgId={organizationId}
                roles={clientRoles}
                projectId={projectId}
            />,
            {
                title: "Agregar Cliente",
                description: "Vinculá un contacto existente o invitá un cliente por email.",
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

    // ── Handlers: Deactivate (desvincular sin borrar) ───────────────────

    const handleDeactivateClient = (participant: ParticipantItemData) => {
        setConfirmTarget({ data: participant, type: "client", action: "deactivate" });
    };

    const handleDeactivateCollaborator = (participant: ParticipantItemData) => {
        setConfirmTarget({ data: participant, type: "collaborator", action: "deactivate" });
    };

    // ── Handlers: Delete (soft delete, disappears) ──────────────────────

    const handleDeleteClient = (participant: ParticipantItemData) => {
        setConfirmTarget({ data: participant, type: "client", action: "delete" });
    };

    const handleDeleteCollaborator = (participant: ParticipantItemData) => {
        setConfirmTarget({ data: participant, type: "collaborator", action: "delete" });
    };

    // ── Handlers: Reactivate ────────────────────────────────────────────

    const handleReactivateClient = (participant: ParticipantItemData) => {
        const displayName = participant.contact_full_name || "el participante";
        startTransition(async () => {
            try {
                await reactivateClientAction(participant.id);
                toast.success(`${displayName} reactivado exitosamente`);
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Error al reactivar");
            }
        });
    };

    const handleReactivateCollaborator = (participant: ParticipantItemData) => {
        const displayName = participant.contact_full_name || "el participante";
        startTransition(async () => {
            try {
                await reactivateCollaboratorAccessAction(participant.id);
                toast.success(`${displayName} reactivado exitosamente`);
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Error al reactivar");
            }
        });
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

    // ── Confirm Action (unified) ────────────────────────────────────────

    const handleConfirmAction = () => {
        if (!confirmTarget) return;
        const displayName = confirmTarget.data.contact_full_name || "este participante";
        const { type, action, data } = confirmTarget;

        setConfirmTarget(null);

        const label = action === "delete" ? "eliminado" : "desvinculado";
        toast.success(`${displayName} ${label} del proyecto`);

        startTransition(async () => {
            try {
                if (type === "client") {
                    if (action === "delete") {
                        await deleteClientAction(data.id);
                    } else {
                        await deactivateClientAction(data.id);
                    }
                } else {
                    if (action === "delete") {
                        await unlinkCollaboratorFromProjectAction(data.id);
                    } else {
                        await deactivateCollaboratorAccessAction(data.id);
                    }
                }
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || `Error al ${action === "delete" ? "eliminar" : "desvincular"}`);
                router.refresh();
            }
        });
    };

    // ── Map collaborators to ParticipantItemData ────────────────────────

    const mapCollaborator = (col: ProjectAccessView): ParticipantItemData => ({
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
    });

    // ── Confirmation Dialog Labels ──────────────────────────────────────

    const getConfirmDialogProps = () => {
        if (!confirmTarget) return { title: "", description: <></>, confirmLabel: "" };

        const name = confirmTarget.data.contact_full_name || "este participante";
        const typeLabel = confirmTarget.type === "client" ? "cliente" : "colaborador";

        if (confirmTarget.action === "delete") {
            return {
                title: `Eliminar ${typeLabel}`,
                description: (
                    <>
                        ¿Estás seguro de que querés eliminar a{" "}
                        <strong>{name}</strong> de este proyecto?
                        Se eliminará de forma permanente y no aparecerá en el historial.
                    </>
                ),
                confirmLabel: "Eliminar",
            };
        }

        return {
            title: `Desvincular ${typeLabel}`,
            description: (
                <>
                    ¿Querés desvincular a <strong>{name}</strong> de este proyecto?
                    Se le revocará el acceso pero quedará visible en el historial.
                    Podrás reactivarlo en cualquier momento.
                </>
            ),
            confirmLabel: "Desvincular",
        };
    };

    const dialogProps = getConfirmDialogProps();

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
                            label: "Agregar Cliente",
                            icon: UserPlus,
                            onClick: handleLinkClient,
                        },
                        {
                            label: "Documentación",
                            icon: BookOpen,
                            variant: "secondary",
                            href: "/docs/equipo/clientes",
                        },
                    ]}
                >
                    {hasActiveClients ? (
                        <div className="space-y-2">
                            {activeClients.map((client) => (
                                <ParticipantListItem
                                    key={client.id}
                                    participant={client}
                                    onEdit={handleEditClient}
                                    onEditContact={handleEditContact}
                                    onDeactivate={handleDeactivateClient}
                                    onDelete={handleDeleteClient}
                                />
                            ))}
                        </div>
                    ) : (
                        <ViewEmptyState
                            mode="empty"
                            icon={Users}
                            viewName="Clientes del Proyecto"
                            featureDescription="Vinculá contactos como clientes de este proyecto para que puedan seguir el avance, ver documentos y consultar estados de cuenta."
                            actionLabel="Agregar Cliente"
                            onAction={handleLinkClient}
                            docsPath="/docs/equipo/clientes"
                        />
                    )}
                </SettingsSection>

                {/* ===== COLABORADORES SECTION (LOCKED) ===== */}
                <div className="relative">
                    {/* Locked overlay */}
                    <div className="absolute -top-1 -right-1 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/80 border border-border/50 shadow-sm backdrop-blur-sm">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">Próximamente</span>
                    </div>
                    <div className="pointer-events-none opacity-50">
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
                                {
                                    label: "Documentación",
                                    icon: BookOpen,
                                    variant: "secondary",
                                    href: "/docs/equipo/colaboradores",
                                },
                            ]}
                        >
                            {hasActiveCollaborators ? (
                                <div className="space-y-2">
                                    {activeCollaborators.map((col) => (
                                        <ParticipantListItem
                                            key={col.id}
                                            participant={mapCollaborator(col)}
                                            onDeactivate={handleDeactivateCollaborator}
                                            onDelete={handleDeleteCollaborator}
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
                                    docsPath="/docs/equipo/colaboradores"
                                />
                            )}
                        </SettingsSection>
                    </div>
                </div>

                {/* ===== HISTORICAL SECTION ===== */}
                {hasHistory && (
                    <SettingsSection
                        icon={History}
                        title="Historial"
                        description="Participantes que fueron desvinculados de este proyecto. Podés reactivarlos o eliminarlos definitivamente."
                    >
                        <div className="space-y-2">
                            {inactiveClients.map((client) => (
                                <ParticipantListItem
                                    key={client.id}
                                    participant={client}
                                    isInactive
                                    onReactivate={handleReactivateClient}
                                    onDelete={handleDeleteClient}
                                />
                            ))}
                            {inactiveCollaborators.map((col) => (
                                <ParticipantListItem
                                    key={col.id}
                                    participant={mapCollaborator(col)}
                                    isInactive
                                    onReactivate={handleReactivateCollaborator}
                                    onDelete={handleDeleteCollaborator}
                                />
                            ))}
                        </div>
                    </SettingsSection>
                )}

            </div>

            {/* ===== CONFIRMATION DIALOG ===== */}
            <DeleteConfirmationDialog
                open={!!confirmTarget}
                onOpenChange={(open) => { if (!open) setConfirmTarget(null); }}
                onConfirm={handleConfirmAction}
                title={dialogProps.title}
                description={dialogProps.description}
                confirmLabel={dialogProps.confirmLabel}
                isDeleting={isPending}
                deletingLabel={confirmTarget?.action === "delete" ? "Eliminando..." : "Desvinculando..."}
            />
        </ContentLayout>
    );
}
