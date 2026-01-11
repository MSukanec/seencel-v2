import { GeneralCostsClient } from "@/components/general-costs/general-costs-client";
import {
    getGeneralCostCategories,
    getGeneralCosts,
    getGeneralCostPayments,
    getGeneralCostsDashboard,
    getActiveOrganizationId
} from "@/actions/general-costs";

export default async function GeneralCostsPage() {
    // In a real app, you'd get the organization ID from the context or session.
    // For now, mirroring other pages, we might need to assume or fetch a default org.
    // However, looking at the codebase, current pages often access organization details via a layout or hardcoded/fetched ID.
    // I'll assume we need to pass a specific Organization ID. 
    // Since I don't have the context hook here (server component), I will rely on the pattern used in other pages.
    // Checking `src/app/[locale]/(dashboard)/organization/page.tsx` might help, but I'll use a placeholder or best guess based on `organization_id` being required.

    // NOTE: Replace this with the actual Organization ID retrieval mechanism.
    // Often passed via params or fetched based on user session.
    const organizationId = await getActiveOrganizationId();

    if (!organizationId) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">No active organization found.</p>
            </div>
        );
    }

    const [categories, concepts, payments, dashboardData] = await Promise.all([
        getGeneralCostCategories(organizationId),
        getGeneralCosts(organizationId),
        getGeneralCostPayments(organizationId),
        getGeneralCostsDashboard(organizationId)
    ]);

    return (
        <GeneralCostsClient
            organizationId={organizationId}
            categories={categories}
            concepts={concepts}
            payments={payments}
            dashboardData={dashboardData}
        />
    );
}
