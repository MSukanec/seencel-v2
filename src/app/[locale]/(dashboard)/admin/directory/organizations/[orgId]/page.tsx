import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { BackButton } from "@/components/shared/back-button";
import { getAdminOrganizationDetail, getPlansForAdmin } from "@/features/admin/queries";
import { OrgProfileView } from "@/features/admin/views/org-profile-view";
import { Building2, Users } from "lucide-react";

interface PageProps {
    params: Promise<{ locale: string; orgId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { orgId } = await params;
    const org = await getAdminOrganizationDetail(orgId);
    return {
        title: `${org?.name || "Organización"} | Admin | SEENCEL`,
        description: "Detalle de organización",
        robots: "noindex, nofollow",
    };
}

export default async function AdminOrgDetailPage({ params }: PageProps) {
    const { orgId } = await params;

    try {
        const [org, plans] = await Promise.all([
            getAdminOrganizationDetail(orgId),
            getPlansForAdmin(),
        ]);

        if (!org) return notFound();

        return (
            <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={org.name}
                    icon={<Building />}
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
                                    <Building2 className="h-4 w-4" />
                                    <span>Perfil</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="members"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>Miembros ({org.members.length})</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="profile" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <OrgProfileView org={org} plans={plans} />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="members" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <OrgProfileView org={org} plans={plans} showMembersOnly />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar la organización"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
