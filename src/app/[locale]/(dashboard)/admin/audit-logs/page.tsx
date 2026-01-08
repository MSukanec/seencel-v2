import { PageHeader } from "@/components/layout/page-header";

export default function AdminAuditLogsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Registros de Auditoría"
                description="Logs de actividad de administradores."
            />
            <div className="p-4 border border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">Contenido en construcción...</p>
            </div>
        </div>
    );
}
