import { getUserProfile } from "@/features/profile/queries";
import { LayoutSwitcher } from "@/components/layout/layout-switcher";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile } = await getUserProfile();

    return (
        <LayoutSwitcher user={profile}>
            {children}
        </LayoutSwitcher>
    );
}
