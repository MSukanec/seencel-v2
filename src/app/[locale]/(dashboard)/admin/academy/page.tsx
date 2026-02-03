import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, Video, GraduationCap } from "lucide-react";
import { getCoursesDashboardData, getAdminCourseEnrollments, getAdminCourses } from "@/features/admin/academy-queries";
import { getInstructors } from "@/features/academy/instructor-actions";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import {
    AdminAcademyDashboardView,
    AdminAcademyStudentsView,
    AdminAcademyCoursesView,
    AdminAcademyInstructorsView
} from "@/features/admin/academy/views";

// ✅ METADATA OBLIGATORIA
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Admin.academy' });
    return {
        title: `Academia | Seencel Admin`,
        description: "Gestión de cursos, alumnos e instructores",
        robots: "noindex, nofollow",
    };
}

export default async function AdminCoursesPage() {
    // ✅ ERROR BOUNDARY MANUAL
    try {
        const [dashboardData, enrollments, courses, instructors] = await Promise.all([
            getCoursesDashboardData(),
            getAdminCourseEnrollments(),
            getAdminCourses(),
            getInstructors()
        ]);

        return (
            <Tabs defaultValue="dashboard" className="w-full h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Academia"
                    icon={<GraduationCap />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                            <TabsTrigger
                                value="dashboard"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="students"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>Alumnos</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="courses"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    <span>Cursos</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="instructors"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>Instructores</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="dashboard" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <AdminAcademyDashboardView data={dashboardData} />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="students" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <AdminAcademyStudentsView enrollments={enrollments} courses={courses} />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="courses" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <AdminAcademyCoursesView courses={courses} instructors={instructors} />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="instructors" className="m-0 h-full focus-visible:outline-none">
                        <ContentLayout variant="wide">
                            <AdminAcademyInstructorsView instructors={instructors} />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        // ✅ MANEJO DE ERRORES AMIGABLE
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar la academia"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Recargar"
                />
            </div>
        );
    }
}
