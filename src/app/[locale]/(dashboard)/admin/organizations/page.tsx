import { PageHeader } from "@/components/layout/page-header";

export default function AdminOrganizationsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Organizaciones"
                description="Gestión de organizaciones registradas."
            />
            <div className="p-4 border border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">Contenido en construcción...</p>
            </div>
        </div>
    );
}
