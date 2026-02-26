import type { Metadata } from "next";
import { redirect } from "@/i18n/routing";
import { getUserOrganizations, getOrganizationFinancialData } from "@/features/organization/queries";
import { getOrganizationQuotes } from "@/features/quotes/queries";
import { QuotesListView } from "@/features/quotes/views/quotes-list-view";
import { createClient } from "@/lib/supabase/server";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { FileText } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Presupuestos | SEENCEL",
        description: "Gestión de presupuestos, cotizaciones y contratos",
        robots: "noindex, nofollow",
    };
}

export default async function QuotesPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ view?: string }>;
}) {
    const { locale } = await params;
    const resolvedParams = await searchParams;

    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) {
        redirect({ href: "/organization", locale });
    }

    try {
        const supabase = await createClient();

        const [quotes, financialData, contactsResult, projectsResult] = await Promise.all([
            getOrganizationQuotes(activeOrgId),
            getOrganizationFinancialData(activeOrgId),
            // contacts_view tiene resolved_avatar_url (Google OAuth + uploads propios)
            supabase
                .schema('projects').from("contacts_view")
                .select("id, full_name, resolved_avatar_url")
                .eq("organization_id", activeOrgId)
                .eq("is_deleted", false)
                .order("full_name")
                .limit(500),
            // projects_view: solo activos, con image_url y color para avatares en ProjectField
            supabase
                .schema('projects').from("projects_view")
                .select("id, name, image_url, color")
                .eq("organization_id", activeOrgId)
                .eq("is_deleted", false)
                .eq("status", "active")
                .order("name")
                .limit(200),
        ]);

        const clients = (contactsResult.data || []).map((c) => ({
            id: c.id,
            name: c.full_name || "Sin nombre",
            resolved_avatar_url: c.resolved_avatar_url,
        }));

        const projects = projectsResult.data || [];


        return (
            <PageWrapper type="page" title="Presupuestos" icon={<FileText />}>
                <ContentLayout variant="wide">
                    <QuotesListView
                        organizationId={activeOrgId}
                        projectId={null}
                        quotes={quotes}
                        financialData={financialData}
                        clients={clients}
                        projects={projects}
                        defaultTab={resolvedParams.view || "quotes"}
                    />
                </ContentLayout>
            </PageWrapper>
        );
    } catch (error) {
        return (
            <PageWrapper type="page" title="Presupuestos" icon={<FileText />}>
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar presupuestos"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </PageWrapper>
        );
    }
}
