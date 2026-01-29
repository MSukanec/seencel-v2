import { getPublicProjects } from "@/actions/community";
import { CommunityMap } from "@/features/community/components";
import { ContentLayout } from "@/components/layout";
import { ComingSoonBlock } from "@/components/ui/coming-soon-block";
import { checkIsAdmin } from "@/features/users/queries";
import { setRequestLocale } from 'next-intl/server';

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function CommunityMapPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const [projects, isAdmin] = await Promise.all([
        getPublicProjects(),
        checkIsAdmin()
    ]);

    return (
        <ComingSoonBlock
            isAdmin={isAdmin}
            title="Mapa Seencel"
            description="Explora proyectos de arquitectura de toda la comunidad Seencel. Próximamente podrás ver obras increíbles de estudios de todo el mundo."
        >
            <ContentLayout variant="full">
                <CommunityMap projects={projects} />
            </ContentLayout>
        </ComingSoonBlock>
    );
}
