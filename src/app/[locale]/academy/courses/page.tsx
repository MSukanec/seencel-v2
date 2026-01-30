import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile } from "@/features/users/queries";
import { getCourses, getUserEnrollments } from "@/actions/courses";
import { CoursesContent } from "@/features/academy/components/courses-content";
import { getFeatureFlag } from "@/actions/feature-flags";

import { setRequestLocale } from 'next-intl/server';

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const [{ profile }, courses, enrolledCourseIds, isPurchaseEnabled] = await Promise.all([
        getUserProfile(),
        getCourses(),
        getUserEnrollments(),
        getFeatureFlag("course_purchases_enabled")
    ]);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header variant="public" user={profile} />

            <main className="flex-1 pt-20">
                <div className="container mx-auto">
                    <CoursesContent
                        courses={courses}
                        detailRoute="/academy/courses"
                        enrolledCourseIds={Array.from(enrolledCourseIds)}
                        isPurchaseEnabled={isPurchaseEnabled}
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
}
