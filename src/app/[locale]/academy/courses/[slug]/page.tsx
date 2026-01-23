import { getCourseBySlug } from "@/features/academy/course-queries";
import { CourseLanding } from "@/features/academy/views/course-landing-view";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile } from "@/features/profile/queries";
import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

export default async function PublicCoursePage({ params }: PageProps) {
    const { slug, locale } = await params;
    setRequestLocale(locale);

    const userProfile = await getUserProfile();
    const course = await getCourseBySlug(slug);

    if (!course) {
        notFound();
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header variant="public" user={userProfile.profile} />
            <main>
                <CourseLanding course={course} />
            </main>
            <Footer />
        </div>
    );
}
