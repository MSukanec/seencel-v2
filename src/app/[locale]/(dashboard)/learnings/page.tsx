import { getLatestCourses } from "@/actions/courses";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function LearningsDashboardPage() {
    const latestCourses = await getLatestCourses(3);

    return (
        <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
            {/* Hero Section */}
            <section className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Centro de Aprendizaje</h1>
                <p className="text-muted-foreground max-w-2xl text-lg">
                    Bienvenido a tu espacio de crecimiento. Explora cursos, documentacion y recursos para mejorar tus habilidades y sacar el máximo provecho de la plataforma.
                </p>
            </section>

            {/* Featured / Latest Courses */}
            <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-semibold tracking-tight">Nuevos Cursos</h2>
                    </div>
                    <Button variant="ghost" className="gap-2" asChild>
                        <Link href="/learnings/courses">
                            Ver todos los cursos
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {latestCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {latestCourses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed p-8 text-center flex flex-col items-center justify-center gap-4 min-h-[300px] bg-muted/20">
                        <div className="p-4 rounded-full bg-muted">
                            <GraduationCap className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-lg">Aun no hay cursos disponibles</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Estamos trabajando en contenido increible para ti. Vuelve pronto para ver los cursos que tenemos preparados.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            {/* Documentation / Quick Links Placeholder */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col gap-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Documentación</h3>
                            <p className="text-muted-foreground text-sm">Guías detalladas sobre el uso de la plataforma</p>
                        </div>
                    </div>
                </div>
                {/* Add more cards as needed */}
            </section>
        </div>
    );
}
