"use client";

import { useState, useTransition } from "react";
import { ExternalActorDetail, EXTERNAL_ACTOR_TYPE_LABELS } from "@/features/team/types";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase, Plus, RefreshCw, Eye, Ban } from "lucide-react";
import { usePanel } from "@/stores/panel-store";
import { useAccessActions } from "@/stores/access-context-store";
import { removeExternalActorAction, reactivateExternalActorAction } from "@/features/team/actions";
import { ListItem } from "@/components/shared/list-item";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/layout";
import { SettingsSection } from "@/components/shared/settings-section";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/i18n/routing";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExternalAccessViewProps {
    organizationId: string;
    actors: ExternalActorDetail[];
    projects: any[]; // Used for context if needed later
    actorType: "client" | "advisor";
}

export function ExternalAccessView({ organizationId, actors, actorType }: ExternalAccessViewProps) {
    const { openPanel } = usePanel();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [actorToRemove, setActorToRemove] = useState<ExternalActorDetail | null>(null);

    const isClient = actorType === "client";
    const icon = isClient ? Building2 : Briefcase;
    const title = isClient ? "Clientes" : "Colaboradores";
    const description = isClient 
        ? "Visualizá los clientes con acceso a tus proyectos. Los clientes se invitan desde la configuración de cada proyecto."
        : "Vinculá contadores, directores de obra y otros asesores que requieran acceso limitado sin consumir un asiento de miembro.";

    const handleInvite = () => {
        if (isClient) {
            openPanel('team-add-client-form', { organizationId });
        } else {
            openPanel('team-add-external-form', { organizationId });
        }
    };

    const { setViewingAs } = useAccessActions();

    const handleSimulateView = () => {
        if (isClient) {
            // Simulate client portal
            router.push('/client-portal' as any);
        } else {
            // Activate "Viewing As" mode for accountant simulation
            setViewingAs({
                actorType: 'accountant',
                isSimulation: true,
                userName: 'Contador (Simulación)',
            });
            toast.success('Modo simulación activado. Estás viendo la plataforma como un Contador.');
            // Navigate to organization context so the sidebar switches to external nav
            router.push('/organization' as any);
        }
    };

    const handleRemoveActor = (actor: ExternalActorDetail) => {
        setActorToRemove(null);
        startTransition(async () => {
            const result = await removeExternalActorAction(organizationId, actor.id);
            if (result.success) {
                toast.success('Baja registrada exitosamente');
                router.refresh();
            } else {
                toast.error(result.error || 'Error al procesar la baja');
            }
        });
    };

    const handleReactivateActor = (actorId: string) => {
        startTransition(async () => {
            const result = await reactivateExternalActorAction(organizationId, actorId);
            if (result.success) {
                toast.success('Acceso reactivado');
                router.refresh();
            } else {
                toast.error(result.error || 'Error reactivando acceso');
            }
        });
    };

    return (
        <div className="space-y-6 flex flex-col min-h-[calc(100vh-140px)]">
            <PageIntro
                icon={icon}
                title={title}
                description={description}
                action={<Button variant="outline" size="sm" onClick={handleSimulateView}><Eye className="w-4 h-4 mr-2" /> {isClient ? "Ver como Cliente" : "Ver como Asesor"}</Button>}
            />

            <SettingsSection
                contentVariant="inset"
                icon={icon}
                title={isClient ? "Listado de Clientes" : "Listado de Colaboradores"}
                description={isClient ? "Todos los clientes vinculados a tus proyectos" : "Asesores con acceso especial a tus herramientas y reportes"}
                actions={isClient ? [] : [
                    {
                        label: "Invitar Colaborador",
                        icon: Plus,
                        onClick: handleInvite
                    }
                ]}
            >
                <div className="space-y-2">
                    {actors.length === 0 ? (
                        <ViewEmptyState
                            mode="empty"
                            icon={icon}
                            viewName={isClient ? "Clientes" : "Colaboradores"}
                            featureDescription={description}
                            {...(!isClient && {
                                onAction: handleInvite,
                                actionLabel: "Invitar Colaborador",
                            })}
                        />
                    ) : (
                        actors.map(actor => (
                            <ListItem key={actor.id} variant="row">
                                <ListItem.Leading>
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-medium overflow-hidden border">
                                        {actor.user_avatar_url ? (
                                            <img src={actor.user_avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>
                                                {actor.user_full_name ? actor.user_full_name.charAt(0).toUpperCase() : (actor.user_email || "?").charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </ListItem.Leading>
                                <ListItem.Content>
                                    <ListItem.Title className={!actor.is_active ? "text-muted-foreground line-through decoration-muted-foreground/50" : ""}>
                                        {actor.user_full_name || "Usuario No Registrado"}
                                    </ListItem.Title>
                                    <ListItem.Badges>
                                        <Badge variant="secondary" className="font-normal px-2 h-5 text-[10px]">
                                            {EXTERNAL_ACTOR_TYPE_LABELS[actor.actor_type]?.label || actor.actor_type}
                                        </Badge>
                                        {!actor.is_active && (
                                            <Badge variant="destructive" className="font-normal px-2 h-5 text-[10px]">Inactivo</Badge>
                                        )}
                                    </ListItem.Badges>
                                    <div className="text-sm text-muted-foreground mt-0.5">
                                        {actor.user_email}
                                    </div>
                                </ListItem.Content>
                                <ListItem.Trailing>
                                    {actor.is_active ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            disabled={isPending}
                                            onClick={() => setActorToRemove(actor)}
                                        >
                                            <Ban className="w-4 h-4 mr-2" />
                                            Dar de Baja
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isPending}
                                            onClick={() => handleReactivateActor(actor.id)}
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Reactivar
                                        </Button>
                                    )}
                                </ListItem.Trailing>
                            </ListItem>
                        ))
                    )}
                </div>
            </SettingsSection>

            {/* Remove Confirmation Dialog */}
            <AlertDialog open={!!actorToRemove} onOpenChange={(open) => !open && setActorToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Dar de baja a {actorToRemove?.user_full_name || "este asesor"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Al dar de baja a <strong className="text-foreground">{actorToRemove?.user_full_name}</strong>, perderá el acceso a la organización mediante su rol especial.
                            Podrás reactivarlo en el futuro si es necesario.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => actorToRemove && handleRemoveActor(actorToRemove)}
                            disabled={isPending}
                        >
                            {isPending ? "Procesando..." : "Dar de Baja"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
