import { getCourses } from "@/actions/courses";
import { CourseCard } from "@/components/courses/course-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default async function CoursesPage() {
    const courses = await getCourses();

    return (
        <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Cursos Disponibles</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Explora nuestro catalogo completo de cursos dise?ados para potenciar tus habilidades.
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        Vuelve a intentar m?s tarde.
                    </p>
                </div>
            )}
        </div>
    );
}
