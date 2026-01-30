import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Activity } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { getAdminDashboardData, getUserJourneys } from "@/features/admin/queries";
import { getAllActivityLogs } from "@/actions/admin-actions";
import { AdminDashboardView } from "@/features/admin/components/admin-dashboard-view";
import { AdminActivityView } from "@/features/admin/components/admin-activity-view";
import { setRequestLocale } from 'next-intl/server';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');

    const [dashboardData, activityLogs, userJourneys] = await Promise.all([
        getAdminDashboardData(),
        getAllActivityLogs(500),
        getUserJourneys(50)
    ]);

    return (
        <Tabs defaultValue="dashboard" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Visión General"
                icon={<LayoutDashboard />}
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
                            value="activity"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                <span>Actividad</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value="dashboard" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <AdminDashboardView data={dashboardData} />
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="activity" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <AdminActivityView logs={activityLogs} userJourneys={userJourneys} />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
