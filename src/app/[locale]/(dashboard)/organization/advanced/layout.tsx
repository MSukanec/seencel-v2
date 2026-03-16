import { requireAuthContext } from "@/lib/auth";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Zap } from "lucide-react";

export default async function AdvancedLayout({ children }: { children: React.ReactNode }) {
    await requireAuthContext();

    return (
        <PageWrapper title="Avanzado" icon={<Zap />}>
            <ContentLayout variant="wide">
                {children}
            </ContentLayout>
        </PageWrapper>
    );
}
