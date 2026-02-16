import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { BackButton } from "@/components/shared/back-button";
import { getAdminUserDetail } from "@/features/admin/queries";
import { UserProfileView } from "@/features/admin/views/user-profile-view";
import { UserActivityView } from "@/features/admin/views/user-activity-view";
import { User, Activity } from "lucide-react";

interface PageProps {
    params: Promise<{ locale: string; userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { userId } = await params;
    const user = await getAdminUserDetail(userId);
    return {
        title: `${user?.full_name || user?.email || "Usuario"} | Admin | SEENCEL`,
        description: "Detalle de usuario",
        robots: "noindex, nofollow",
    };
}

export default async function AdminUserDetailPage({ params }: PageProps) {
    const { userId } = await params;

    try {
        const user = await getAdminUserDetail(userId);

        if (!user) return notFound();

        return (
            <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={user.full_name || user.email}
                    icon={<Users />}
                    backButton={
                        <BackButton fallbackHref="/admin/directory" />
                    }
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                            <TabsTrigger
                                value="profile"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>Perfil</span>
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
                    <TabsContent value="profile" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <UserProfileView user={user} />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="activity" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <UserActivityView viewHistory={user.view_history} />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar el usuario"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
