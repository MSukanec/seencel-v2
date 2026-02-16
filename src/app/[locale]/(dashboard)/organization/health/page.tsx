import type { Metadata } from "next";
import { HeartPulse } from "lucide-react";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ProjectHealthView } from "@/features/project-health/views/project-health-view";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ProjectHealth' });
    return {
        title: `${t('title')} | SEENCEL`,
        description: t('subtitle'),
        robots: "noindex, nofollow",
    };
}

export default async function HealthPage() {
    return (
        <PageWrapper type="page" title="Salud" icon={<HeartPulse />}>
            <ContentLayout variant="wide">
                <ProjectHealthView />
            </ContentLayout>
        </PageWrapper>
    );
}
