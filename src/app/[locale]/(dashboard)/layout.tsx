import { getUserProfile } from "@/features/profile/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { LayoutSwitcher } from "@/components/layout/layout-switcher";

import { OrganizationProvider } from "@/context/organization-context";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile } = await getUserProfile();
    const { activeOrgId } = await getUserOrganizations();

    return (
        <OrganizationProvider activeOrgId={activeOrgId || null}>
            <LayoutSwitcher user={profile} activeOrgId={activeOrgId || undefined}>
                {children}
            </LayoutSwitcher>
        </OrganizationProvider>
    );
}
