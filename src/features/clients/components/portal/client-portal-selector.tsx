"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, Briefcase } from "lucide-react";

interface ClientInfo {
    client_id: string;
    client_name: string;
    role: string;
    can_approve: boolean;
    can_chat: boolean;
    rep_id: string;
}

interface ProjectPortal {
    project_id: string;
    project_name: string;
    clients: ClientInfo[];
}

interface ClientPortalSelectorProps {
    portals: ProjectPortal[];
}

function getInitials(name: string | null | undefined) {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export function ClientPortalSelector({ portals }: ClientPortalSelectorProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Briefcase className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Tus Portales</h1>
                    <p className="text-muted-foreground">
                        Seleccioná el proyecto al que querés acceder
                    </p>
                </div>

                <div className="space-y-6">
                    {portals.map((project) => (
                        <Card key={project.project_id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{project.project_name}</CardTitle>
                                        <CardDescription>
                                            {project.clients.length} cliente{project.clients.length !== 1 ? 's' : ''}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2">
                                    {project.clients.map((client) => (
                                        <Link
                                            key={client.client_id}
                                            href={`/portal/${project.project_id}/${client.client_id}`}
                                            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                        {getInitials(client.client_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {client.client_name || "Sin nombre"}
                                                        {client.can_approve && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Aprobador
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground capitalize">
                                                        {client.role || "Representante"}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>¿No ves tu proyecto? Contactá al administrador para que te agregue como representante.</p>
                </div>
            </div>
        </div>
    );
}

