import { getCourseById, getAllInstructors } from "@/features/academy/queries";
import { notFound } from "next/navigation";
import { GeneralForm } from "@/features/academy/forms/course-general-form";

interface GeneralPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function GeneralPage({ params }: GeneralPageProps) {
    const { courseId } = await params;

    // Parallel fetching
    const [course, instructors] = await Promise.all([
        getCourseById(courseId),
        getAllInstructors()
    ]);

    if (!course) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Información General</h3>
                <p className="text-sm text-muted-foreground">
                    Modifica los datos principales del curso y su instructor.
                </p>
            </div>

            <GeneralForm course={course as any} instructors={instructors} />
        </div>
    );
}
