
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getUserProfile } from "@/features/profile/queries";
import { getCourses } from "@/actions/courses";
import { CoursesContent } from "@/features/academy/components/courses-content";

import { setRequestLocale } from 'next-intl/server';

export default async function LearningPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const { profile } = await getUserProfile();
    const courses = await getCourses();

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header variant="public" user={profile} />

            <main className="flex-1 pt-20">
                <div className="container mx-auto">
                    <CoursesContent courses={courses} detailRoute="/academy" />
                </div>
            </main>
            <Footer />
        </div>
    );
}
