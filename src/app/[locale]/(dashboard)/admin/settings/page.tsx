import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
    return (
        <PageWrapper type="page" title="Configuración" icon={<Settings />}>
            <ContentLayout variant="wide">
                <div className="p-4 border border-dashed rounded-lg">
                    <p className="text-muted-foreground text-sm">Contenido en construcción...</p>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
