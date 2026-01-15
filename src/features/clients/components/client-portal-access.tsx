"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ExternalLink,
    Copy,
    Users,
    Link as LinkIcon
} from "lucide-react";

interface Client {
    id: string;
    contact_full_name?: string | null;
    contact_email?: string | null;
    contact_avatar_url?: string | null;
    role_name?: string | null;
    is_primary?: boolean;
}

interface ClientPortalAccessProps {
    projectId: string;
    clients: Client[];
}

function getInitials(name: string | null | undefined) {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export function ClientPortalAccess({ projectId, clients }: ClientPortalAccessProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const getPortalUrl = (clientId: string) => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/es/portal/${projectId}/${clientId}`;
        }
        return `/es/portal/${projectId}/${clientId}`;
    };

    const handleCopyLink = async (clientId: string) => {
        const url = getPortalUrl(clientId);
        await navigator.clipboard.writeText(url);
        setCopiedId(clientId);
        toast.success("Link copiado al portapapeles");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleOpenPortal = (clientId: string) => {
        const url = getPortalUrl(clientId);
        window.open(url, '_blank');
    };

    if (clients.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg mb-2">No hay clientes</h3>
                    <p className="text-muted-foreground text-sm">
                        Agregá clientes al proyecto para generar sus links de acceso al portal.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5" />
                        Links de Acceso
                    </CardTitle>
                    <CardDescription>
                        Cada cliente tiene un link único para acceder a su portal personalizado.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {clients.map((client) => (
                        <div
                            key={client.id}
                            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={client.contact_avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                        {getInitials(client.contact_full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {client.contact_full_name || "Sin nombre"}
                                        {client.is_primary && (
                                            <Badge variant="outline" className="text-xs">Principal</Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {client.contact_email || client.role_name || "Cliente"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyLink(client.id)}
                                    className="gap-2"
                                >
                                    <Copy className="h-4 w-4" />
                                    {copiedId === client.id ? "¡Copiado!" : "Copiar Link"}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleOpenPortal(client.id)}
                                    className="gap-2"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir Portal
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    <p>
                        💡 <strong>Tip:</strong> Compartí el link del portal con cada cliente para que puedan ver su información de pagos y avances.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
