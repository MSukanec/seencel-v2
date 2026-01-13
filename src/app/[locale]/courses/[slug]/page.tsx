import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getUserProfile } from "@/features/profile/queries";
import { CourseContent } from "@/components/course/course-content";
import { getCourseBySlug, getAllCourseSlugs } from "@/features/courses/course-queries";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface CoursePageProps {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

// Generate static params for all courses
export async function generateStaticParams() {
    const slugs = await getAllCourseSlugs();
    return slugs.map((slug) => ({ slug }));
}

// Dynamic SEO metadata
export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
    const { slug, locale } = await params;
    const course = await getCourseBySlug(slug);

    if (!course) {
        return {
            title: "Course Not Found",
        };
    }

    const title = locale === "es"
        ? `Curso ${course.title} | SEENCEL Academy`
        : `${course.title} Course | SEENCEL Academy`;

    const description = course.subtitle;

    return {
        title,
        description,
        keywords: [
            course.title,
            "curso",
            "course",
            "BIM",
            "arquitectura",
            "architecture",
            "SEENCEL",
            "ArchiCAD",
            "online course",
        ],
        openGraph: {
            title,
            description,
            type: "website",
            images: [
                {
                    url: course.heroImage,
                    width: 1200,
                    height: 630,
                    alt: course.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [course.heroImage],
        },
    };
}

export default async function CoursePage({ params }: CoursePageProps) {
    const { slug } = await params;
    const { profile } = await getUserProfile();
    const course = await getCourseBySlug(slug);

    if (!course) {
        notFound();
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header variant="public" user={profile} />
            <main className="flex-1">
                <CourseContent course={course} isDashboard={false} />
            </main>
            <Footer />
        </div>
    );
}
