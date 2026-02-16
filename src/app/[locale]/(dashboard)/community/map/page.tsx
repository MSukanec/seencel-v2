import { getPublicProjects } from "@/actions/community";
import { CommunityMap } from "@/features/community/components";
import { ContentLayout } from "@/components/layout";
import { setRequestLocale } from 'next-intl/server';

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function CommunityMapPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const projects = await getPublicProjects();

    return (
        <ContentLayout variant="full">
            <CommunityMap projects={projects} />
        </ContentLayout>
    );
}
