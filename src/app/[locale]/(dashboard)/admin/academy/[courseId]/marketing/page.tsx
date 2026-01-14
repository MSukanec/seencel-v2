import { getCourseById } from "@/features/academy/course-queries";
import { notFound } from "next/navigation";
import { MarketingForm } from "@/features/academy/components/admin/course-details/marketing-form";

interface MarketingPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function MarketingPage({ params }: MarketingPageProps) {
    const { courseId } = await params;
    const course = await getCourseById(courseId);

    if (!course) {
        notFound();
    }

    // course.details contains the JSONB 'details' (duration, level, etc.)
    // course already contains heroImage, heroVideo mapped.
    // course.badgeText is newly mapped.

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Marketing y Landing Page</h3>
                <p className="text-sm text-muted-foreground">
                    Gestiona los assets visuales y contenido de venta.
                </p>
            </div>

            <MarketingForm course={course} details={course.details} />
        </div>
    );
}
