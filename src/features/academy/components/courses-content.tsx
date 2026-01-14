
import { CourseWithDetails } from "@/types/courses";
import { CourseCard } from "./course-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface CoursesContentProps {
    courses: CourseWithDetails[];
    isDashboard?: boolean;
    detailRoute?: string;
}

export function CoursesContent({ courses, isDashboard = false, detailRoute = '/academy' }: CoursesContentProps) {
    const t = useTranslations('Learning');

    // Assuming t('title') works here if wrapped in NextIntlClientProvider or similar, 
    // but this is a Server Component or Client?
    // CourseCard uses Link from routing.ts which is client-compatible.
    // If this component is Server Component, useTranslations works.

    // We'll mimic the "FoundersContent" pattern.
    // However, the original code had "Cursos" hardcoded or translated.

    // Original text: "Explora nuestro catalogo completo de cursos..."

    return (
        <div className="flex flex-col h-full w-full">
            <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 p-4 md:p-8">

                {/* Title Section - Rendered in both views for consistency */}
                <div className="flex flex-col gap-4 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto md:mx-0 text-lg">
                        {t('description')}
                    </p>
                </div>

                {/* Search/Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative w-full max-w-sm mx-auto md:mx-0">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar cursos..." // Could translate this too if key exists
                            className="pl-9 bg-background h-10 rounded-full md:rounded-md"
                        />
                    </div>
                </div>

                {/* Courses Grid */}
                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} basePath={detailRoute} />
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
    );
}
