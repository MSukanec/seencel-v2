import { getCourseById } from "@/features/courses/course-queries";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseTabs } from "./_components/course-tabs";

interface CourseLayoutProps {
    children: React.ReactNode;
    params: Promise<{ courseId: string }>;
}

export default async function CourseLayout({ children, params }: CourseLayoutProps) {
    const { courseId } = await params;
    const course = await getCourseById(courseId);

    if (!course) {
        notFound();
    }

    return (
        <div className="flex flex-col h-full">
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center px-6 gap-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/admin/courses">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2 overflow-hidden">
                        <h1 className="text-lg font-semibold truncate">
                            {course.title}
                        </h1>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sm text-muted-foreground truncate font-mono">
                            {course.slug}
                        </span>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        {/* Global Actions like Preview Public Page */}
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/courses/${course.slug}`} target="_blank">
                                Ver página pública
                            </Link>
                        </Button>
                    </div>
                </div>
                <CourseTabs courseId={courseId} />
            </div>

            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-5xl mx-auto space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
