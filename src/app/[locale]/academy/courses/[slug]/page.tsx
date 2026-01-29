import { getCourseBySlug } from "@/features/academy/course-queries";
import { CourseLanding } from "@/features/academy/views/course-landing-view";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getUserProfile } from "@/features/users/queries";
import { isUserEnrolledInCourse } from "@/actions/enrollment-actions";
import { getFeatureFlag } from "@/actions/feature-flags";
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

    const [userProfile, course, isPurchaseEnabled] = await Promise.all([
        getUserProfile(),
        getCourseBySlug(slug),
        getFeatureFlag("course_purchases_enabled"),
    ]);

    if (!course) {
        notFound();
    }

    // Check if user is enrolled in this course (only if course has ID)
    const isEnrolled = course.id ? await isUserEnrolledInCourse(course.id) : false;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header variant="public" user={userProfile.profile} />
            <main>
                <CourseLanding
                    course={course}
                    isEnrolled={isEnrolled}
                    isPurchaseEnabled={isPurchaseEnabled}
                />
            </main>
            <Footer />
        </div>
    );
}

