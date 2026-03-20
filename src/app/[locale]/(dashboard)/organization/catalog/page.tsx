import type { Metadata } from "next";
import { ContentLayout, PageWrapper } from "@/components/layout";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
    title: "Catálogo Técnico | Seencel",
    description: "Visión general del catálogo técnico",
    robots: "noindex, nofollow",
};

export default async function CatalogOverviewPage() {
    return (
        <PageWrapper title="Catálogo Técnico" icon={<Wrench />}>
            <ContentLayout variant="wide">
                <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Visión General — Próximamente</p>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
