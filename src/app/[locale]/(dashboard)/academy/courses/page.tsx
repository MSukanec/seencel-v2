import { getCourses } from "@/actions/courses";
import { CoursesContent } from "@/features/academy/components/courses-content";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Video } from "lucide-react";

export default async function CoursesPage() {
    const courses = await getCourses();

    return (
        <PageWrapper type="page" title="Mis Cursos" icon={<Video />}>
            <div className="container mx-auto p-6 max-w-7xl">
                <CoursesContent courses={courses} detailRoute="/academy/courses" isDashboard={true} />
            </div>
        </PageWrapper>
    );
}
