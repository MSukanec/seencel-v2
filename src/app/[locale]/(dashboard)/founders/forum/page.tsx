import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { PageWrapper } from "@/components/layout/page/page-wrapper";
import { ContentLayout } from "@/components/layout";
import { getForumCategories, getForumThreads } from "@/actions/forum";
import { ForumContainer } from "@/components/shared/forum";
import { MessageSquare } from "lucide-react";

export async function generateMetadata() {
    return {
        title: "Foro de Fundadores | Seencel",
        description: "Espacio de discusión y debate sobre el ecosistema Seencel",
        robots: "noindex, nofollow",
    };
}

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function FoundersForumPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations("Forum");
    
    const user = await getAuthUser();
    if (!user) {
        redirect("/login" as any);
        return null;
    }

    // Fetch categories and threads for the global "Founders" context (where course_id is null)
    // Both actions have been refactored to accept null
    const [categories, threads] = await Promise.all([
        getForumCategories(null),
        getForumThreads(null),
    ]);

    return (
        <PageWrapper
            title="Foro de Fundadores"
            icon={<MessageSquare />}
        >
            <ContentLayout variant="wide">
                <ForumContainer
                    courseId={null}
                    courseSlug="founders" // Provided for consistency, although not used when courseId is null
                    categories={categories}
                    threads={threads}
                    currentUserId={user.id}
                />
            </ContentLayout>
        </PageWrapper>
    );
}
