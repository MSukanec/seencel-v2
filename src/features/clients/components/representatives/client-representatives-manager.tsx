"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    UserPlus,
    Users,
    Trash2,
    CheckCircle,
    Clock,
    Shield,
    MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { useModal } from "@/stores/modal-store";
import { removeClientRepresentativeAction } from "../../actions";

interface Representative {
    id: string;
    client_id: string;
    contact_id: string;
    role: string;
    can_approve: boolean;
    can_chat: boolean;
    accepted_at: string | null;
    rep_full_name?: string;
    rep_email?: string;
    linked_user_id?: string;
}

interface Contact {
    id: string;
    full_name?: string;
    email?: string;
    phone?: string;
    linked_user_id?: string;
    image_url?: string;
}

interface ClientRepresentativesManagerProps {
    clientId: string;
    clientName: string;
    orgId: string;
    representatives: Representative[];
    availableContacts: Contact[];
}

function getInitials(name: string | null | undefined) {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export function ClientRepresentativesManager({
    clientId,
    clientName,
    orgId,
    representatives,
    availableContacts
}: ClientRepresentativesManagerProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [isPending, startTransition] = useTransition();

    // Filter out contacts that are already representatives
    const repContactIds = new Set(representatives.map(r => r.contact_id));
    const eligibleContacts = availableContacts.filter(c => !repContactIds.has(c.id));

    const handleRemove = async (rep: Representative) => {
        if (!confirm(`¿Estás seguro de eliminar a ${rep.rep_full_name || 'este representante'}?`)) {
            return;
        }

        startTransition(async () => {
            try {
                await removeClientRepresentativeAction(rep.id);
                toast.success("Representante eliminado");
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Error al eliminar");
            }
        });
    };

    const handleAdd = () => {
        openModal(
            <AddRepresentativeForm
                clientId={clientId}
                orgId={orgId}
                contacts={eligibleContacts}
                onSuccess={() => {
                    // Close both modals (the form modal and the parent modal)
                    closeModal(); // Close form modal
                    closeModal(); // Close parent modal
                    router.refresh(); // Refresh data
                }}
            />,
            {
                title: "Agregar Representante",
                description: `Seleccionar contacto para representar a ${clientName}`
            }
        );
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-4 w-4" />
                            Representantes
                        </CardTitle>
                        <CardDescription>
                            Personas con acceso al portal de este cliente
                        </CardDescription>
                    </div>
                    <Button size="sm" onClick={handleAdd} disabled={eligibleContacts.length === 0}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Agregar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {representatives.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sin representantes</p>
                        <p className="text-xs">Agregá contactos para que accedan al portal</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {representatives.map((rep) => (
                            <div
                                key={rep.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                            {getInitials(rep.rep_full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            {rep.rep_full_name || "Sin nombre"}
                                            {rep.linked_user_id ? (
                                                <Badge variant="outline" className="text-xs gap-1 text-green-600">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Activo
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs gap-1 text-amber-600">
                                                    <Clock className="h-3 w-3" />
                                                    Pendiente
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                                            <span className="capitalize">{rep.role}</span>
                                            {rep.can_approve && (
                                                <span className="flex items-center gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    Aprobador
                                                </span>
                                            )}
                                            {rep.can_chat && (
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3" />
                                                    Chat
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleRemove(rep)}
                                    disabled={isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ===============================================
// Add Representative Form (Modal Content)
// ===============================================

import { addClientRepresentativeAction } from "../../actions";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AddRepresentativeFormProps {
    clientId: string;
    orgId: string;
    contacts: Contact[];
    onSuccess: () => void;
}

function AddRepresentativeForm({ clientId, orgId, contacts, onSuccess }: AddRepresentativeFormProps) {
    const [selectedContactId, setSelectedContactId] = useState<string>("");
    const [role, setRole] = useState("viewer");
    const [canApprove, setCanApprove] = useState(false);
    const [canChat, setCanChat] = useState(true);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!selectedContactId) {
            toast.error("Seleccioná un contacto");
            return;
        }

        startTransition(async () => {
            try {
                await addClientRepresentativeAction({
                    client_id: clientId,
                    contact_id: selectedContactId,
                    organization_id: orgId,
                    role,
                    can_approve: canApprove,
                    can_chat: canChat,
                });
                toast.success("Representante agregado");
                onSuccess();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Error al agregar");
            }
        });
    };

    const selectedContact = contacts.find(c => c.id === selectedContactId);

    return (
        <div className="space-y-6">
            {/* Contact Selector */}
            <div className="space-y-2">
                <Label>Contacto</Label>
                <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar contacto..." />
                    </SelectTrigger>
                    <SelectContent>
                        {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                                <div className="flex items-center gap-2">
                                    <span>{contact.full_name || contact.email || "Sin nombre"}</span>
                                    {contact.linked_user_id && (
                                        <Badge variant="outline" className="text-xs">
                                            Con cuenta
                                        </Badge>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedContact && !selectedContact.linked_user_id && (
                    <p className="text-xs text-amber-600">
                        ⚠️ Este contacto no tiene cuenta. Deberá crear una para acceder al portal.
                    </p>
                )}
            </div>

            {/* Role */}
            <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="viewer">Viewer (solo lectura)</SelectItem>
                        <SelectItem value="socio">Socio</SelectItem>
                        <SelectItem value="representante">Representante Legal</SelectItem>
                        <SelectItem value="contador">Contador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
                <Label>Permisos</Label>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">Puede aprobar</p>
                        <p className="text-xs text-muted-foreground">Firmar cambios y pagos</p>
                    </div>
                    <Switch checked={canApprove} onCheckedChange={setCanApprove} />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">Puede chatear</p>
                        <p className="text-xs text-muted-foreground">Enviar mensajes en el portal</p>
                    </div>
                    <Switch checked={canChat} onCheckedChange={setCanChat} />
                </div>
            </div>

            {/* Submit */}
            <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isPending || !selectedContactId}
            >
                {isPending ? "Agregando..." : "Agregar Representante"}
            </Button>
        </div>
    );
}

