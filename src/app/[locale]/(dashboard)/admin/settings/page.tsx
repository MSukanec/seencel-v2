import { PageHeader } from "@/components/layout/page-header";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Configuración Admin"
                description="Ajustes globales del panel de administración."
            />
            <div className="p-4 border border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">Contenido en construcción...</p>
            </div>
        </div>
    );
}
