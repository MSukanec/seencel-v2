import type { Metadata } from "next";
import { LaborPageView } from "@/features/labor/views/labor-page";
import { getUserOrganizations, getOrganizationFinancialData } from "@/features/organization/queries";
import { getProjectById } from "@/features/projects/queries";
import { getLaborPayments, getLaborTypes, getProjectLaborView } from "@/features/labor/actions";
import { getOrganizationContacts } from "@/features/clients/queries";
import { ErrorDisplay } from "@/components/ui/error-display";
import { notFound } from "next/navigation";

// ============================================
// METADATA (SEO)
// ============================================
export async function generateMetadata({
    params
}: {
    params: Promise<{ projectId: string; locale: string }>
}): Promise<Metadata> {
    const { projectId } = await params;
    const project = await getProjectById(projectId);

    return {
        title: project ? `Mano de Obra - ${project.name} | SEENCEL` : "Mano de Obra | SEENCEL",
        description: "Gestión de mano de obra, pagos y equipo del proyecto",
        robots: "noindex, nofollow", // Private dashboard
    };
}

// ============================================
// PAGE PROPS
// ============================================
interface PageProps {
    params: Promise<{
        projectId: string;
    }>;
    searchParams: Promise<{ view?: string }>;
}

// ============================================
// PAGE COMPONENT (Server Component)
// ============================================
export default async function LaborPage({ params, searchParams }: PageProps) {
    const { projectId } = await params;
    const resolvedSearchParams = await searchParams;
    const defaultTab = resolvedSearchParams.view || "overview";

    // Get active organization
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Sin organización activa"
                    message="No se pudo determinar la organización activa."
                    retryLabel="Reintentar"
                />
            </div>
        );
    }

    // Validate project exists
    const project = await getProjectById(projectId);

    if (!project) {
        notFound();
    }

    // Validate project belongs to active org
    if (project.organization_id !== activeOrgId) {
        notFound();
    }

    // Fetch real data from the database
    const [payments, laborTypes, projectLabor, financialData, contactsResult] = await Promise.all([
        getLaborPayments(projectId),
        getLaborTypes(activeOrgId),
        getProjectLaborView(projectId),
        getOrganizationFinancialData(activeOrgId),
        getOrganizationContacts(activeOrgId),
    ]);

    // Format contacts for the form combobox
    const contacts = (contactsResult.data || []).map(contact => ({
        id: contact.id,
        name: contact.full_name || "Sin Nombre",
        image: contact.image_url,
        fallback: (contact.full_name || "?").slice(0, 2).toUpperCase(),
    }));

    return (
        <LaborPageView
            projectId={projectId}
            orgId={activeOrgId}
            defaultTab={defaultTab}
            payments={payments}
            laborTypes={laborTypes}
            workers={projectLabor}
            wallets={financialData.wallets}
            currencies={financialData.currencies}
            contacts={contacts}
        />
    );
}
