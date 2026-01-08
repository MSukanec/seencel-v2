import { getActiveOrganizationId } from "@/actions/general-costs"; // Reusing this helper
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { SettingsClient } from "@/components/organization/settings/settings-client";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ tab?: string }>;
}

export default async function OrganizationSettingsPage({ searchParams }: PageProps) {
    const orgId = await getActiveOrganizationId();
    const params = await searchParams;

    if (!orgId) {
        redirect('/');
    }

    // Fetch all settings data in parallel
    const data = await getOrganizationSettingsData(orgId);

    return (
        <SettingsClient data={data} initialTab={params.tab} />
    );
}

