import {
    getCourseBySlug,
    getCourseOverviewData,
} from "@/features/academy/student-actions";
import { CourseCertificateView } from "@/features/academy/views";
import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const generateMetadata = async (): Promise<Metadata> => ({
    title: 'Certificado del Curso | Seencel',
    robots: 'noindex, nofollow',
});

interface PageProps {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
}

export default async function CourseCertificatePage({ params }: PageProps) {
    const { slug, locale } = await params;
    setRequestLocale(locale);

    const { userId } = await requireAuthContext();

    const course = await getCourseBySlug(slug);
    if (!course) notFound();

    // Fetch user details for the certificate
    const supabase = await createClient();
    const { data: userData } = await supabase
        .schema('iam')
        .from('user_data')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
    
    // Construct full name
    const studentName = userData 
        ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() 
        : 'Estudiante';

    // Overview data gives us the progress info
    const overviewData = await getCourseOverviewData(course.id);
    
    // Check if the user has completed the course (progress = 100)
    const isCompleted = (overviewData?.progressPct ?? 0) >= 100;

    // Fetch instructor
    let instructorName = "Instructor";
    if (course.details?.instructor_id) {
        const { data: instructorData } = await supabase
            .schema('academy')
            .from('course_instructors')
            .select('name')
            .eq('id', course.details.instructor_id)
            .single();
        if (instructorData?.name) {
            instructorName = instructorData.name;
        }
    }

    return (
        <CourseCertificateView
            course={course}
            studentName={studentName || "Estudiante"}
            instructorName={instructorName}
            isCompleted={isCompleted}
            completionDate={isCompleted ? new Date().toISOString() : undefined}
            courseSlug={slug}
        />
    );
}
