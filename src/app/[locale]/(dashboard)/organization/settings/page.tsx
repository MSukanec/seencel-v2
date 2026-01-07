import { getActiveOrganizationId } from "@/actions/general-costs"; // Reusing this helper
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { SettingsClient } from "@/components/organization/settings/settings-client";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsPage() {
    const orgId = await getActiveOrganizationId();

    if (!orgId) {
        redirect('/');
    }

    // Fetch all settings data in parallel
    const data = await getOrganizationSettingsData(orgId);

    return (
        <SettingsClient data={data} />
    );
}
