import { getCourseById } from "@/features/academy/course-queries";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/features/academy/components/admin/course-details/content-editor";

interface ContentPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function ContentPage({ params }: ContentPageProps) {
    const { courseId } = await params;
    const course = await getCourseById(courseId, { includeContent: true });

    if (!course) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Contenido del Curso</h3>
                <p className="text-sm text-muted-foreground">
                    Organiza los módulos y lecciones.
                </p>
            </div>

            <ContentEditor course={course} />
        </div>
    );
}
