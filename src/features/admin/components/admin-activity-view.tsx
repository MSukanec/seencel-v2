"use client";

import { Activity, FileText } from "lucide-react";

interface AdminActivityViewProps {
    // Will receive audit logs data in the future
}

export function AdminActivityView({ }: AdminActivityViewProps) {
    return (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
            <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Actividad del Sistema</p>
                <p className="text-sm">Registro de actividad y audit logs de la plataforma</p>
                <p className="text-xs mt-2 text-muted-foreground/70">
                    (Los datos de /admin/audit-logs se mostrarán aquí)
                </p>
            </div>
        </div>
    );
}
