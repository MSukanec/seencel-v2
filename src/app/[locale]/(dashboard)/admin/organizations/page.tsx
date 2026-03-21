import { PageWrapper, ContentLayout } from "@/components/layout";
import { Building } from "lucide-react";

export default function AdminOrganizationsPage() {
    return (
        <PageWrapper title="Organizaciones" icon={<Building />}>
            <ContentLayout variant="wide">
                <div className="p-4 border border-dashed rounded-lg">
                    <p className="text-muted-foreground text-sm">Contenido en construcción...</p>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
