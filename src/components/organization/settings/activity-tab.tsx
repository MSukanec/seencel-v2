"use client";

import { OrganizationActivityLog } from "@/types/organization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, User } from "lucide-react";

interface ActivityTabProps {
    logs: OrganizationActivityLog[];
}

export function ActivityTab({ logs = [] }: ActivityTabProps) {
    if (logs.length === 0) {
        return (
            <div className="p-12 text-center border rounded-lg bg-muted/10 dashed border-2 border-dashed">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No hay actividad reciente</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Aún no se ha registrado ninguna actividad en esta organización.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Actividad Reciente</h2>
                <p className="text-sm text-muted-foreground">
                    Registro de eventos y cambios realizados en la organización.
                </p>
            </div>

            <Card className="border shadow-sm bg-card/50">
                <div className="divide-y divide-border/50">
                    {logs.map((log) => (
                        <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-muted/5 transition-colors">
                            <Avatar className="h-9 w-9 mt-0.5 border">
                                <AvatarImage src={log.avatar_url || ""} />
                                <AvatarFallback>
                                    <User className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    <span className="text-foreground">{log.full_name || log.email || "Usuario del sistema"}</span>
                                    <span className="text-muted-foreground font-normal"> realizó la acción </span>
                                    <span className="text-foreground font-medium">{log.action}</span>
                                </p>
                                <div className="text-xs text-muted-foreground flex gap-2 items-center">
                                    <span>en </span>
                                    <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{log.target_table}</code>
                                    <span> • </span>
                                    <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
