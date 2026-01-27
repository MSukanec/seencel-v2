import type { Metadata } from "next";
import { HeartPulse } from "lucide-react";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ProjectHealthView } from "@/features/project-health/views/project-health-view";
import { getTranslations } from "next-intl/server";

interface PageProps {
    params: Promise<{
        projectId: string;
        locale: string;
    }>;
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'ProjectHealth' });
    return {
        title: `${t('title')} | SEENCEL`,
        description: t('subtitle'),
        robots: "noindex, nofollow",
    };
}

export default async function ProjectHealthPage({ params }: PageProps) {
    const { projectId } = await params;

    return (
        <PageWrapper type="page" title="Salud del Proyecto" icon={<HeartPulse />}>
            <ContentLayout variant="wide">
                <ProjectHealthView projectId={projectId} />
            </ContentLayout>
        </PageWrapper>
    );
}
