import { getCourseById } from "@/features/courses/course-queries";
import { notFound } from "next/navigation";

export default async function TestimonialsPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;
    const course = await getCourseById(courseId);
    if (!course) notFound();

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-card text-muted-foreground">
            <h3 className="text-lg font-medium">Testimonios</h3>
            <p>Esta funcionalidad estará disponible próximamente.</p>
        </div>
    );
}
