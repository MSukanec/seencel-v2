import { PageWrapper, ContentLayout } from "@/components/layout";
import { CreditCard } from "lucide-react";

export default function AdminBillingPage() {
    return (
        <PageWrapper title="Facturación" icon={<CreditCard />}>
            <ContentLayout variant="wide">
                <div className="p-4 border border-dashed rounded-lg">
                    <p className="text-muted-foreground text-sm">Contenido en construcción...</p>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
