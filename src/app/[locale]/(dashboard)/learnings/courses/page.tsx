import { getCourses } from "@/actions/courses";
import { CourseCard } from "@/components/courses/course-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";

export default async function CoursesPage() {
    const courses = await getCourses();

    return (
        <PageWrapper type="page" title="Cursos">
            <ContentLayout variant="full">
                <div className="flex flex-col h-full overflow-y-auto">
                    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                            <p className="text-muted-foreground max-w-2xl">
                                Explora nuestro catalogo completo de cursos diseñados para potenciar tus habilidades.
                            </p>
                        </div>

                        {/* Search/Filters (Visual only for now) */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar cursos..."
                                    className="pl-8 bg-background"
                                />
                            </div>
                        </div>

                        {/* Courses Grid */}
                        {courses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                                {courses.map((course) => (
                                    <CourseCard key={course.id} course={course} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed p-16 text-center flex flex-col items-center justify-center gap-4 bg-muted/20">
                                <div className="text-muted-foreground text-lg font-medium">
                                    No se encontraron cursos activos.
                                </div>
                                <p className="text-muted-foreground">
                                    Vuelve a intentar más tarde.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
