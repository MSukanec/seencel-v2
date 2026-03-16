"use client";

import { useState, useTransition } from "react";
import { Users, Wrench, UserPlus, UserCheck, Lock, BookOpen, History } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { SettingsSection } from "@/components/shared/settings-section";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { ContentLayout } from "@/components/layout";
import { usePanel } from "@/stores/panel-store";
import { useContextSidebarOverlay } from "@/stores/sidebar-store";
import { DocsInlinePanel } from "@/features/docs/components/docs-inline-panel";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import {
    deleteClientAction,
    deactivateClientAction,
    reactivateClientAction,
} from "@/features/clients/actions";
import {
    revokeInvitationAction,
    resendInvitationAction,
} from "@/features/team/actions";
import {
    unlinkCollaboratorFromProjectAction,
    deactivateCollaboratorAccessAction,
    reactivateCollaboratorAccessAction,
} from "@/features/external-actors/project-access-actions";
import { EXTERNAL_ACTOR_TYPE_LABELS } from "@/features/team/types";
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
    const { openPanel } = usePanel();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { pushOverlay, hasOverlay } = useContextSidebarOverlay();

    // ── Docs Overlay ─────────────────────────────────────────────────────
    const openDocsOverlay = (docsPath: string) => {
        if (hasOverlay) return;
        const slug = docsPath.replace(/^\/(es\/|en\/)?docs\//, '');
        if (!slug) return;
        pushOverlay(
            <DocsInlinePanel slug={slug} />,
            { title: "Documentación" }
        );
    };

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
        openPanel('clients-client-form', {
            orgId: organizationId,
            roles: clientRoles,
            projectId,
        });
    };

    // ── Handlers: Editar vinculación (cambiar rol, etc.) ────────────────

    const handleEditClient = (participant: ParticipantItemData) => {
        const clientData = projectClients.find((c) => c.id === participant.id);
        if (!clientData) return;

        openPanel('clients-client-form', {
            orgId: organizationId,
            roles: clientRoles,
            projectId,
            initialData: clientData,
        });
    };

    // ── Handlers: Editar Contacto (abre el panel de contacto ya registrado) ───

    const handleEditContact = (participant: ParticipantItemData) => {
        if (!participant.contact_id) return;

        openPanel('contact-form', {
            organizationId,
            initialData: { id: participant.contact_id } as any,
            onSuccess: () => router.refresh(),
        });
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

    // ── Handlers: Send Invitation ───────────────────────────────────────

    const handleSendInvitation = (participant: ParticipantItemData) => {
        openPanel('clients-invite-portal-form', {
            clientId: participant.id,
            contactName: participant.contact_full_name,
            contactEmail: participant.contact_email,
            contactAvatarUrl: participant.contact_avatar_url,
            isSeencelUser: !!participant.linked_user_id,
        });
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

    // ── Handlers: Invitation (Reenviar / Revocar) ──────────────────────

    const handleResendInvitation = (participant: ParticipantItemData) => {
        const invitationId = (participant as any).invitation_id as string | undefined;
        if (!invitationId) {
            toast.error("No se encontró la invitación pendiente");
            return;
        }
        startTransition(async () => {
            const result = await resendInvitationAction(organizationId, invitationId);
            if (result.success) {
                toast.success("Invitación reenviada correctamente");
            } else {
                toast.error(result.error || "Error al reenviar la invitación");
            }
        });
    };

    const handleRevokeInvitation = (participant: ParticipantItemData) => {
        const invitationId = (participant as any).invitation_id as string | undefined;
        if (!invitationId) {
            toast.error("No se encontró la invitación pendiente");
            return;
        }
        startTransition(async () => {
            const result = await revokeInvitationAction(organizationId, invitationId);
            if (result.success) {
                toast.success("Invitación revocada");
                router.refresh();
            } else {
                toast.error(result.error || "Error al revocar la invitación");
            }
        });
    };

    // ── Handlers: Vincular Colaborador ──────────────────────────────────

    const handleLinkCollaborator = () => {
        openPanel('collaborator-form', {
            orgId: organizationId,
            projectId,
        });
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
        if (!confirmTarget) return {
            title: "",
            description: <></>,
            confirmLabel: "",
            validationText: undefined as string | undefined,
            validationPrompt: undefined as string | undefined,
        };

        const name = confirmTarget.data.contact_full_name || "este participante";
        const typeLabel = confirmTarget.type === "client" ? "cliente" : "colaborador";

        if (confirmTarget.action === "delete") {
            return {
                title: `Eliminar ${typeLabel}`,
                description: (
                    <div className="space-y-3 text-sm">
                        <p>
                            Estás a punto de <strong>eliminar permanentemente</strong> a{" "}
                            <strong>{name}</strong> de este proyecto.
                        </p>
                        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-1.5">
                            <p className="font-medium text-destructive">⚠️ Esta acción tiene consecuencias importantes:</p>
                            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                                <li>El {typeLabel} <strong>desaparecerá</strong> de la lista del proyecto.</li>
                                <li>Perderá acceso inmediato al portal del cliente.</li>
                                <li><strong>No podrás recuperar esta vinculación</strong> desde el producto.</li>
                                <li>Los pagos y compromisos ya registrados <strong>se mantienen</strong> en el sistema, pero quedarán sin un {typeLabel} activo.</li>
                            </ul>
                        </div>
                        <p className="text-muted-foreground">
                            Si solo querés revocarle el acceso temporalmente, usá <strong>Desvincular</strong> en su lugar — es reversible.
                        </p>
                    </div>
                ),
                confirmLabel: "Eliminar definitivamente",
                validationText: name,
                validationPrompt: `Escribí {text} para confirmar que querés eliminar a esta persona:`,
            };
        }

        // Deactivate / Desvincular
        return {
            title: `Desvincular ${typeLabel}`,
            description: (
                <div className="space-y-3 text-sm">
                    <p>
                        Estás a punto de <strong>desvincular</strong> a{" "}
                        <strong>{name}</strong> de este proyecto.
                    </p>
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
                        <p className="font-medium text-amber-600 dark:text-amber-400">Qué significa desvincular:</p>
                        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                            <li>El {typeLabel} <strong>perderá acceso al portal</strong> del proyecto.</li>
                            <li>Seguirá apareciendo en el <strong>historial</strong> del proyecto.</li>
                            <li>Podés <strong>reactivarlo en cualquier momento</strong> desde el historial.</li>
                            <li>Sus pagos y compromisos registrados <strong>no se modifican</strong>.</li>
                        </ul>
                    </div>
                    <p className="text-muted-foreground">
                        Usá esta opción si la relación con el cliente terminó o querés revocar su acceso temporalmente.
                    </p>
                </div>
            ),
            confirmLabel: "Desvincular",
            validationText: undefined,
            validationPrompt: undefined,
        };
    };

    const dialogProps = getConfirmDialogProps();

    return (
        <ContentLayout variant="settings">
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
                            onClick: () => openDocsOverlay("/docs/equipo/clientes"),
                        },
                    ]}
                >
                    {hasActiveClients ? (
                        <div className="space-y-2">
                            {activeClients.map((client) => (
                                <ParticipantListItem
                                    key={client.id}
                                    participant={{
                                        ...client,
                                        invitation_sent_at: client.invitation_sent_at ?? null,
                                        // Pass invitation_id as extended data for handlers
                                        ...(client.invitation_status === 'pending' && client.invitation_id
                                            ? { invitation_id: client.invitation_id }
                                            : {}),
                                    }}
                                    onEdit={client.invitation_status === 'pending' ? undefined : handleEditClient}
                                    onEditContact={client.invitation_status === 'pending' ? undefined : handleEditContact}
                                    onDeactivate={client.invitation_status === 'pending' ? undefined : handleDeactivateClient}
                                    onDelete={client.invitation_status === 'pending' ? undefined : handleDeleteClient}
                                    onSendInvitation={client.invitation_status === 'pending' ? undefined : handleSendInvitation}
                                    onResendInvitation={client.invitation_status === 'pending' ? handleResendInvitation : undefined}
                                    onRevokeInvitation={client.invitation_status === 'pending' ? handleRevokeInvitation : undefined}
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
                                    onClick: () => openDocsOverlay("/docs/equipo/colaboradores"),
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
                validationText={dialogProps.validationText}
                validationPrompt={dialogProps.validationPrompt}
                isDeleting={isPending}
                deletingLabel={confirmTarget?.action === "delete" ? "Eliminando..." : "Desvinculando..."}
            />
        </ContentLayout>
    );
}
