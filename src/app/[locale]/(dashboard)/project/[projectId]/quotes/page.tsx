import { getUserOrganizations } from "@/features/organization/queries";
import { getProjectQuotes } from "@/features/quotes/queries";
import { getOrganizationFinancialData } from "@/features/organization/queries";
import { QuotesList } from "@/features/quotes/components/lists/quotes-list";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { FileText } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function ProjectQuotesPage({ params }: PageProps) {
    const { projectId } = await params;
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        redirect("/");
    }

    const supabase = await createClient();

    // Verify project belongs to org
    const { data: project } = await supabase
        .from("projects")
        .select("id, name, organization_id")
        .eq("id", projectId)
        .single();

    if (!project || project.organization_id !== activeOrgId) {
        notFound();
    }

    // Fetch quotes, financialData, clients, and projects in parallel
    const [quotes, financialData, contactsResult, projectsResult] = await Promise.all([
        getProjectQuotes(projectId),
        getOrganizationFinancialData(activeOrgId),
        supabase.from("contacts").select("id, first_name, last_name").eq("organization_id", activeOrgId).eq("is_deleted", false).order("first_name"),
        supabase.from("projects").select("id, name").eq("organization_id", activeOrgId).eq("is_deleted", false).order("name"),
    ]);

    // Transform contacts to have a "name" field
    const clients = (contactsResult.data || []).map(c => ({
        id: c.id,
        name: [c.first_name, c.last_name].filter(Boolean).join(" ") || "Sin nombre"
    }));

    const projects = projectsResult.data || [];

    return (
        <PageWrapper
            type="page"
            title="Presupuestos"
            icon={<FileText />}
        >
            <ContentLayout variant="wide" className="pb-6">
                <QuotesList
                    quotes={quotes}
                    organizationId={activeOrgId}
                    financialData={financialData}
                    clients={clients}
                    projects={projects}
                    projectId={projectId}
                    showProjectColumn={false}
                />
            </ContentLayout>
        </PageWrapper>
    );
}
