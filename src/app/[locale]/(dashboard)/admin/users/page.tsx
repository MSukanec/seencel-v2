import { PageWrapper, ContentLayout } from "@/components/layout";
import { Users } from "lucide-react";

export default function AdminUsersPage() {
    return (
        <PageWrapper title="Usuarios" icon={<Users />}>
            <ContentLayout variant="wide">
                <div className="p-4 border border-dashed rounded-lg">
                    <p className="text-muted-foreground text-sm">Contenido en construcción...</p>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
