import { getUserOrganizations, getOrganizationFinancialData } from "@/features/organization/queries";
import { getOrganizationQuotes } from "@/features/quotes/queries";
import { QuotesListView } from "@/features/quotes/views";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface QuotesPageProps {
    searchParams: Promise<{ view?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
    const { activeOrgId } = await getUserOrganizations();
    const params = await searchParams;

    if (!activeOrgId) {
        redirect("/");
    }

    const supabase = await createClient();

    // Fetch quotes, financialData, clients (contacts), and projects in parallel
    const [quotes, financialData, contactsResult, projectsResult] = await Promise.all([
        getOrganizationQuotes(activeOrgId),
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
        <QuotesListView
            organizationId={activeOrgId}
            projectId={null}
            quotes={quotes}
            financialData={financialData}
            clients={clients}
            projects={projects}
            defaultTab={params.view || "quotes"}
        />
    );
}
