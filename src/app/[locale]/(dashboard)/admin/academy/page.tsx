import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, Video, GraduationCap } from "lucide-react";
import { getCoursesDashboardData, getAdminCourseEnrollments, getAdminCourses } from "@/features/admin/academy-queries";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { CoursesDashboard } from "@/features/academy/components/admin/courses-dashboard";
import { StudentsDataTable } from "@/features/academy/components/admin/students-table";
import { CoursesTable } from "@/features/academy/components/admin/courses-table";

import { getInstructors } from "@/features/academy/instructor-actions";
import { InstructorsTable } from "@/features/academy/components/admin/instructors-table";

export default async function AdminCoursesPage() {
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
                        <CoursesDashboard data={dashboardData} />
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="students" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <StudentsDataTable enrollments={enrollments} courses={courses} />
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="courses" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <ContentLayout variant="wide">
                            <CoursesTable courses={courses} instructors={instructors} />
                        </ContentLayout>
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="instructors" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <InstructorsTable instructors={instructors} />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
